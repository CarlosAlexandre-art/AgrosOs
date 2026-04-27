'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Property = { id: string; name: string; sizeHectares: number }
type Field = { id: string; name: string; sizeHectares: number }

const TOKEN_TYPES = [
  {
    type: 'SAFRA',
    label: 'Safra',
    desc: 'Tokenize sua produção futura — soja, milho, café, algodão. Investidores financiam sua safra antecipadamente.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: 'border-green-300 bg-green-50 text-green-700',
    active: 'border-green-500 bg-green-100',
  },
  {
    type: 'MATERIAL',
    label: 'Material / Insumo',
    desc: 'Tokenize seu estoque de sementes, fertilizantes ou defensivos. Venda para outros produtores ou investidores.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    color: 'border-amber-300 bg-amber-50 text-amber-700',
    active: 'border-amber-500 bg-amber-100',
  },
  {
    type: 'MAQUINARIO',
    label: 'Maquinário',
    desc: 'Tokenize tratores, colheitadeiras ou implementos. Ofereça direito de uso ou fracionamento de propriedade.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    color: 'border-blue-300 bg-blue-50 text-blue-700',
    active: 'border-blue-500 bg-blue-100',
  },
]

const COMMODITIES = ['Soja', 'Milho', 'Café', 'Algodão', 'Cana-de-açúcar', 'Trigo', 'Arroz', 'Feijão', 'Outros']
const MATERIALS = ['Sementes certificadas', 'Fertilizante (NPK)', 'Ureia', 'MAP', 'KCl', 'Herbicida', 'Fungicida', 'Inseticida', 'Calcário', 'Outros']
const MACHINES = ['Trator', 'Colheitadeira', 'Pulverizador', 'Plantadeira', 'Grade aradora', 'Subsolador', 'Carreta graneleira', 'Outros']

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition bg-white"
    >
      {children}
    </select>
  )
}

const ORIGINACAO_RATE = 0.02
const SUCESSO_RATE = 0.03

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

