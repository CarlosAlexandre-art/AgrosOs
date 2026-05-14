'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Property = { id: string; name: string; sizeHectares: number }
type Field    = { id: string; name: string; sizeHectares: number }

const TOKEN_TYPES = [
  {
    type: 'SAFRA',
    label: 'Safra',
    desc: 'Tokenize sua produção futura — soja, milho, café, algodão. Investidores financiam sua safra antecipadamente.',
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    accent: '#4ade80',
    accentBg: 'rgba(74,222,128,0.09)',
    border: 'rgba(74,222,128,0.18)',
    borderActive: 'rgba(74,222,128,0.55)',
    bgActive: 'rgba(74,222,128,0.07)',
  },
  {
    type: 'MATERIAL',
    label: 'Material / Insumo',
    desc: 'Tokenize seu estoque de sementes, fertilizantes ou defensivos. Venda para outros produtores ou investidores.',
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    accent: '#fbbf24',
    accentBg: 'rgba(251,191,36,0.09)',
    border: 'rgba(251,191,36,0.18)',
    borderActive: 'rgba(251,191,36,0.55)',
    bgActive: 'rgba(251,191,36,0.07)',
  },
  {
    type: 'MAQUINARIO',
    label: 'Maquinário',
    desc: 'Tokenize tratores, colheitadeiras ou implementos. Ofereça direito de uso ou fracionamento de propriedade.',
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    accent: '#60a5fa',
    accentBg: 'rgba(96,165,250,0.09)',
    border: 'rgba(96,165,250,0.18)',
    borderActive: 'rgba(96,165,250,0.55)',
    bgActive: 'rgba(96,165,250,0.07)',
  },
]

const COMMODITIES = ['Soja', 'Milho', 'Café', 'Algodão', 'Cana-de-açúcar', 'Trigo', 'Arroz', 'Feijão', 'Outros']
const MATERIALS   = ['Sementes certificadas', 'Fertilizante (NPK)', 'Ureia', 'MAP', 'KCl', 'Herbicida', 'Fungicida', 'Inseticida', 'Calcário', 'Outros']
const MACHINES    = ['Trator', 'Colheitadeira', 'Pulverizador', 'Plantadeira', 'Grade aradora', 'Subsolador', 'Carreta graneleira', 'Outros']

const ORIGINACAO_RATE = 0.02
const SUCESSO_RATE    = 0.03

