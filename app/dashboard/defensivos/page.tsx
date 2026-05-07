'use client'

import { useState, useCallback } from 'react'
import HowToUse from '../../../components/HowToUse'

const CULTURAS = [
  'Soja','Milho','Café','Cana-de-açúcar','Algodão','Arroz','Feijão','Trigo',
  'Tomate','Batata','Citros','Uva','Maçã','Manga','Eucalipto','Pastagem',
]

const CATEGORIAS = [
  'Fungicida','Herbicida','Inseticida','Acaricida','Bactericida',
  'Nematicida','Regulador de Crescimento','Espalhante Adesivo',
]

interface Produto {
  numero_registro: string
  marca_comercial: string
  titular_registro: string
  formulacao?: string
  classificacao_ambiental?: string
  classificacao_toxicologica?: string
  ingredientes_ativos?: { nome: string }[]
  culturas?: { nome: string }[]
  pragas?: { nome_comum: string }[]
  produto_biologico?: boolean
}

const TOX_COLOR: Record<string, string> = {
  'I': '#ef4444', 'II': '#f97316', 'III': '#eab308', 'IV': '#22c55e',
  'Extremamente Tóxico': '#ef4444', 'Altamente Tóxico': '#f97316',
  'Moderadamente Tóxico': '#eab308', 'Pouco Tóxico': '#22c55e',
}

const AMB_COLOR: Record<string, string> = {
  'I': '#ef4444', 'II': '#f97316', 'III': '#eab308', 'IV': '#22c55e',
  'Altamente Perigoso': '#ef4444', 'Muito Perigoso': '#f97316',
  'Perigoso': '#eab308', 'Pouco Perigoso': '#22c55e',
}

