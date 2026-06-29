'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LoteDiario {
  data: string
  pesoMedio: number | null
}

interface Lote {
  id: string
  nome: string
  cabecas: number
  racaPredominante: string | null
  pesoMedioEntrada: number
  faseAtual: string | null
  metaGMD: number | null
  pesoMetaAbate: number | null
  sistemaProducao: string | null
  areaHectares: number | null
  status: string
  dataEntrada: string
  dataSaidaPrevista: string | null
  custoTotal: number
  registrosDiarios: LoteDiario[]
  _count: { registrosDiarios: number }
}

const FASE_LABEL: Record<string, string> = {
  RECRIA: 'Recria',
  ENGORDA: 'Engorda',
}

const SISTEMA_LABEL: Record<string, string> = {
  PASTO_ROTACIONADO: 'Pasto Rotacionado',
  SEMICONFINAMENTO: 'Semiconfinamento',
  CONFINAMENTO: 'Confinamento',
}

function calcGmd(diarios: LoteDiario[]): number | null {
  const pesados = diarios.filter(d => d.pesoMedio).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  if (pesados.length < 2) return null
  const diff = pesados[0].pesoMedio! - pesados[pesados.length - 1].pesoMedio!
  const days = Math.max(1, (new Date(pesados[0].data).getTime() - new Date(pesados[pesados.length - 1].data).getTime()) / 86400000)
  return (diff / days) * 1000
}

function calcProgress(lote: Lote): number {
  const ultimo = lote.registrosDiarios.find(d => d.pesoMedio)
  const atual = ultimo?.pesoMedio ?? lote.pesoMedioEntrada
  const meta = lote.pesoMetaAbate ?? (lote.faseAtual === 'RECRIA' ? 330 : 480)
  const range = meta - lote.pesoMedioEntrada
  if (range <= 0) return 100
  return Math.min(100, Math.max(0, ((atual - lote.pesoMedioEntrada) / range) * 100))
}

export default function RecriaEngordaPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/recria-engorda/lotes')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLotes(data)
        else setError(data.error ?? 'Erro ao carregar lotes')
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false))
  }, [])

  const ativos = lotes.filter(l => l.status === 'ATIVO')
  const totalCabecas = ativos.reduce((s, l) => s + l.cabecas, 0)
  const gmds = ativos.map(l => calcGmd(l.registrosDiarios)).filter(Boolean) as number[]
  const gmdMedio = gmds.length ? gmds.reduce((a, b) => a + b, 0) / gmds.length : null
  const emRecria = ativos.filter(l => l.faseAtual === 'RECRIA').length
  const emEngorda = ativos.filter(l => l.faseAtual === 'ENGORDA').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">🐄</span>
            ORYON Pecuário
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Recria & Engorda — Monitoramento inteligente de lotes</p>
        </div>
        <Link
          href="/dashboard/recria-engorda/novo"
          className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Lote
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lotes Ativos', value: ativos.length.toString(), icon: '📋', color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Cabeças', value: totalCabecas.toLocaleString('pt-BR'), icon: '🐄', color: 'bg-green-50 text-green-700' },
          { label: 'GMD Médio', value: gmdMedio ? `${gmdMedio.toFixed(0)} g/dia` : '—', icon: '📈', color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Recria / Engorda', value: `${emRecria} / ${emEngorda}`, icon: '⚖️', color: 'bg-amber-50 text-amber-700' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className={`text-xl font-bold ${kpi.color.split(' ')[1]}`}>{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Carregando lotes...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-red-700 font-semibold mb-1">Módulo não disponível</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && lotes.length === 0 && (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🐄</div>
          <p className="text-slate-700 font-semibold text-lg mb-2">Nenhum lote cadastrado</p>
          <p className="text-slate-400 text-sm mb-6">
            Cadastre seu primeiro lote de recria ou engorda e comece a monitorar GMD, suplementação e projeção financeira com IA.
          </p>
          <Link
            href="/dashboard/recria-engorda/novo"
            className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Criar primeiro lote
          </Link>
        </div>
      )}

      {!loading && !error && lotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lotes.map(lote => {
            const gmd = calcGmd(lote.registrosDiarios)
            const progress = calcProgress(lote)
            const ultimoPeso = lote.registrosDiarios.find(d => d.pesoMedio)?.pesoMedio ?? lote.pesoMedioEntrada
            const metaPeso = lote.pesoMetaAbate ?? (lote.faseAtual === 'RECRIA' ? 330 : 480)
            const gmdOk = gmd !== null && lote.metaGMD ? gmd >= lote.metaGMD * 0.9 : null

            return (
              <Link
                key={lote.id}
                href={`/dashboard/recria-engorda/lotes/${lote.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all p-5 block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{lote.nome}</h3>
                    <p className="text-xs text-slate-500">{lote.racaPredominante ?? 'Raça não definida'} · {lote.cabecas} cabeças</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    lote.faseAtual === 'ENGORDA'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {FASE_LABEL[lote.faseAtual ?? ''] ?? lote.faseAtual ?? '—'}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{ultimoPeso.toFixed(0)} kg atual</span>
                    <span>Meta: {metaPeso} kg</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{progress.toFixed(0)}% da meta de peso</div>
                </div>

                {/* GMD */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-500">GMD: </span>
                    <span className={`font-bold ${gmdOk === true ? 'text-green-600' : gmdOk === false ? 'text-red-500' : 'text-slate-700'}`}>
                      {gmd !== null ? `${gmd.toFixed(0)} g/dia` : '—'}
                    </span>
                    {lote.metaGMD && <span className="text-slate-400 text-xs ml-1">(meta: {lote.metaGMD})</span>}
                  </div>
                  <div className="text-xs text-slate-400">
                    {lote.sistemaProducao ? SISTEMA_LABEL[lote.sistemaProducao] ?? lote.sistemaProducao : ''}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
