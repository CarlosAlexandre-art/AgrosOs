import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const RESEND_KEY = process.env.RESEND_API_KEY
const ADVOGADA_EMAIL = process.env.ORYON_LEGAL_EMAIL ?? 'alexandre@oryonag.com.br'
const ADVOGADA_WHATSAPP = process.env.ADVOGADA_WHATSAPP ?? '5585986027333'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'ORYON Legal <noreply@oryonag.com.br>', to, subject, html }),
  })
}

function emailBase(titulo: string, conteudo: string) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px">
    <div style="background:#1e3a5f;color:white;padding:24px 20px;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:18px">⚖️ ${titulo}</h2>
      <p style="margin:6px 0 0;opacity:0.7;font-size:12px">ORYON Legal · Ecossistema OryonAG</p>
    </div>
    <div style="background:#f9fafb;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
      ${conteudo}
    </div>
  </div>`
}

function campo(label: string, value: string) {
  return `<div style="padding:10px 0;border-bottom:1px solid #e5e7eb">
    <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;margin-bottom:3px">${label}</div>
    <div style="font-size:15px;font-weight:600;color:#111827">${value}</div>
  </div>`
}

// GET — lista reuniões (advogada)
export async function GET(req: NextRequest) {
  const senha = req.nextUrl.searchParams.get('senha')
  if (senha !== process.env.ADVOGADA_SENHA) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const reunioes = await prisma.reuniaoLegal.findMany({
    include: { lead: true, slot: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(reunioes)
}

// POST — cliente solicita reunião após diagnóstico
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId, slotId, modalidade, observacoes } = body

    const reuniao = await prisma.reuniaoLegal.create({
      data: { leadId, slotId, modalidade: modalidade ?? 'ONLINE', observacoes, status: 'PENDENTE' },
      include: { lead: true, slot: true },
    })

    // Marcar slot como ocupado
    if (slotId) {
      await prisma.slotDisponivel.update({ where: { id: slotId }, data: { ocupado: true } })
    }

    const lead = reuniao.lead
    const slot = reuniao.slot
    const dataHora = slot ? new Date(slot.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Fortaleza' }) : 'A definir'
    const mod = reuniao.modalidade === 'ONLINE' ? '💻 Online' : '📍 Presencial'

    // Email para advogada
    const htmlAdvogada = emailBase('Nova Solicitação de Reunião', `
      ${campo('Cliente', lead.nome)}
      ${campo('WhatsApp', `<a href="https://wa.me/${lead.telefone.replace(/\D/g,'')}" style="color:#1d4ed8">${lead.telefone}</a>`)}
      ${campo('E-mail', lead.email || '—')}
      ${campo('Score Jurídico', `${lead.score ?? '—'}/100 — ${lead.nivel ?? '—'}`)}
      ${campo('Data solicitada', dataHora)}
      ${campo('Modalidade', mod)}
      ${campo('Observações', observacoes || '—')}
      <div style="margin-top:16px;padding:14px;background:#eff6ff;border-radius:10px;border-left:4px solid #1d4ed8">
        <p style="margin:0;font-size:13px;color:#1e40af">Diagnóstico: ${lead.recomendacao || '—'}</p>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-direction:column">
        <a href="https://wa.me/${lead.telefone.replace(/\D/g,'')}?text=Olá%20${encodeURIComponent(lead.nome)}%2C%20confirmo%20sua%20reunião%20para%20${encodeURIComponent(dataHora)}."
           style="display:block;text-align:center;background:#25d366;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:800">
          💬 Confirmar via WhatsApp
        </a>
        <a href="https://agroos.site/legal/advogada"
           style="display:block;text-align:center;background:#1d4ed8;color:white;padding:12px;border-radius:10px;text-decoration:none;font-weight:700">
          📅 Gerenciar no painel
        </a>
      </div>
    `)
    await sendEmail(ADVOGADA_EMAIL, `📅 Nova reunião — ${lead.nome}`, htmlAdvogada)

    // Email para cliente
    if (lead.email) {
      const htmlCliente = emailBase('Reunião Solicitada com Sucesso', `
        ${campo('Data', dataHora)}
        ${campo('Modalidade', mod)}
        <div style="margin-top:16px;padding:14px;background:#f0fdf4;border-radius:10px;border-left:4px solid #15803d">
          <p style="margin:0;font-size:13px;color:#166534">Nossa especialista irá confirmar em breve. Você receberá uma notificação por e-mail.</p>
        </div>
      `)
      await sendEmail(lead.email, '📅 Sua reunião foi solicitada — ORYON Legal', htmlCliente)
    }

    return NextResponse.json(reuniao)
  } catch (err) {
    console.error('reuniao error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH — advogada confirma/reagenda/cancela
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, senha, status, linkOnline, observacoes, novoSlotId } = body

    if (senha !== process.env.ADVOGADA_SENHA) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const reuniao = await prisma.reuniaoLegal.update({
      where: { id },
      data: {
        status,
        linkOnline,
        observacoes,
        ...(novoSlotId ? { slotId: novoSlotId } : {}),
      },
      include: { lead: true, slot: true },
    })

    const lead = reuniao.lead
    const slot = reuniao.slot
    const dataHora = slot ? new Date(slot.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Fortaleza' }) : 'A definir'

    const statusLabel: Record<string, string> = {
      CONFIRMADA: '✅ Reunião Confirmada',
      REAGENDADA: '🔄 Reunião Reagendada',
      CANCELADA: '❌ Reunião Cancelada',
      CONCLUIDA: '🏁 Reunião Concluída',
    }

    // Gerar link Google Calendar
    const gcalStart = slot ? new Date(slot.data).toISOString().replace(/[-:]/g,'').split('.')[0]+'Z' : ''
    const gcalEnd = slot ? new Date(new Date(slot.data).getTime() + (slot.durMinutos * 60000)).toISOString().replace(/[-:]/g,'').split('.')[0]+'Z' : ''
    const gcalLink = gcalStart ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consultoria ORYON Legal')}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(`Reunião com ${lead.nome}. ${linkOnline ? 'Link: '+linkOnline : ''}`)}` : ''

    // Email para cliente
    if (lead.email) {
      const htmlCliente = emailBase(statusLabel[status] ?? 'Atualização da sua reunião', `
        ${campo('Status', statusLabel[status] ?? status)}
        ${campo('Data', dataHora)}
        ${campo('Modalidade', reuniao.modalidade === 'ONLINE' ? '💻 Online' : '📍 Presencial')}
        ${linkOnline ? campo('Link da reunião', `<a href="${linkOnline}" style="color:#1d4ed8">${linkOnline}</a>`) : ''}
        ${observacoes ? campo('Observações', observacoes) : ''}
        ${gcalLink && status === 'CONFIRMADA' ? `
          <a href="${gcalLink}" target="_blank"
             style="display:block;margin-top:16px;text-align:center;background:#1d4ed8;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:700">
            📅 Adicionar ao Google Calendar
          </a>` : ''}
      `)
      await sendEmail(lead.email, `${statusLabel[status] ?? 'Atualização'} — ORYON Legal`, htmlCliente)
    }

    return NextResponse.json(reuniao)
  } catch (err) {
    console.error('reuniao patch error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