export default function DefensivosPage() {
  const [q, setQ] = useState('')
  const [cultura, setCultura] = useState('')
  const [categoria, setCategoria] = useState('')
  const [biologico, setBiologico] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<Produto | null>(null)

  const buscar = useCallback(async (p = 1) => {
    if (!q && !cultura && !categoria) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cultura) params.set('cultura', cultura)
      if (categoria) params.set('classe_categoria_agronomica', categoria)
      if (biologico) params.set('produto_biologico', 'true')
      params.set('page', String(p))

      const res = await fetch(`/api/embrapa/agrofit/search/produtos-formulados?${params}`)
      if (!res.ok) throw new Error(await res.text())
      const data: Produto[] = await res.json()
      setProdutos(data)
      setPage(p)
      setTotal(Number(res.headers.get('x-records-count')) || data.length)
      setTotalPages(Number(res.headers.get('x-pages')) || 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar')
    } finally {
      setLoading(false)
    }
  }, [q, cultura, categoria, biologico])

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'rgba(10,14,26,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Defensivos Agrícolas</h1>
            <p className="text-[10px] text-slate-500">AGROFIT · Ministério da Agricultura (MAPA)</p>
          </div>
          {total !== null && (
            <div className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold text-green-400" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              {total.toLocaleString('pt-BR')} produtos
            </div>
          )}
        </div>

        {/* HowToUse */}
        <div className="px-6 pb-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <HowToUse
            storageKey="defensivos"
            title="Defensivos Agrícolas MAPA"
            subtitle="Consulta oficial ao cadastro AGROFIT da Embrapa / Ministério da Agricultura"
            theme="dark"
            accentColor="#22c55e"
            steps={[
              { icon: '🌱', title: 'Escolha a cultura', description: 'Selecione a cultura que deseja tratar (Soja, Milho, Café, etc.) no filtro correspondente.' },
              { icon: '🔍', title: 'Busque por nome ou praga', description: 'Digite o nome comercial do produto, ingrediente ativo ou o nome da praga que deseja combater.' },
              { icon: '⚗️', title: 'Filtre por categoria', description: 'Use o filtro de categoria agronômica para limitar por Fungicida, Herbicida, Inseticida, etc.' },
              { icon: '📋', title: 'Veja os detalhes', description: 'Clique em um produto para ver registro, titular, formulação, classificação toxicológica e ambiental.' },
            ]}
            tip="Marque 'Biológico' para filtrar apenas produtos de origem biológica, permitidos em agricultura orgânica certificada."
          />
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Search */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Nome comercial, ingrediente ativo, praga..."
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar(1)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <select
              value={cultura}
              onChange={e => setCultura(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="">Todas as culturas</option>
              {CULTURAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="">Todas as categorias</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setBiologico(b => !b)}
                className="w-10 h-5 rounded-full transition-colors relative"
                style={{ background: biologico ? '#22c55e' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: biologico ? '22px' : '2px' }} />
              </div>
              <span className="text-sm text-slate-400">Apenas biológicos</span>
            </label>
            <button
              onClick={() => buscar(1)}
              disabled={loading || (!q && !cultura && !categoria)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: '#16a34a' }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {produtos.length > 0 && (
          <div className="space-y-3">
            {produtos.map(p => (
              <button
                key={p.numero_registro}
                onClick={() => setSelected(selected?.numero_registro === p.numero_registro ? null : p)}
                className="w-full text-left rounded-2xl p-4 transition-all"
                style={{
                  background: selected?.numero_registro === p.numero_registro ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected?.numero_registro === p.numero_registro ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{p.marca_comercial}</span>
                      {p.produto_biologico && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>BIO</span>
                      )}
                      {p.classificacao_toxicologica && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: TOX_COLOR[p.classificacao_toxicologica] ?? '#64748b', opacity: 0.9 }}>
                          TOX {p.classificacao_toxicologica}
                        </span>
                      )}
                      {p.classificacao_ambiental && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: AMB_COLOR[p.classificacao_ambiental] ?? '#64748b', opacity: 0.9 }}>
                          AMB {p.classificacao_ambiental}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.titular_registro}</div>
                    {p.formulacao && <div className="text-[11px] text-slate-500 mt-0.5">{p.formulacao}</div>}
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 flex-shrink-0">#{p.numero_registro}</span>
                </div>

                {selected?.numero_registro === p.numero_registro && (
                  <div className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {p.ingredientes_ativos && p.ingredientes_ativos.length > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ingredientes ativos</div>
                        <div className="flex flex-wrap gap-1">
                          {p.ingredientes_ativos.map((ia, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg text-green-300" style={{ background: 'rgba(34,197,94,0.1)' }}>{ia.nome}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {p.culturas && p.culturas.length > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Culturas registradas</div>
                        <div className="flex flex-wrap gap-1">
                          {p.culturas.slice(0, 6).map((c, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg text-blue-300" style={{ background: 'rgba(59,130,246,0.1)' }}>{c.nome}</span>
                          ))}
                          {p.culturas.length > 6 && <span className="text-[11px] text-slate-500">+{p.culturas.length - 6}</span>}
                        </div>
                      </div>
                    )}
                    {p.pragas && p.pragas.length > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pragas alvo</div>
                        <div className="flex flex-wrap gap-1">
                          {p.pragas.slice(0, 4).map((pr, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg text-amber-300" style={{ background: 'rgba(245,158,11,0.1)' }}>{pr.nome_comum}</span>
                          ))}
                          {p.pragas.length > 4 && <span className="text-[11px] text-slate-500">+{p.pragas.length - 4}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button onClick={() => buscar(page - 1)} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 disabled:opacity-30 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>← Anterior</button>
                <span className="text-xs text-slate-500">Página {page} de {totalPages}</span>
                <button onClick={() => buscar(page + 1)} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 disabled:opacity-30 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>Próxima →</button>
              </div>
            )}
          </div>
        )}

        {!loading && produtos.length === 0 && total === null && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🌱</div>
            <div className="text-slate-500 text-sm">Digite um nome, cultura ou praga para buscar defensivos no cadastro MAPA</div>
          </div>
        )}

        {!loading && produtos.length === 0 && total !== null && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-slate-500 text-sm">Nenhum produto encontrado para esta busca</div>
          </div>
        )}
      </div>
    </div>
  )
}
