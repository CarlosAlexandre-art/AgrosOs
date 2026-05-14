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

export default function CarteiraAnimalPage() {
  const [animais, setAnimais] = useState<AnimalCard[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    identificacao: '', sexo: 'MACHO', raca: '', brincoEletronico: '',
    sisbovId: '', dataNascimento: '', pesoAtual: '', loteId: '',
    origemFazenda: '', gtaOrigem: '',
  })

  const carregar = useCallback(() => {
    setLoading(true)
    fetch('/api/carteira-animal')
      .then(r => r.json())
      .then(d => { if (!d.error) setAnimais(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarAnimal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/carteira-animal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { alert(data.error); setSaving(false); return }
    setShowForm(false)
    setForm({ identificacao: '', sexo: 'MACHO', raca: '', brincoEletronico: '', sisbovId: '', dataNascimento: '', pesoAtual: '', loteId: '', origemFazenda: '', gtaOrigem: '' })
    carregar()
    setSaving(false)
  }

  const filtrados = animais.filter(a =>
    a.identificacao.toLowerCase().includes(busca.toLowerCase()) ||
    (a.sisbovId?.toLowerCase().includes(busca.toLowerCase())) ||
    (a.raca?.toLowerCase().includes(busca.toLowerCase()))
  )

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Carteira Animal</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{animais.length} {animais.length === 1 ? 'animal' : 'animais'} cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Novo Animal
        </button>
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
          <button onClick={() => setShowForm(true)} style={{ marginTop: 16, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cadastrar Primeiro Animal
          </button>
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
    </div>
  )
}
