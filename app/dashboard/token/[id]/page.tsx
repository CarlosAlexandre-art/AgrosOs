'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function TokenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [token, setToken] = useState<AgroToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/tokens/${id}`)
      .then(r => r.json())
      .then(d => { setToken(d); setLoading(false) })
  }, [id])

  async function handlePublish() {
    setSubmitting(true)
    const res = await fetch(`/api/tokens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING_REVIEW' }),
    })
    if (res.ok) setToken(await res.json())
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

      {/* Blockchain */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Blockchain</div>
        {token.blockchainTx ? (
          <div className="text-sm font-mono text-slate-700 break-all">{token.blockchainTx}</div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Publicação na blockchain disponível em breve (Polygon mainnet)
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3">
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
        {token.status !== 'DRAFT' && (
          <Link href="/dashboard/token" className="flex-1 text-center border border-gray-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Voltar para tokens
          </Link>
        )}
      </div>
    </div>
  )
}
