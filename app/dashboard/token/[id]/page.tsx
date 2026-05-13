'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Transaction = {
  id: string
  quantity: number
  pricePerToken: number
  totalAmount: number
  commission: number
  createdAt: string
  buyer: { name: string; email: string }
}

type AgroToken = {
  id: string
  type: 'SAFRA' | 'MATERIAL' | 'MAQUINARIO'
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REDEEMED' | 'CANCELLED'
  title: string
  description: string | null
  totalValue: number
  tokenPrice: number
  totalTokens: number
  soldTokens: number
  expectedReturn: number | null
  periodMonths: number | null
  commodity: string | null
  quantityKg: number | null
  deliveryDate: string | null
  materialType: string | null
  quantity: number | null
  unit: string | null
  machineType: string | null
  machineModel: string | null
  machineYear: number | null
  usageHours: number | null
  fieldId: string | null
  blockchainTx: string | null
  contractUrl: string | null
  createdAt: string
  property: { name: string; fields: { id: string; name: string }[] }
}

const TYPE_LABEL: Record<string, string> = { SAFRA: 'Safra', MATERIAL: 'Material', MAQUINARIO: 'Maquinário' }
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING_REVIEW: 'Em análise', ACTIVE: 'Ativo', REDEEMED: 'Resgatado', CANCELLED: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700', REDEEMED: 'bg-blue-100 text-blue-700', CANCELLED: 'bg-red-100 text-red-700',
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  )
}

type Laudo = {
  produtor: string
  kycVerificado: boolean
  propriedade: string
  areaHectares: number
  talhoes: number
  receitaAnual: number
  margemPct: number
  atividadesConcluidas: number
  agroRateScore: number | null
  agroRateCategoria: string | null
  scoreConfianca: number
  nivelConfianca: string
}

