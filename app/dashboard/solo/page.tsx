'use client'

import { useState } from 'react'
import HowToUse from '../../../components/HowToUse'

// Schema: https://www.agroapi.cnptia.embrapa.br/store/api-docs/agroapi/SmartSolosExpert/v1
// Granulometria em g/Kg (ex: 38% = 380 g/Kg)
// Cor Munsell separada: MATIZ / VALOR / CROMA
// ESTRUTURA_TIPO: 1=granular 2=blocos-ang 3=blocos-subang 4=prismática 5=colunar 6=laminar 7=maciça 8=grãos-simples
// ESTRUTURA_GRAU: 1=fraca 2=moderada 3=forte
// ESTRUTURA_TAMANHO: 1=muito-pequena 2=pequena 3=média 4=grande 5=muito-grande
// CONSISTENCIA_SECO: 1=solta 2=macia 3=lig-dura 4=dura 5=muito-dura 6=ext-dura
// DRENAGEM: 1=exc-drenado … 4=bem-drenado … 7=mal-drenado 8=muito-mal-drenado
const EXEMPLO_PERFIL = {
  items: [
    {
      ID_PONTO: "perfil-001",
      DRENAGEM: 4,
      HORIZONTES: [
        {
          SIMB_HORIZ: "A",
          LIMITE_SUP: 0,
          LIMITE_INF: 25,
          COR_SECA_MATIZ: "10YR",
          COR_SECA_VALOR: 4,
          COR_SECA_CROMA: 3,
          COR_UMIDA_MATIZ: "10YR",
          COR_UMIDA_VALOR: 3,
          COR_UMIDA_CROMA: 2,
          ESTRUTURA_TIPO: 1,
          ESTRUTURA_GRAU: 2,
          ESTRUTURA_TAMANHO: 2,
          CONSISTENCIA_SECO: 2,
          PH_AGUA: 5.8,
          ARGILA: 380,
          AREIA_FINA: 300,
          AREIA_GROS: 120,
          SILTE: 200,
        },
        {
          SIMB_HORIZ: "Bw",
          LIMITE_SUP: 25,
          LIMITE_INF: 120,
          COR_SECA_MATIZ: "2.5YR",
          COR_SECA_VALOR: 4,
          COR_SECA_CROMA: 6,
          COR_UMIDA_MATIZ: "2.5YR",
          COR_UMIDA_VALOR: 3,
          COR_UMIDA_CROMA: 6,
          ESTRUTURA_TIPO: 3,
          ESTRUTURA_GRAU: 2,
          ESTRUTURA_TAMANHO: 3,
          CONSISTENCIA_SECO: 3,
          PH_AGUA: 5.4,
          ARGILA: 680,
          AREIA_FINA: 150,
          AREIA_GROS: 50,
          SILTE: 120,
        }
      ]
    }
  ]
}

type Resultado = {
  classification?: string
  order?: string
  suborder?: string
  great_group?: string
  subgroup?: string
  confidence?: number
  profiles?: { id: string; classification: string; confidence?: number }[]
}

const CODIGOS = [
  {
    titulo: 'ESTRUTURA_TIPO',
    itens: ['1 granular', '2 blocos ang.', '3 blocos subang.', '4 prismática', '5 colunar', '6 laminar', '7 maciça', '8 grãos simples'],
  },
  {
    titulo: 'ESTRUTURA_GRAU',
    itens: ['1 fraca', '2 moderada', '3 forte'],
  },
  {
    titulo: 'ESTRUTURA_TAMANHO',
    itens: ['1 muito pequena', '2 pequena', '3 média', '4 grande', '5 muito grande'],
  },
  {
    titulo: 'CONSISTENCIA_SECO',
    itens: ['1 solta', '2 macia', '3 lig. dura', '4 dura', '5 muito dura', '6 ext. dura'],
  },
  {
    titulo: 'DRENAGEM',
    itens: ['1 exc. drenado', '2 fort. drenado', '3 acent. drenado', '4 bem drenado', '5 mod. drenado', '6 imperf. drenado', '7 mal drenado', '8 muito mal drenado'],
  },
]