export default function NovoTokenPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [fields, setFields] = useState<Field[]>([])

  const [form, setForm] = useState({
    type: '',
    propertyId: '',
    title: '',
    description: '',
    totalValue: '',
    tokenPrice: '100',
    expectedReturn: '',
    periodMonths: '',
    // Safra
    commodity: '',
    quantityKg: '',
    deliveryDate: '',
    fieldId: '',
    // Material
    materialType: '',
    quantity: '',
    unit: 'kg',
    // Maquinário
    machineType: '',
    machineModel: '',
    machineYear: '',
    usageHours: '',
    // Compliance
    cpf: '',
    aceitaTermos: false,
    aceitaCVM: false,
    aceitaPiloto: false,
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

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
      // Save CPF to user profile
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
  const tp = parseFloat(form.tokenPrice) || 100
  const feeOriginacao = tv * ORIGINACAO_RATE
  const feeSucesso = tv * SUCESSO_RATE
  const liquidoProdutor = tv - feeOriginacao
  const cpfOk = validateCPF(form.cpf)

  const canGoStep2 = !!form.type && !!form.propertyId
  const canGoStep3 = !!form.title && !!form.totalValue && !!form.tokenPrice
  const canGoStep4 = canGoStep3 && (
    form.type === 'SAFRA' ? !!form.commodity && !!form.deliveryDate :
    form.type === 'MATERIAL' ? !!form.materialType && !!form.quantity :
    !!form.machineType
  )
  const canSubmit = canGoStep4 && cpfOk && form.aceitaTermos && form.aceitaCVM && form.aceitaPiloto

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/token" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Novo token</h1>
          <p className="text-sm text-slate-500">Tokenize um ativo agrícola</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-[#16a34a]' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="text-xs text-slate-400 -mt-4">
        {step === 1 ? 'Tipo e propriedade' : step === 2 ? 'Valores e retorno' : step === 3 ? 'Detalhes do ativo' : 'Simulação e conformidade'}
      </div>

      {/* Step 1 — Tipo e propriedade */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <Label>Tipo de ativo</Label>
            <div className="grid gap-3">
              {TOKEN_TYPES.map(t => (
                <button
                  key={t.type}
                  onClick={() => set('type', t.type)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${form.type === t.type ? t.active : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <span className={form.type === t.type ? t.color.split(' ')[2] : 'text-slate-400'}>
                    {t.icon}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Propriedade</Label>
            <Select value={form.propertyId} onChange={e => set('propertyId', e.target.value)}>
              <option value="">Selecionar propriedade</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sizeHectares} ha)</option>)}
            </Select>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canGoStep2}
            className="w-full bg-[#16a34a] text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-[#15803d] transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2 — Valores */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <Label>Título do token</Label>
            <Input
              placeholder={`Ex: ${form.type === 'SAFRA' ? 'Soja Safra 2025/26 — Fazenda São João' : form.type === 'MATERIAL' ? 'Semente Soja Intacta RR2 — 500 sacas' : 'Trator John Deere 7200 — 200h de uso'}`}
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          <div>
            <Label>Descrição (opcional)</Label>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] resize-none"
              rows={3}
              placeholder="Descreva o ativo, condições, garantias..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor total (R$)</Label>
              <Input
                type="number"
                min="0"
                placeholder="500000"
                value={form.totalValue}
                onChange={e => set('totalValue', e.target.value)}
              />
            </div>
            <div>
              <Label>Preço por token (R$)</Label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={form.tokenPrice}
                onChange={e => set('tokenPrice', e.target.value)}
              />
            </div>
          </div>

          {totalTokens > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
              Serão emitidos <strong>{totalTokens.toLocaleString('pt-BR')} tokens</strong> de R$ {parseFloat(form.tokenPrice).toLocaleString('pt-BR')} cada
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rendimento esperado (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="8.5"
                value={form.expectedReturn}
                onChange={e => set('expectedReturn', e.target.value)}
              />
            </div>
            <div>
              <Label>Prazo (meses)</Label>
              <Input
                type="number"
                min="1"
                placeholder="12"
                value={form.periodMonths}
                onChange={e => set('periodMonths', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canGoStep3}
              className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-[#15803d] transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Detalhes específicos */}
      {step === 3 && (
        <div className="space-y-5">
          <div className={`p-3 rounded-xl border ${selectedType?.color}`}>
            <div className="font-semibold text-sm">{selectedType?.label}</div>
            <div className="text-xs mt-0.5 opacity-80">{selectedType?.desc}</div>
          </div>

          {/* Safra */}
          {form.type === 'SAFRA' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Commodity</Label>
                  <Select value={form.commodity} onChange={e => set('commodity', e.target.value)}>
                    <option value="">Selecionar</option>
                    {COMMODITIES.map(c => <option key={c}>{c}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Quantidade prometida (kg)</Label>
                  <Input type="number" min="0" placeholder="1500000" value={form.quantityKg} onChange={e => set('quantityKg', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de entrega</Label>
                  <Input type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                </div>
                {fields.length > 0 && (
                  <div>
                    <Label>Talhão (opcional)</Label>
                    <Select value={form.fieldId} onChange={e => set('fieldId', e.target.value)}>
                      <option value="">Toda a propriedade</option>
                      {fields.map(f => <option key={f.id} value={f.id}>{f.name} ({f.sizeHectares} ha)</option>)}
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Material */}
          {form.type === 'MATERIAL' && (
            <>
              <div>
                <Label>Tipo de insumo</Label>
                <Select value={form.materialType} onChange={e => set('materialType', e.target.value)}>
                  <option value="">Selecionar</option>
                  {MATERIALS.map(m => <option key={m}>{m}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade</Label>
                  <Input type="number" min="0" placeholder="500" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={form.unit} onChange={e => set('unit', e.target.value)}>
                    {['kg', 'L', 'sacas', 'toneladas', 'unidades'].map(u => <option key={u}>{u}</option>)}
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Maquinário */}
          {form.type === 'MAQUINARIO' && (
            <>
              <div>
                <Label>Tipo de máquina</Label>
                <Select value={form.machineType} onChange={e => set('machineType', e.target.value)}>
                  <option value="">Selecionar</option>
                  {MACHINES.map(m => <option key={m}>{m}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modelo</Label>
                  <Input placeholder="Ex: John Deere 7200" value={form.machineModel} onChange={e => set('machineModel', e.target.value)} />
                </div>
                <div>
                  <Label>Ano</Label>
                  <Input type="number" min="1990" max="2030" placeholder="2022" value={form.machineYear} onChange={e => set('machineYear', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Horas de uso disponíveis (modelo B)</Label>
                <Input type="number" min="0" placeholder="200" value={form.usageHours} onChange={e => set('usageHours', e.target.value)} />
                <p className="text-xs text-slate-400 mt-1">Deixe em branco para modelo de co-propriedade</p>
              </div>
            </>
          )}

          {/* Preview */}
          {form.title && form.totalValue && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resumo do token</div>
              <div className="font-bold text-slate-900">{form.title}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-400">Valor total:</span> <span className="font-semibold">R$ {parseFloat(form.totalValue).toLocaleString('pt-BR')}</span></div>
                <div><span className="text-slate-400">Tokens:</span> <span className="font-semibold">{totalTokens.toLocaleString('pt-BR')} × R$ {parseFloat(form.tokenPrice || '0').toLocaleString('pt-BR')}</span></div>
                {form.expectedReturn && <div><span className="text-slate-400">Rendimento:</span> <span className="font-semibold text-green-700">{form.expectedReturn}% / {form.periodMonths || '?'}m</span></div>}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Voltar
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!canGoStep4}
              className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-[#15803d] transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Simulação e Conformidade */}
      {step === 4 && (
        <div className="space-y-5">
          {/* Simulador financeiro */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Simulação financeira</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Valor total do ativo</span>
                <span className="font-semibold text-slate-900">R$ {tv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Taxa de originação (2%) — ao ser aprovado</span>
                <span className="font-semibold text-red-600">− R$ {feeOriginacao.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-green-200 pt-3">
                <span className="font-semibold text-slate-700">Você capta líquido</span>
                <span className="font-bold text-green-700">R$ {liquidoProdutor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 text-xs">Taxa de sucesso (3%) — na liquidação</span>
                <span className="text-xs text-slate-500">− R$ {feeSucesso.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sobre captado</span>
              </div>
            </div>
            {form.expectedReturn && form.periodMonths && (
              <div className="mt-4 bg-white rounded-xl p-3 text-sm">
                <div className="text-xs text-slate-400 mb-1">Retorno projetado para investidores</div>
                <div className="font-semibold text-green-700">{form.expectedReturn}% em {form.periodMonths} meses</div>
              </div>
            )}
          </div>

          {/* CPF */}
          <div>
            <Label>CPF do responsável</Label>
            <Input
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={e => set('cpf', e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition ${
                form.cpf && !cpfOk ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-[#16a34a]'
              }`}
            />
            {form.cpf && !cpfOk && <p className="text-xs text-red-500 mt-1">CPF inválido</p>}
            {cpfOk && <p className="text-xs text-green-600 mt-1">✓ CPF válido</p>}
          </div>

          {/* Checkboxes de conformidade */}
          <div className="space-y-3">
            {[
              { key: 'aceitaTermos', label: 'Declaro que as informações sobre o ativo são verídicas e de minha responsabilidade.' },
              { key: 'aceitaCVM', label: 'Estou ciente de que tokens de segurança (recebíveis) exigem conformidade com a CVM Resolução 88. Este token está registrado como ativo de utilidade (Utility Token) em fase piloto.' },
              { key: 'aceitaPiloto', label: 'Concordo com os Termos de Uso da plataforma AgroToken e entendo que esta é uma fase piloto sem registro em blockchain.' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form[key as keyof typeof form]}
                  onChange={e => set(key, e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#16a34a] flex-shrink-0"
                />
                <span className="text-sm text-slate-600 leading-snug">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 border border-gray-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="flex-1 bg-[#16a34a] text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando...
                </>
              ) : 'Criar token'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
