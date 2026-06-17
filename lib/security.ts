import { prisma } from './prisma'

export type SecurityEventType =
  | 'DISPUTE'
  | 'PAYMENT_FAILED'
  | 'TRANSFER_FAILED'
  | 'RATE_LIMIT'
  | 'CONCENTRATION_RISK'
  | 'RESGATE_LOCK'
  | 'ACCOUNT_SUSPENDED'
  | 'SUSPICIOUS_PURCHASE'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface LogSecurityEventParams {
  type: SecurityEventType
  severity: Severity
  userId?: string
  tokenId?: string
  stripeId?: string
  details?: Record<string, unknown>
}

export async function logSecurityEvent(params: LogSecurityEventParams) {
  try {
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        type: params.type,
        severity: params.severity,
        userId: params.userId,
        tokenId: params.tokenId,
        stripeId: params.stripeId,
        details: params.details ?? {},
      },
    })

    // Alerta por e-mail para eventos críticos/altos via Resend (ou log no console para piloto)
    if (params.severity === 'CRITICAL' || params.severity === 'HIGH') {
      await sendAdminAlert(params)
    }
  } catch (err) {
    console.error('[security] Falha ao registrar evento:', err)
  }
}

async function sendAdminAlert(params: LogSecurityEventParams) {
  const adminEmail = process.env.ADMIN_EMAIL
  const resendKey = process.env.RESEND_API_KEY

  if (!adminEmail || !resendKey) {
    console.warn(`[security] ALERTA [${params.severity}] ${params.type}`, params.details)
    return
  }

  const body = {
    from: 'seguranca@oryon.ag',
    to: adminEmail,
    subject: `🚨 [${params.severity}] AgroToken — ${params.type}`,
    html: `
      <h2>Evento de Segurança Detectado</h2>
      <table>
        <tr><td><b>Tipo</b></td><td>${params.type}</td></tr>
        <tr><td><b>Severidade</b></td><td>${params.severity}</td></tr>
        ${params.userId ? `<tr><td><b>Usuário</b></td><td>${params.userId}</td></tr>` : ''}
        ${params.tokenId ? `<tr><td><b>Token</b></td><td>${params.tokenId}</td></tr>` : ''}
        ${params.stripeId ? `<tr><td><b>Stripe ID</b></td><td>${params.stripeId}</td></tr>` : ''}
        <tr><td><b>Detalhes</b></td><td><pre>${JSON.stringify(params.details, null, 2)}</pre></td></tr>
      </table>
      <p><a href="https://agroos.site/dashboard/admin/tokens">Ver painel admin</a></p>
    `,
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})
}

// ─── Mascaramento para exibição (Item 32 — Exposição mínima de dados) ───────

/** jo***@email.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || local.length <= 2) return `${local[0]}***@${domain ?? ''}`
  return `${local.slice(0, 2)}***@${domain}`
}

/** (85) *****-1234 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^55/, '')
  if (digits.length < 10) return '(**) *****-****'
  const ddd = digits.slice(0, 2)
  const last4 = digits.slice(-4)
  return `(${ddd}) *****-${last4}`
}

/** ***.***.456-78 */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return '***.***.***-**'
  return `***.***${digits.slice(6, 9)}-${digits.slice(9)}`
}

// Verifica se usuário está em rate limit (mais de 3 tentativas em 5 minutos)
export async function isRateLimited(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 5 * 60 * 1000)
  const count = await prisma.securityEvent.count({
    where: { userId, type: 'RATE_LIMIT', createdAt: { gte: since } },
  })
  return count >= 3
}

// Verifica concentração: um comprador não pode ter mais de 40% de um token
export async function checkConcentrationRisk(
  tokenId: string,
  buyerId: string,
  qtyToBuy: number,
  totalTokens: number
): Promise<{ blocked: boolean; reason?: string }> {
  const existing = await prisma.tokenTransaction.aggregate({
    where: { tokenId, buyerId, type: 'BUY' },
    _sum: { quantity: true },
  })
  const alreadyOwns = existing._sum.quantity ?? 0
  const afterPurchase = alreadyOwns + qtyToBuy
  const pct = (afterPurchase / totalTokens) * 100

  if (pct > 40) {
    return {
      blocked: true,
      reason: `Um investidor não pode deter mais de 40% de um token. Você já possui ${alreadyOwns} tokens (${((alreadyOwns / totalTokens) * 100).toFixed(0)}%).`,
    }
  }
  return { blocked: false }
}

// Token precisa ter pelo menos 3 dias de ACTIVE antes de poder ser resgatado
export async function checkResgateLock(
  tokenUpdatedAt: Date
): Promise<{ blocked: boolean; daysLeft?: number }> {
  const MIN_DAYS = 3
  const diffMs = Date.now() - tokenUpdatedAt.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < MIN_DAYS) {
    return { blocked: true, daysLeft: Math.ceil(MIN_DAYS - diffDays) }
  }
  return { blocked: false }
}