export default function TokenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [token, setToken] = useState<AgroToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCommission, setTotalCommission] = useState(0)
  const [laudo, setLaudo] = useState<Laudo | null>(null)
  const [resgatando, setResgatando] = useState(false)
  const [connectStatus, setConnectStatus] = useState<{ connected: boolean } | null>(null)
  const [connectingStripe, setConnectingStripe] = useState(false)

  useEffect(() => {
    fetch(`/api/tokens/${id}`)
      .then(r => r.json())
      .then(d => { setToken(d?.id ? d : null); setLoading(false) })
      .catch(() => setLoading(false))
    fetch(`/api/tokens/${id}/transactions`)
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions ?? []); setTotalCommission(d.totalCommission ?? 0) })
      .catch(() => {})
    fetch(`/api/tokens/${id}/laudo`)
      .then(r => r.json())
      .then(d => { if (!d.error) setLaudo(d) })
      .catch(() => {})
    fetch('/api/stripe/connect')
      .then(r => r.json())
      .then(d => setConnectStatus(d))
      .catch(() => {})
  }, [id])

  async function handleConnectStripe() {
    setConnectingStripe(true)
    const res = await fetch('/api/stripe/connect', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setConnectingStripe(false)
  }

  async function handleResgatar() {
    if (!confirm('Confirmar resgate do token? O status mudará para Resgatado e a taxa de sucesso (3%) será cobrada sobre o valor captado.')) return
    setResgatando(true)
    const res = await fetch(`/api/tokens/${id}/resgatar`, { method: 'POST' })
    if (res.ok) setToken(prev => prev ? { ...prev, status: 'REDEEMED' } : prev)
    setResgatando(false)
  }

  async function handlePublish() {
    setSubmitting(true)
    const res = await fetch(`/api/tokens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING_REVIEW' }),
    })
    if (res.ok) setToken(prev => prev ? { ...prev, status: 'PENDING_REVIEW' } : prev)
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!confirm('Excluir este token?')) return
    setDeleting(true)
    const res = await fetch(`/api/tokens/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard/token')
    else setDeleting(false)
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>
  if (!token) return <div className="p-8 text-center text-slate-400">Token não encontrado</div>

  const pct = token.totalTokens > 0 ? Math.round((token.soldTokens / token.totalTokens) * 100) : 0
  const captado = token.soldTokens * token.tokenPrice
  const disponivel = (token.totalTokens - token.soldTokens) * token.tokenPrice

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      {/* Status banners */}
      {token.status === 'PENDING_REVIEW' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">🔍</span>
          <div>
            <div className="text-sm font-semibold text-amber-800">Em análise pela equipe OryonAG</div>
            <div className="text-xs text-amber-700 mt-0.5">Seu token está na fila de aprovação. Em geral revisamos em até 48h. Você será notificado quando for aprovado ou se houver pendência.</div>
          </div>
        </div>
      )}
      {token.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">❌</span>
          <div>
            <div className="text-sm font-semibold text-red-800">Token rejeitado</div>
            <div className="text-xs text-red-700 mt-0.5">Este token foi rejeitado na revisão. Entre em contato com o suporte para entender o motivo e criar uma nova oferta.</div>
          </div>
        </div>
      )}
      {token.status === 'ACTIVE' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">✅</span>
          <div>
            <div className="text-sm font-semibold text-green-800">Token aprovado e ativo no mercado</div>
            <div className="text-xs text-green-700 mt-0.5">Sua oferta está visível para investidores. KYC verificado · CAR registrado · Revisão OryonAG concluída.</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/token" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{token.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400">{token.property.name}</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-400">{TYPE_LABEL[token.type]}</span>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[token.status]}`}>
          {STATUS_LABEL[token.status]}
        </span>
      </div>

      {/* Captação progress */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Captação</div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-400">Valor total</div>
            <div className="text-lg font-bold text-slate-900">{fmt(Number(token.totalValue))}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Captado</div>
            <div className="text-lg font-bold text-green-700">{fmt(captado)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Disponível</div>
            <div className="text-lg font-bold text-slate-700">{fmt(disponivel)}</div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{token.soldTokens.toLocaleString('pt-BR')} de {token.totalTokens.toLocaleString('pt-BR')} tokens vendidos</span>
            <span className="font-medium text-slate-600">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {token.expectedReturn && (
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-slate-400">Rendimento esperado:</span>
            <span className="font-semibold text-green-700">{token.expectedReturn}% {token.periodMonths ? `em ${token.periodMonths} meses` : ''}</span>
          </div>
        )}
      </div>

      {/* Detalhes específicos */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Detalhes do ativo</div>
        <div>
          {token.description && <InfoRow label="Descrição" value={token.description} />}
          {token.type === 'SAFRA' && (
            <>
              <InfoRow label="Commodity" value={token.commodity} />
              <InfoRow label="Quantidade" value={token.quantityKg ? `${Number(token.quantityKg).toLocaleString('pt-BR')} kg` : null} />
              <InfoRow label="Data de entrega" value={token.deliveryDate ? new Date(token.deliveryDate).toLocaleDateString('pt-BR') : null} />
              {token.fieldId && <InfoRow label="Talhão" value={token.property.fields.find(f => f.id === token.fieldId)?.name ?? null} />}
            </>
          )}
          {token.type === 'MATERIAL' && (
            <>
              <InfoRow label="Tipo de insumo" value={token.materialType} />
              <InfoRow label="Quantidade" value={token.quantity ? `${Number(token.quantity).toLocaleString('pt-BR')} ${token.unit || ''}` : null} />
            </>
          )}
          {token.type === 'MAQUINARIO' && (
            <>
              <InfoRow label="Tipo de máquina" value={token.machineType} />
              <InfoRow label="Modelo" value={token.machineModel} />
              <InfoRow label="Ano" value={token.machineYear?.toString() ?? null} />
              <InfoRow label="Horas disponíveis" value={token.usageHours ? `${Number(token.usageHours).toLocaleString('pt-BR')} h` : null} />
            </>
          )}
          <InfoRow label="Preço por token" value={`R$ ${Number(token.tokenPrice).toLocaleString('pt-BR')}`} />
          <InfoRow label="Total de tokens" value={token.totalTokens.toLocaleString('pt-BR')} />
          <InfoRow label="Criado em" value={new Date(token.createdAt).toLocaleDateString('pt-BR')} />
        </div>
      </div>

      {/* Laudo de Capacidade */}
      {laudo && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Laudo de Capacidade Produtiva</div>
            <div className={`text-xs px-3 py-1 rounded-full font-semibold ${
              laudo.nivelConfianca === 'ALTO' ? 'bg-green-100 text-green-700' :
              laudo.nivelConfianca === 'MÉDIO' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              Confiança {laudo.nivelConfianca} — {laudo.scoreConfianca}/100
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Receita anual</div>
              <div className="font-semibold text-slate-900">{fmt(laudo.receitaAnual)}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Margem operacional</div>
              <div className={`font-semibold ${laudo.margemPct >= 20 ? 'text-green-700' : laudo.margemPct >= 0 ? 'text-amber-700' : 'text-red-600'}`}>
                {laudo.margemPct}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Área / Talhões</div>
              <div className="font-semibold text-slate-900">{laudo.areaHectares} ha / {laudo.talhoes}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">Atividades (12m)</div>
              <div className="font-semibold text-slate-900">{laudo.atividadesConcluidas} concluídas</div>
            </div>
            {laudo.agroRateScore !== null && (
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-0.5">AgroRate Score</div>
                <div className="font-semibold text-slate-900">{laudo.agroRateScore} <span className="text-xs text-slate-400">{laudo.agroRateCategoria}</span></div>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">KYC do produtor</div>
              <div className={`font-semibold ${laudo.kycVerificado ? 'text-green-700' : 'text-slate-500'}`}>
                {laudo.kycVerificado ? '✓ Verificado' : 'Pendente'}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Laudo gerado automaticamente com base nos dados operacionais do SmartAgroOS.</p>
        </div>
      )}

      {/* Blockchain */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Blockchain</div>
          {token.blockchainTx && (
            <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Registrado na Polygon
            </span>
          )}
        </div>
        {token.blockchainTx ? (
          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-600 break-all bg-white border border-slate-200 rounded-xl px-3 py-2">
              {token.blockchainTx}
            </div>
            <a
              href={`https://polygonscan.com/tx/${token.blockchainTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Ver no PolygonScan
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Registro na Polygon mainnet após aprovação do token
          </div>
        )}
      </div>

      {/* Transações */}
      {transactions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Compradores</div>
            <span className="text-xs text-slate-400">Comissão total: <span className="font-semibold text-green-700">{fmt(totalCommission)}</span></span>
          </div>
          <div className="space-y-0">
            {transactions.map(t => (
              <div key={t.id} className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-900">{t.buyer.name}</div>
                  <div className="text-xs text-slate-400">{t.quantity.toLocaleString('pt-BR')} tokens • {new Date(t.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{fmt(Number(t.totalAmount))}</div>
                  <div className="text-xs text-green-600">comissão {fmt(Number(t.commission))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 flex-wrap">
        {token.status === 'DRAFT' && (
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Enviando...' : 'Enviar para análise'}
          </button>
        )}
        {token.status === 'DRAFT' && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 border border-red-200 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? '...' : 'Excluir'}
          </button>
        )}
        {token.status === 'ACTIVE' && connectStatus && !connectStatus.connected && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800 font-semibold mb-1">⚠️ Conta bancária não conectada</p>
            <p className="text-xs text-amber-700 mb-3">Para resgatar, conecte sua conta bancária via Stripe. O valor líquido (captado − 3% taxa de sucesso) será transferido automaticamente.</p>
            <button
              onClick={handleConnectStripe}
              disabled={connectingStripe}
              className="w-full bg-amber-500 text-white font-semibold py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm"
            >
              {connectingStripe ? 'Redirecionando...' : 'Conectar conta bancária'}
            </button>
          </div>
        )}
        {token.status === 'ACTIVE' && (
          <button
            onClick={handleResgatar}
            disabled={resgatando || (connectStatus !== null && !connectStatus.connected)}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {resgatando ? 'Processando...' : 'Solicitar resgate (liquidar)'}
          </button>
        )}
        {token.status !== 'DRAFT' && (
          <Link href="/dashboard/token" className="flex-1 text-center border border-gray-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Voltar para tokens
          </Link>
        )}
      </div>
    </div>
  )
}