function validateCPF(cpf: string) {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(c[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(c[10])
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

.nt-wrap { font-family: 'Outfit', sans-serif; }

@keyframes nt-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nt-spin { to { transform: rotate(360deg); } }

.nt-wrap .nt-header { animation: nt-fadeUp .45s ease both; }
.nt-wrap .nt-body   { animation: nt-fadeUp .45s ease .08s both; }
.nt-spin { animation: nt-spin .75s linear infinite; }

.nt-wrap input[type=number]                        { -moz-appearance: textfield; appearance: textfield; }
.nt-wrap input[type=number]::-webkit-inner-spin-button,
.nt-wrap input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

.nt-input {
  width: 100%;
  background: rgba(2,12,8,0.85);
  border: 1px solid rgba(22,163,74,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  color: #e2faea;
  outline: none;
  transition: border-color .15s;
  box-sizing: border-box;
}
.nt-input::placeholder { color: #2a5c3a; }
.nt-input:focus { border-color: rgba(74,222,128,0.45); }
.nt-input option { background: #020c08; color: #e2faea; }

.nt-textarea {
  width: 100%;
  background: rgba(2,12,8,0.85);
  border: 1px solid rgba(22,163,74,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  color: #e2faea;
  outline: none;
  resize: vertical;
  transition: border-color .15s;
  box-sizing: border-box;
}
.nt-textarea::placeholder { color: #2a5c3a; }
.nt-textarea:focus { border-color: rgba(74,222,128,0.45); }

.nt-btn-back {
  flex: 1;
  border: 1px solid rgba(22,163,74,0.2);
  background: transparent;
  color: #3a6648;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}
.nt-btn-back:hover { border-color: rgba(22,163,74,0.4); color: #4ade80; }

.nt-btn-next {
  flex: 1;
  border: none;
  background: #16a34a;
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background .15s, opacity .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.nt-btn-next:hover:not(:disabled) { background: #15803d; }
.nt-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
`

function DarkLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#3d7a52', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

export default function NovoTokenPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [cpfVerifying, setCpfVerifying] = useState(false)
  const [cpfResult, setCpfResult] = useState<{ nome: string; nasc: string } | null>(null)
  const [cpfError, setCpfError] = useState('')
  const [sugestaoIA, setSugestaoIA] = useState<any>(null)
  const [loadingSugestao, setLoadingSugestao] = useState(false)

  const [form, setForm] = useState({
    type: '',
    propertyId: '',
    title: '',
    description: '',
    totalValue: '',
    tokenPrice: '100',
    expectedReturn: '',
    periodMonths: '',
    commodity: '',
    quantityKg: '',
    deliveryDate: '',
    fieldId: '',
    materialType: '',
    quantity: '',
    unit: 'kg',
    machineType: '',
    machineModel: '',
    machineYear: '',
    usageHours: '',
    carNumber: '',
    cpf: '',
    aceitaTermos: false,
    aceitaCVM: false,
    aceitaPiloto: false,
  })

  async function sugerirComIA() {
    if (!form.type) return
    setLoadingSugestao(true)
    setSugestaoIA(null)
    try {
      const res = await fetch(`/api/ai/token-sugestao?tipo=${form.type}`)
      if (!res.ok) return
      const data = await res.json()
      setSugestaoIA(data)
      // Preenche o formulário com as sugestões
      setForm(f => ({
        ...f,
        title:          data.titulo       || f.title,
        description:    data.descricao    || f.description,
        totalValue:     data.valorTotal   ? String(data.valorTotal)   : f.totalValue,
        tokenPrice:     data.precoToken   ? String(data.precoToken)   : f.tokenPrice,
        expectedReturn: data.retornoEsperado ? String(data.retornoEsperado) : f.expectedReturn,
        periodMonths:   data.periodoMeses ? String(data.periodoMeses) : f.periodMonths,
        commodity:      data.commodity    || f.commodity,
        quantityKg:     data.quantidadeKg ? String(data.quantidadeKg) : f.quantityKg,
      }))
    } finally {
      setLoadingSugestao(false)
    }
  }

  const set = (k: string, v: string | boolean) => {
    if (k === 'cpf') { setCpfResult(null); setCpfError('') }
    setForm(f => ({ ...f, [k]: v }))
  }

  async function verifyCPF() {
    setCpfVerifying(true); setCpfError(''); setCpfResult(null)
    try {
      const res = await fetch('/api/cpf/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: form.cpf }),
      })
      const data = await res.json()
      if (res.ok) setCpfResult({ nome: data.nome, nasc: data.nasc })
      else setCpfError(data.error || 'Erro na verificação')
    } catch {
      setCpfError('Erro de conexão com o serviço de verificação')
    } finally {
      setCpfVerifying(false)
    }
  }

  useEffect(() => {
    fetch('/api/properties').then(r => r.json()).then((d: Property[]) => {
      if (Array.isArray(d)) {
        setProperties(d)
        if (d.length === 1) set('propertyId', d[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!form.propertyId || form.type !== 'SAFRA') return
    fetch(`/api/properties/${form.propertyId}/fields`).then(r => r.json()).then((d: Field[]) => {
      if (Array.isArray(d)) setFields(d)
    }).catch(() => setFields([]))
  }, [form.propertyId, form.type])

  const totalTokens = form.totalValue && form.tokenPrice
    ? Math.floor(parseFloat(form.totalValue) / parseFloat(form.tokenPrice))
    : 0

  async function handleSubmit() {
    setSaving(true)
    try {
      if (form.cpf) {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf: form.cpf }),
        }).catch(() => {})
      }
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/token/${data.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const selectedType = TOKEN_TYPES.find(t => t.type === form.type)
  const tv = parseFloat(form.totalValue) || 0
  const feeOriginacao = tv * ORIGINACAO_RATE
  const feeSucesso    = tv * SUCESSO_RATE
  const liquidoProdutor = tv - feeOriginacao
  const cpfOk = validateCPF(form.cpf)

  const canGoStep2 = !!form.type && !!form.propertyId
  const canGoStep3 = !!form.title && !!form.totalValue && !!form.tokenPrice
  const carRegex = /^[A-Z]{2}-\d{7}-[0-9A-F]{32}$/i
  const carOk = carRegex.test(form.carNumber.trim())
  const tvNum = parseFloat(form.totalValue) || 0
  const tvOverLimit = tvNum > 100_000

  const canGoStep4 = canGoStep3 && carOk && (
    form.type === 'SAFRA'      ? !!form.commodity && !!form.deliveryDate :
    form.type === 'MATERIAL'   ? !!form.materialType && !!form.quantity :
    !!form.machineType
  )
  const canSubmit = canGoStep4 && cpfOk && !!cpfResult && form.aceitaTermos && form.aceitaCVM && form.aceitaPiloto && !tvOverLimit

  const STEP_LABEL = ['Tipo e propriedade', 'Valores e retorno', 'Detalhes do ativo', 'Simulação e conformidade']

  return (
    <div className="nt-wrap" style={{
      background: 'linear-gradient(160deg, #020c08 0%, #041409 60%, #030e07 100%)',
      minHeight: '100%', position: 'relative',
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hex grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16.2V49L28 65.2L0 49V16.2Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3Cpath d='M28 33.8L56 50V82.8L28 99L0 82.8V50Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3C/svg%3E")`,
        backgroundSize: '56px 100px', opacity: 0.8,
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 24px 72px', maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div className="nt-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <Link href="/dashboard/token" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 10,
            border: '1px solid rgba(22,163,74,0.15)',
            background: 'rgba(22,163,74,0.06)',
            color: '#4ade80', textDecoration: 'none',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
              color: '#e8faf0', margin: 0, letterSpacing: '-0.02em',
            }}>Novo token</h1>
            <p style={{ fontSize: 13, color: '#2a5c3a', margin: '2px 0 0' }}>
              Tokenize um ativo agrícola
            </p>
          </div>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: step >= s ? '#16a34a' : 'rgba(22,163,74,0.1)',
              transition: 'background .3s',
            }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#2a5c3a', marginBottom: 28, fontWeight: 500 }}>
          Etapa {step} de 4 · {STEP_LABEL[step - 1]}
        </p>

        {/* ─── STEP 1 ─── */}
        {step === 1 && (
          <div className="nt-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <DarkLabel>Tipo de ativo</DarkLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TOKEN_TYPES.map(t => {
                  const isActive = form.type === t.type
                  return (
                    <button
                      key={t.type}
                      onClick={() => set('type', t.type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '16px 18px', textAlign: 'left',
                        background: isActive ? t.bgActive : 'rgba(6,18,11,0.85)',
                        border: `2px solid ${isActive ? t.borderActive : t.border}`,
                        borderRadius: 14, cursor: 'pointer',
                        transition: 'border-color .15s, background .15s',
                      }}
                    >
                      <div style={{
                        width: 46, height: 46, borderRadius: 11, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? t.accentBg : 'rgba(22,163,74,0.04)',
                        color: isActive ? t.accent : '#3a6648',
                        transition: 'color .15s, background .15s',
                      }}>
                        {t.icon}
                      </div>
                      <div>
                        <div style={{
                          fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700,
                          color: isActive ? '#e2faea' : '#86efac', marginBottom: 3,
                        }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#2a5c3a', lineHeight: 1.5 }}>{t.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <DarkLabel>Propriedade</DarkLabel>
              <select
                className="nt-input"
                value={form.propertyId}
                onChange={e => set('propertyId', e.target.value)}
              >
                <option value="">Selecionar propriedade</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sizeHectares} ha)</option>
                ))}
              </select>
            </div>

            <button className="nt-btn-next" style={{ flex: 'none', width: '100%' }} onClick={() => setStep(2)} disabled={!canGoStep2}>
              Continuar
            </button>
          </div>
        )}

        {/* ─── STEP 2 ─── */}
        {step === 2 && (
          <div className="nt-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* IA + QUBO Sugestão */}
            <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>⚛️ Sugestão Inteligente</div>
                  <div style={{ fontSize: 11, color: '#4f4fa0', marginTop: 2 }}>QUBO · NVIDIA NIM · preenche o formulário</div>
                </div>
                <button
                  onClick={sugerirComIA}
                  disabled={loadingSugestao || !form.type}
                  style={{
                    background: loadingSugestao ? 'rgba(99,102,241,0.3)' : '#4f46e5',
                    border: 'none', borderRadius: 10, color: '#fff',
                    fontSize: 12, fontWeight: 700, padding: '8px 16px', cursor: 'pointer',
                    opacity: !form.type ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {loadingSugestao ? '⏳ Calculando...' : '⚡ Sugerir'}
                </button>
              </div>

              {!sugestaoIA && !loadingSugestao && (
                <div style={{ padding: '10px 16px', fontSize: 12, color: '#4f4fa0' }}>
                  Analisa seus dados financeiros e usa otimização quântica (QUBO) para sugerir o preço ideal de token e preenche todos os campos automaticamente.
                </div>
              )}

              {loadingSugestao && (
                <div style={{ padding: '10px 16px', fontSize: 12, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚛️</span>
                  Otimizando preço com Simulated Annealing...
                </div>
              )}

              {sugestaoIA && (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                      R$ {sugestaoIA.precoToken}/token
                    </span>
                    <span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                      {sugestaoIA.totalTokens?.toLocaleString('pt-BR')} tokens
                    </span>
                    <span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                      {sugestaoIA.retornoEsperado}% a.a.
                    </span>
                    <span style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>
                      Liquidez {sugestaoIA.liquidityScore}%
                    </span>
                  </div>
                  {sugestaoIA.justificativa && (
                    <div style={{ fontSize: 11, color: '#3d7a52', fontStyle: 'italic' }}>{sugestaoIA.justificativa}</div>
                  )}
                  <div style={{ fontSize: 10, color: '#2a3f30' }}>✅ Formulário preenchido — revise e ajuste se necessário</div>
                </div>
              )}
            </div>

            <div>
              <DarkLabel>Título do token</DarkLabel>
              <input
                className="nt-input"
                placeholder={
                  form.type === 'SAFRA' ? 'Ex: Soja Safra 2025/26 — Fazenda São João' :
                  form.type === 'MATERIAL' ? 'Ex: Semente Soja Intacta RR2 — 500 sacas' :
                  'Ex: Trator John Deere 7200 — 200h de uso'
                }
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            <div>
              <DarkLabel>Descrição (opcional)</DarkLabel>
              <textarea
                className="nt-textarea"
                rows={3}
                placeholder="Descreva o ativo, condições, garantias..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <DarkLabel>Valor total (R$)</DarkLabel>
                <input className="nt-input" type="number" min="0" placeholder="500000" value={form.totalValue} onChange={e => set('totalValue', e.target.value)} />
              </div>
              <div>
                <DarkLabel>Preço por token (R$)</DarkLabel>
                <input className="nt-input" type="number" min="1" placeholder="100" value={form.tokenPrice} onChange={e => set('tokenPrice', e.target.value)} />
              </div>
            </div>

            {totalTokens > 0 && !tvOverLimit && (
              <div style={{
                background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)',
                borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#4ade80',
              }}>
                Serão emitidos <strong>{totalTokens.toLocaleString('pt-BR')} tokens</strong> de{' '}
                R$ {parseFloat(form.tokenPrice).toLocaleString('pt-BR')} cada
              </div>
            )}
            {tvOverLimit && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#f87171',
              }}>
                ⚠️ Limite piloto: máximo R$ 100.000 por oferta. Reduza o valor total.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <DarkLabel>Rendimento esperado (%)</DarkLabel>
                <input className="nt-input" type="number" step="0.1" placeholder="8.5" value={form.expectedReturn} onChange={e => set('expectedReturn', e.target.value)} />
              </div>
              <div>
                <DarkLabel>Prazo (meses)</DarkLabel>
                <input className="nt-input" type="number" min="1" placeholder="12" value={form.periodMonths} onChange={e => set('periodMonths', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="nt-btn-back" onClick={() => setStep(1)}>Voltar</button>
              <button className="nt-btn-next" onClick={() => setStep(3)} disabled={!canGoStep3}>Continuar</button>
            </div>
          </div>
        )}

        {/* ─── STEP 3 ─── */}
        {step === 3 && (
          <div className="nt-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {selectedType && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: selectedType.bgActive,
                border: `1px solid ${selectedType.borderActive}`,
                borderRadius: 12,
              }}>
                <span style={{ color: selectedType.accent }}>{selectedType.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#e2faea' }}>{selectedType.label}</div>
                  <div style={{ fontSize: 12, color: '#3a6648', marginTop: 2 }}>{selectedType.desc}</div>
                </div>
              </div>
            )}

            {/* Safra */}
            {form.type === 'SAFRA' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <DarkLabel>Commodity</DarkLabel>
                    <select className="nt-input" value={form.commodity} onChange={e => set('commodity', e.target.value)}>
                      <option value="">Selecionar</option>
                      {COMMODITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <DarkLabel>Quantidade prometida (kg)</DarkLabel>
                    <input className="nt-input" type="number" min="0" placeholder="1500000" value={form.quantityKg} onChange={e => set('quantityKg', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <DarkLabel>Data de entrega</DarkLabel>
                    <input className="nt-input" type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                  </div>
                  {fields.length > 0 && (
                    <div>
                      <DarkLabel>Talhão (opcional)</DarkLabel>
                      <select className="nt-input" value={form.fieldId} onChange={e => set('fieldId', e.target.value)}>
                        <option value="">Toda a propriedade</option>
                        {fields.map(f => <option key={f.id} value={f.id}>{f.name} ({f.sizeHectares} ha)</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Material */}
            {form.type === 'MATERIAL' && (
              <>
                <div>
                  <DarkLabel>Tipo de insumo</DarkLabel>
                  <select className="nt-input" value={form.materialType} onChange={e => set('materialType', e.target.value)}>
                    <option value="">Selecionar</option>
                    {MATERIALS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <DarkLabel>Quantidade</DarkLabel>
                    <input className="nt-input" type="number" min="0" placeholder="500" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                  </div>
                  <div>
                    <DarkLabel>Unidade</DarkLabel>
                    <select className="nt-input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                      {['kg', 'L', 'sacas', 'toneladas', 'unidades'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Maquinário */}
            {form.type === 'MAQUINARIO' && (
              <>
                <div>
                  <DarkLabel>Tipo de máquina</DarkLabel>
                  <select className="nt-input" value={form.machineType} onChange={e => set('machineType', e.target.value)}>
                    <option value="">Selecionar</option>
                    {MACHINES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <DarkLabel>Modelo</DarkLabel>
                    <input className="nt-input" placeholder="Ex: John Deere 7200" value={form.machineModel} onChange={e => set('machineModel', e.target.value)} />
                  </div>
                  <div>
                    <DarkLabel>Ano</DarkLabel>
                    <input className="nt-input" type="number" min="1990" max="2030" placeholder="2022" value={form.machineYear} onChange={e => set('machineYear', e.target.value)} />
                  </div>
                </div>
                <div>
                  <DarkLabel>Horas de uso disponíveis (modelo B)</DarkLabel>
                  <input className="nt-input" type="number" min="0" placeholder="200" value={form.usageHours} onChange={e => set('usageHours', e.target.value)} />
                  <p style={{ fontSize: 11, color: '#2a5c3a', marginTop: 5 }}>
                    Deixe em branco para modelo de co-propriedade
                  </p>
                </div>
              </>
            )}

            {/* Preview */}
            {form.title && form.totalValue && (
              <div style={{
                background: 'rgba(4,14,9,0.8)', border: '1px solid rgba(22,163,74,0.12)',
                borderRadius: 14, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#2a5c3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Resumo do token
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e2faea', fontSize: 15, marginBottom: 10 }}>
                  {form.title}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Valor total', value: `R$ ${parseFloat(form.totalValue).toLocaleString('pt-BR')}` },
                    { label: 'Tokens', value: `${totalTokens.toLocaleString('pt-BR')} × R$ ${parseFloat(form.tokenPrice || '0').toLocaleString('pt-BR')}` },
                    ...(form.expectedReturn ? [{ label: 'Rendimento', value: `${form.expectedReturn}% / ${form.periodMonths || '?'}m` }] : []),
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 10, color: '#2a5c3a', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#86efac' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAR — Cadastro Ambiental Rural */}
            <div>
              <DarkLabel>Nº do CAR — Cadastro Ambiental Rural *</DarkLabel>
              <input
                className="nt-input"
                placeholder="Ex: SP-3512020-19BD8D124B524EF9B1BF5B02A1AB6C46"
                value={form.carNumber}
                onChange={e => set('carNumber', e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}
              />
              {form.carNumber && !carOk && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>
                  Formato inválido. Use: UF-{'{7 dígitos}'}-{'{32 caracteres}'} — encontre no <a href="https://www.car.gov.br/publico/imoveis/index" target="_blank" rel="noopener" style={{ color: '#4ade80' }}>Portal CAR</a>
                </p>
              )}
              {form.carNumber && carOk && (
                <p style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>
                  ✓ Formato válido — <a href="https://www.car.gov.br/publico/imoveis/index" target="_blank" rel="noopener" style={{ color: '#4ade80' }}>Verificar no Portal CAR</a>
                </p>
              )}
              {!form.carNumber && (
                <p style={{ fontSize: 11, color: '#2a5c3a', marginTop: 4 }}>
                  Obrigatório. Encontre no <a href="https://www.car.gov.br/publico/imoveis/index" target="_blank" rel="noopener" style={{ color: '#4ade80' }}>Portal CAR do governo federal</a>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="nt-btn-back" onClick={() => setStep(2)}>Voltar</button>
              <button className="nt-btn-next" onClick={() => setStep(4)} disabled={!canGoStep4}>Continuar</button>
            </div>
          </div>
        )}

        {/* ─── STEP 4 ─── */}
        {step === 4 && (
          <div className="nt-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Simulação financeira */}
            <div style={{
              background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.14)',
              borderRadius: 16, padding: '20px 20px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#2a5c3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                Simulação financeira
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Valor total do ativo', value: `R$ ${tv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, color: '#86efac' },
                  { label: 'Taxa de originação (2%) — ao ser aprovado', value: `− R$ ${feeOriginacao.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, color: '#f87171' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#3a6648' }}>{r.label}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: '1px solid rgba(22,163,74,0.12)', paddingTop: 10, marginTop: 4,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>Você capta líquido</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#4ade80' }}>
                    R$ {liquidoProdutor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#2a5c3a' }}>Taxa de sucesso (3%) — na liquidação</span>
                  <span style={{ fontSize: 11, color: '#2a5c3a' }}>− R$ {feeSucesso.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sobre captado</span>
                </div>
              </div>
              {form.expectedReturn && form.periodMonths && (
                <div style={{
                  marginTop: 14,
                  background: 'rgba(2,12,8,0.7)', border: '1px solid rgba(22,163,74,0.1)',
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 10, color: '#2a5c3a', marginBottom: 4 }}>Retorno projetado para investidores</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#4ade80' }}>
                    {form.expectedReturn}% em {form.periodMonths} meses
                  </div>
                </div>
              )}
            </div>

            {/* CPF */}
            <div>
              <DarkLabel>CPF do responsável</DarkLabel>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="nt-input"
                  style={{
                    flex: 1,
                    borderColor: form.cpf && !cpfOk
                      ? 'rgba(248,113,113,0.5)'
                      : cpfResult
                        ? 'rgba(74,222,128,0.45)'
                        : undefined,
                    opacity: cpfResult ? 0.7 : 1,
                  }}
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={e => set('cpf', e.target.value)}
                  disabled={!!cpfResult}
                />
                <button
                  onClick={verifyCPF}
                  disabled={!cpfOk || cpfVerifying || !!cpfResult}
                  style={{
                    padding: '10px 18px', borderRadius: 10, border: 'none',
                    background: cpfResult ? 'rgba(74,222,128,0.15)' : '#16a34a',
                    color: cpfResult ? '#4ade80' : '#fff',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13,
                    cursor: !cpfOk || cpfVerifying || cpfResult ? 'not-allowed' : 'pointer',
                    opacity: !cpfOk || cpfVerifying || cpfResult ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {cpfVerifying ? (
                    <svg className="nt-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : cpfResult ? '✓ Verificado' : 'Verificar'}
                </button>
              </div>

              {form.cpf && !cpfOk && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 5 }}>CPF inválido</p>
              )}
              {cpfError && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 5 }}>{cpfError}</p>
              )}
              {cpfResult && (
                <div style={{
                  marginTop: 10,
                  background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)',
                  borderRadius: 12, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#4ade80' }}>{cpfResult.nome}</div>
                    {cpfResult.nasc && (
                      <div style={{ fontSize: 12, color: '#3a6648', marginTop: 2 }}>Nascimento: {cpfResult.nasc}</div>
                    )}
                    <div style={{ fontSize: 11, color: '#2a5c3a', marginTop: 2 }}>Identidade confirmada via Receita Federal</div>
                  </div>
                </div>
              )}
              {cpfOk && !cpfResult && !cpfError && (
                <p style={{ fontSize: 11, color: '#2a5c3a', marginTop: 5 }}>
                  Clique em "Verificar" para confirmar sua identidade via Receita Federal
                </p>
              )}
            </div>

            {/* Conformidade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'aceitaTermos',  label: 'Declaro que as informações sobre o ativo são verídicas e de minha responsabilidade.' },
                { key: 'aceitaCVM',     label: 'Estou ciente de que tokens de segurança (recebíveis) exigem conformidade com a CVM Resolução 88. Este token está registrado como ativo de utilidade (Utility Token) em fase piloto.' },
                { key: 'aceitaPiloto', label: 'Concordo com os Termos de Uso da plataforma AgroToken e entendo que esta é uma fase piloto sem registro em blockchain.' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={!!form[key as keyof typeof form]}
                    onChange={e => set(key, e.target.checked)}
                    style={{ marginTop: 2, width: 16, height: 16, accentColor: '#16a34a', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: '#3a6648', lineHeight: 1.55 }}>{label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="nt-btn-back" onClick={() => setStep(3)}>Voltar</button>
              <button className="nt-btn-next" onClick={handleSubmit} disabled={!canSubmit || saving}>
                {saving ? (
                  <>
                    <svg className="nt-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Criando...
                  </>
                ) : 'Criar token'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
