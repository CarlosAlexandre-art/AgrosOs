'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import HowToUse from '@/components/HowToUse'

interface AnimalCard {
  id: string
  identificacao: string
  raca?: string
  sexo: string
  especie: string
  pesoAtual?: number
  sisbovId?: string
  dataNascimento?: string
  lote?: { nome: string; objetivo: string } | null
  _count: { saude: number; movimentos: number }
}

interface AnimalIA {
  identificacao: string
  sexo: string
  raca?: string
  dataNascimento?: string
  pesoAtual?: number
  origemFazenda?: string
}

export default function CarteiraAnimalPage() {
  const [animais, setAnimais] = useState<AnimalCard[]>([])
  const [loading, setLoading] = useState(true)
  const [semPropriedade, setSemPropriedade] = useState(false)
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    identificacao: '', sexo: 'MACHO', raca: '', brincoEletronico: '',
    sisbovId: '', rfid: '', dataNascimento: '', pesoAtual: '', loteId: '',
    origemFazenda: '', gtaOrigem: '',
  })

  // IA em massa
  const [showIA, setShowIA] = useState(false)
  const [descIA, setDescIA] = useState('')
  const [parsandoIA, setParsandoIA] = useState(false)
  const [animaisIA, setAnimaisIA] = useState<AnimalIA[]>([])
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState<{ criados: number; erros: string[] } | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/carteira-animal')
      .then(r => r.json())
      .then(d => {
        if (d.error === 'Propriedade não encontrada') { setSemPropriedade(true); return }
        if (!d.error) setAnimais(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarAnimal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/carteira-animal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) { alert(data.error || 'Erro ao cadastrar animal'); return }
      setShowForm(false)
      setForm({ identificacao: '', sexo: 'MACHO', raca: '', brincoEletronico: '', sisbovId: '', rfid: '', dataNascimento: '', pesoAtual: '', loteId: '', origemFazenda: '', gtaOrigem: '' })
      carregar()
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function parsearComIA() {
    if (!descIA.trim()) return
    setParsandoIA(true)
    setAnimaisIA([])
    try {
      const res = await fetch('/api/carteira-animal/ai-parse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: descIA }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { alert(data.error); return }
      setAnimaisIA(data.animais)
    } catch {
      alert('Erro de conexão.')
    } finally {
      setParsandoIA(false)
    }
  }

  async function confirmarImport() {
    if (animaisIA.length === 0) return
    setImportando(true)
    try {
      const res = await fetch('/api/carteira-animal/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animais: animaisIA }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { alert(data.error); return }
      setResultadoImport({ criados: data.criados, erros: data.erros })
      carregar()
    } catch {
      alert('Erro de conexão.')
    } finally {
      setImportando(false)
    }
  }

  function fecharIA() {
    setShowIA(false)
    setDescIA('')
    setAnimaisIA([])
    setResultadoImport(null)
  }

  const filtrados = animais.filter(a =>
    a.identificacao.toLowerCase().includes(busca.toLowerCase()) ||
    (a.sisbovId?.toLowerCase().includes(busca.toLowerCase())) ||
    (a.raca?.toLowerCase().includes(busca.toLowerCase()))
  )

  // Estado: sem propriedade cadastrada
  if (!loading && semPropriedade) {
    return (
      <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏚️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Cadastre sua fazenda primeiro</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
            A Carteira Animal precisa de uma propriedade vinculada à sua conta. Complete o cadastro da sua fazenda para começar a registrar animais.
          </p>
          <Link href="/onboarding"
            style={{ display: 'inline-block', background: '#f59e0b', color: '#fff', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Cadastrar Fazenda →
          </Link>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 12 }}>
            Já cadastrou? Tente <button onClick={carregar} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 12 }}>recarregar</button>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '28px 24px', color: '#f1f5f9' }}>
      <HowToUse
        storageKey="carteira-animal"
        title="Carteira Animal — Passaporte Digital"
        subtitle="Histórico completo de cada animal: vacinas, medicações, movimentações e QR Code rastreável"
        theme="dark"
        accentColor="#f59e0b"
        steps={[
          { icon: '🐄', title: 'Cadastrar animal', description: 'Registre identificação, brinco eletrônico e número SISBOV do animal' },
          { icon: '💉', title: 'Histórico sanitário', description: 'Registre vacinas, medicações e exames — tudo com data e veterinário responsável' },
          { icon: '📱', title: 'QR Code rastreável', description: 'Cada animal tem um QR Code único que leva ao passaporte digital completo' },
        ]}
        tip="Animais com SISBOV registrado são elegíveis para protocolos de exportação via BovTrace (Embrapa)."
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Carteira Animal</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{animais.length} {animais.length === 1 ? 'animal' : 'animais'} cadastrados</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowIA(true)}
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            🤖 IA em Massa
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Novo Animal
          </button>
        </div>
      </div>

      {/* Busca */}
      <input
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Buscar por brinco, SISBOV ou raça..."
        style={{ width: '100%', background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 13, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
      />

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Carregando animais...</div>}

      {!loading && animais.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐄</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nenhum animal cadastrado</p>
          <p style={{ fontSize: 13 }}>Cadastre animais para criar o passaporte digital e rastrear o histórico sanitário</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setShowForm(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cadastrar Primeiro Animal
            </button>
            <button onClick={() => setShowIA(true)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🤖 Importar com IA
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtrados.map(a => (
          <Link key={a.id} href={`/dashboard/carteira-animal/${a.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#f59e0b')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.identificacao}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{a.raca || 'Raça não informada'} · {a.sexo === 'MACHO' ? '♂' : '♀'}</div>
                </div>
                <div style={{ fontSize: 20 }}>{a.sexo === 'MACHO' ? '🐂' : '🐄'}</div>
              </div>
              {a.sisbovId && (
                <div style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>
                  SISBOV: {a.sisbovId}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {a.pesoAtual && <span style={{ fontSize: 11, color: '#94a3b8' }}>⚖ {a.pesoAtual} kg</span>}
                {a._count.saude > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>💉 {a._count.saude} registros</span>}
                {a.lote && <span style={{ fontSize: 11, color: '#60a5fa' }}>📦 {a.lote.nome}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Modal novo animal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, overflowY: 'auto' }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, margin: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Cadastrar Animal</h2>
            <form onSubmit={salvarAnimal} style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Identificação (brinco/nome) *', key: 'identificacao', placeholder: 'Ex: BR-001 ou #0042' },
                { label: 'Brinco eletrônico', key: 'brincoEletronico', placeholder: '982 000412345678' },
                { label: 'Nº SISBOV', key: 'sisbovId', placeholder: '076 0001 00000001 0' },
                { label: 'RFID', key: 'rfid', placeholder: 'Código do brinco RFID' },
                { label: 'Raça', key: 'raca', placeholder: 'Nelore, Angus, Girolando...' },
                { label: 'Data de nascimento', key: 'dataNascimento', type: 'date' },
                { label: 'Peso atual (kg)', key: 'pesoAtual', placeholder: '380', type: 'number' },
                { label: 'Fazenda de origem', key: 'origemFazenda', placeholder: 'Nome da propriedade de origem' },
                { label: 'GTA de entrada', key: 'gtaOrigem', placeholder: 'Nº da Guia de Trânsito Animal' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form] || ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.label.includes('*')}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Sexo *</label>
                <select value={form.sexo} onChange={e => setForm(p => ({ ...p, sexo: e.target.value }))}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                  <option value="MACHO">Macho</option>
                  <option value="FEMEA">Fêmea</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: '10px', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal IA em Massa */}
      {showIA && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, overflowY: 'auto' }}>
          <div style={{ background: '#111827', border: '1px solid #312e81', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 24 }}>🤖</div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Cadastro em Massa com IA</h2>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
              Descreva seu rebanho em linguagem natural. A IA interpreta e cria os registros automaticamente.
            </p>

            {!resultadoImport ? (
              <>
                <textarea
                  value={descIA}
                  onChange={e => setDescIA(e.target.value)}
                  placeholder={'Exemplos:\n• 15 novilhas Nelore fêmea, nascidas em março de 2024, peso médio 280kg, vindo da Fazenda São João\n• 8 touros Angus macho, brinco #0100 a #0107, 450kg cada\n• Lote misto: 10 Girolando fêmea (nascidas jan/2023) e 5 machos Zebu sem data'}
                  rows={5}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #312e81', borderRadius: 10, padding: '12px 14px', color: '#f1f5f9', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
                />

                {animaisIA.length === 0 ? (
                  <button onClick={parsearComIA} disabled={parsandoIA || !descIA.trim()}
                    style={{ width: '100%', background: parsandoIA ? '#4338ca' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 700, cursor: parsandoIA ? 'wait' : 'pointer', opacity: !descIA.trim() ? 0.5 : 1 }}>
                    {parsandoIA ? '🧠 Interpretando com IA...' : '🧠 Interpretar com IA'}
                  </button>
                ) : (
                  <>
                    <div style={{ background: '#0f172a', borderRadius: 10, padding: '12px 14px', marginBottom: 12, maxHeight: 200, overflowY: 'auto', border: '1px solid #1e293b' }}>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
                        {animaisIA.length} animais identificados — revise antes de importar:
                      </div>
                      {animaisIA.map((a, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{a.identificacao}</span>
                            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{a.sexo === 'MACHO' ? '♂ Macho' : '♀ Fêmea'}</span>
                            {a.raca && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>· {a.raca}</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', textAlign: 'right' }}>
                            {a.pesoAtual ? `${a.pesoAtual}kg` : ''}
                            {a.dataNascimento ? ` · ${new Date(a.dataNascimento).toLocaleDateString('pt-BR')}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setAnimaisIA([])}
                        style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: '10px', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                        ← Reeditar
                      </button>
                      <button onClick={confirmarImport} disabled={importando}
                        style={{ flex: 2, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: importando ? 'wait' : 'pointer', opacity: importando ? 0.6 : 1 }}>
                        {importando ? 'Importando...' : `✓ Importar ${animaisIA.length} animais`}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{resultadoImport.erros.length === 0 ? '🎉' : '⚠️'}</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                  {resultadoImport.criados} {resultadoImport.criados === 1 ? 'animal importado' : 'animais importados'}!
                </p>
                {resultadoImport.erros.length > 0 && (
                  <p style={{ fontSize: 13, color: '#f87171', marginBottom: 8 }}>
                    {resultadoImport.erros.length} falha(s): {resultadoImport.erros.join(', ')}
                  </p>
                )}
                <button onClick={fecharIA}
                  style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 12 }}>
                  Ver animais
                </button>
              </div>
            )}

            {!resultadoImport && (
              <button onClick={fecharIA}
                style={{ width: '100%', marginTop: 10, background: 'transparent', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', padding: '6px' }}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