const SIBCS_ORDENS = [
  { sigla: 'LA', nome: 'Latossolo', cor: '#ef4444' },
  { sigla: 'AR', nome: 'Argissolo', cor: '#f97316' },
  { sigla: 'ES', nome: 'Espodossolo', cor: '#eab308' },
  { sigla: 'CA', nome: 'Cambissolo', cor: '#22c55e' },
  { sigla: 'NE', nome: 'Neossolo', cor: '#3b82f6' },
  { sigla: 'OX', nome: 'Organossolo', cor: '#8b5cf6' },
  { sigla: 'GX', nome: 'Gleissolo', cor: '#06b6d4' },
  { sigla: 'VX', nome: 'Vertissolo', cor: '#ec4899' },
  { sigla: 'CX', nome: 'Chernossolo', cor: '#64748b' },
  { sigla: 'MT', nome: 'Nitossolo', cor: '#a78bfa' },
  { sigla: 'PL', nome: 'Planossolo', cor: '#34d399' },
  { sigla: 'SX', nome: 'Planossolos', cor: '#fb923c' },
  { sigla: 'GY', nome: 'Gipsossolo', cor: '#f472b6' },
]

export default function SoloPage() {
  const [modo, setModo] = useState<'classification' | 'verification'>('classification')
  const [jsonInput, setJsonInput] = useState(JSON.stringify(EXEMPLO_PERFIL, null, 2))
  const [jsonError, setJsonError] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [abaRef, setAbaRef] = useState<'ordens' | 'codigos'>('ordens')

  function validarJson(val: string) {
    try {
      JSON.parse(val)
      setJsonError('')
      return true
    } catch {
      setJsonError('JSON inválido — verifique a sintaxe')
      return false
    }
  }

  async function analisar() {
    if (!validarJson(jsonInput)) return
    setLoading(true); setApiError(''); setResultado(null)
    try {
      const body = JSON.parse(jsonInput)
      const res = await fetch(`/api/embrapa/smartsolos/${modo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `Erro ${res.status}`)
      }
      setResultado(await res.json())
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro na análise')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'rgba(10,14,26,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Análise de Solo</h1>
            <p className="text-[10px] text-slate-500">SmartSolos Expert · Embrapa — classificação SiBCS</p>
          </div>
        </div>

        <div className="px-6 pb-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <HowToUse
            storageKey="solo"
            title="Análise e Classificação de Solo"
            subtitle="SmartSolos Expert — classifica solos segundo o SiBCS (Sistema Brasileiro de Classificação de Solos)"
            theme="dark"
            accentColor="#a78bfa"
            steps={[
              { icon: '🔬', title: 'Estrutura do JSON', description: 'Cada perfil tem ID_PONTO, DRENAGEM (1–8) e array HORIZONTES. Cada horizonte tem SIMB_HORIZ, LIMITE_SUP, LIMITE_INF, cor Munsell separada em MATIZ/VALOR/CROMA.' },
              { icon: '📏', title: 'Granulometria em g/Kg', description: 'ARGILA, SILTE, AREIA_FINA, AREIA_GROS são informados em g/Kg — não em percentagem. Ex: 38% = 380 g/Kg.' },
              { icon: '🔢', title: 'Estrutura e consistência', description: 'ESTRUTURA_TIPO, ESTRUTURA_GRAU, ESTRUTURA_TAMANHO e CONSISTENCIA_SECO usam códigos inteiros. Consulte a tabela de referência ao lado.' },
              { icon: '🏷️', title: 'Classificar ou Verificar', description: 'Classificar retorna ordem/subordem/grande-grupo/subgrupo pelo SiBCS. Verificar compara com uma classificação já existente no perfil.' },
            ]}
            tip="Cor Munsell deve ser separada: '2.5YR 4/6' vira COR_SECA_MATIZ:'2.5YR', COR_SECA_VALOR:4, COR_SECA_CROMA:6"
          />
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Editor */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {(['classification', 'verification'] as const).map(m => (
                <button key={m} onClick={() => setModo(m)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={modo === m
                    ? { background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }
                  }>
                  {m === 'classification' ? '🏷️ Classificar' : '✅ Verificar'}
                </button>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${jsonError ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[11px] font-mono text-slate-400">perfil.json</span>
                <button onClick={() => { setJsonInput(JSON.stringify(EXEMPLO_PERFIL, null, 2)); setJsonError('') }}
                  className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                  Restaurar exemplo
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); validarJson(e.target.value) }}
                spellCheck={false}
                rows={22}
                className="w-full px-4 py-3 text-xs font-mono text-green-300 outline-none resize-none"
                style={{ background: '#0d1117', lineHeight: 1.6 }}
              />
            </div>
            {jsonError && <div className="text-xs text-red-400">{jsonError}</div>}

            <button onClick={analisar} disabled={loading || !!jsonError}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
              {loading ? 'Analisando...' : modo === 'classification' ? '🏷️ Classificar Solo' : '✅ Verificar Classificação'}
            </button>
          </div>

          {/* Resultado + referência */}
          <div className="space-y-4">
            {apiError && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {apiError}
              </div>
            )}

            {resultado && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-violet-400 font-bold text-sm">Resultado SiBCS</span>
                  {resultado.confidence !== undefined && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full text-violet-300" style={{ background: 'rgba(167,139,250,0.1)' }}>
                      {Math.round(resultado.confidence * 100)}% confiança
                    </span>
                  )}
                </div>

                {resultado.classification && (
                  <div className="space-y-2">
                    {[
                      { label: 'Classificação', value: resultado.classification },
                      { label: 'Ordem', value: resultado.order },
                      { label: 'Subordem', value: resultado.suborder },
                      { label: 'Grande grupo', value: resultado.great_group },
                      { label: 'Subgrupo', value: resultado.subgroup },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">{f.label}</span>
                        <span className="text-sm text-white font-medium">{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {resultado.profiles && resultado.profiles.map(p => (
                  <div key={p.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-[11px] text-slate-500 mb-1">{p.id}</div>
                    <div className="text-sm text-white font-semibold">{p.classification}</div>
                    {p.confidence !== undefined && (
                      <div className="text-[11px] text-violet-400 mt-0.5">{Math.round(p.confidence * 100)}% confiança</div>
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 mb-2">Resposta completa</div>
                  <pre className="text-[10px] font-mono text-slate-400 overflow-auto rounded-xl p-3 max-h-40" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Referência */}
            {!resultado && (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Tabs referência */}
                <div className="flex" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {(['ordens', 'codigos'] as const).map(a => (
                    <button key={a} onClick={() => setAbaRef(a)}
                      className="flex-1 py-2.5 text-[11px] font-semibold transition-colors"
                      style={abaRef === a ? { color: '#a78bfa', borderBottom: '2px solid #a78bfa' } : { color: '#64748b' }}>
                      {a === 'ordens' ? 'Ordens SiBCS' : 'Códigos de Campo'}
                    </button>
                  ))}
                </div>

                <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {abaRef === 'ordens' && (
                    <>
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        {SIBCS_ORDENS.map(o => (
                          <div key={o.sigla} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <span className="text-[11px] font-bold font-mono" style={{ color: o.cor, width: 24 }}>{o.sigla}</span>
                            <span className="text-[11px] text-slate-400">{o.nome}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-600">Fonte: Embrapa Solos — SiBCS 3ª edição</div>
                    </>
                  )}

                  {abaRef === 'codigos' && (
                    <div className="space-y-3">
                      {CODIGOS.map(c => (
                        <div key={c.titulo}>
                          <div className="text-[10px] font-mono text-violet-400 mb-1.5">{c.titulo}</div>
                          <div className="flex flex-wrap gap-1">
                            {c.itens.map(item => (
                              <span key={item} className="text-[10px] px-2 py-0.5 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="text-[10px] text-slate-600 pt-1">Granulometria: ARGILA, SILTE, AREIA_FINA, AREIA_GROS em g/Kg (38% = 380)</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
