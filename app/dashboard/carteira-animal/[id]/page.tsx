'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface AnimalDetalhe {
  id: string; identificacao: string; brincoEletronico?: string; sisbovId?: string; rfid?: string
  especie: string; raca?: string; sexo: string; dataNascimento?: string
  pesoNascimento?: number; pesoAtual?: number; origemFazenda?: string; gtaOrigem?: string
  lote?: { nome: string; objetivo: string; status: string } | null
  saude: Array<{ id: string; tipo: string; descricao: string; produto?: string; dose?: string; veterinario?: string; dataRegistro: string; proximaDose?: string }>
  movimentos: Array<{ id: string; tipo: string; origem?: string; destino?: string; peso?: number; data: string; gta?: string; observacao?: string }>
}

const TIPO_SAUDE_ICON: Record<string, string> = {
  VACINA: '💉', MEDICACAO: '💊', EXAME: '🔬', DIAGNOSTICO: '🩺', OBSERVACAO: '📝',
}
const TIPO_MOVIMENTO_ICON: Record<string, string> = {
  ENTRADA: '➡️', SAIDA: '⬅️', TRANSFERENCIA: '🔄', ABATE: '🔴', NASCIMENTO: '🌱',
}

export default function PassaporteAnimalPage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<{ animal: AnimalDetalhe; idadeTexto: string; resumoSaude: { totalVacinas: number; totalMedicacoes: number; ultimaOcorrencia: string | null }; propriedade: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'passaporte' | 'saude' | 'movimentos'>('passaporte')
  const [showSaudeForm, setShowSaudeForm] = useState(false)
  const [savingSaude, setSavingSaude] = useState(false)
  const [saudeForm, setSaudeForm] = useState({ tipo: 'VACINA', descricao: '', produto: '', dose: '', veterinario: '', proximaDose: '' })

  const carregar = useCallback(() => {
    if (!id) return
    fetch(`/api/carteira-animal/${id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function salvarSaude(e: React.FormEvent) {
    e.preventDefault()
    setSavingSaude(true)
    await fetch('/api/carteira-animal/saude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...saudeForm, animalId: id }),
    })
    setShowSaudeForm(false)
    setSaudeForm({ tipo: 'VACINA', descricao: '', produto: '', dose: '', veterinario: '', proximaDose: '' })
    carregar()
    setSavingSaude(false)
  }

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Carregando passaporte...</div>
  if (!data) return <div style={{ padding: 40, color: '#f87171', textAlign: 'center' }}>Animal não encontrado</div>

  const { animal, idadeTexto, resumoSaude: rs, propriedade } = data
  const qrUrl = `/api/carteira-animal/${id}/qrcode`

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: '24px', color: '#f1f5f9' }}>
      <Link href="/dashboard/carteira-animal" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}>← Carteira Animal</Link>

      {/* Passaporte header */}
      <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1a1f2e 100%)', border: '1px solid #1e293b', borderRadius: 16, padding: 20, marginTop: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* QR Code */}
          <div style={{ flexShrink: 0 }}>
            <img src={qrUrl} alt="QR Code" width={90} height={90} style={{ borderRadius: 8, background: '#fff', padding: 4 }} />
            <a href={qrUrl} download={`passaporte-${animal.identificacao}.png`}
              style={{ display: 'block', fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 4, textDecoration: 'none' }}>
              ⬇ Baixar QR
            </a>
          </div>

          {/* Dados principais */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 900 }}>{animal.identificacao}</span>
              <span style={{ fontSize: 20 }}>{animal.sexo === 'MACHO' ? '🐂' : '🐄'}</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              {animal.raca || 'Raça não informada'} · {animal.sexo === 'MACHO' ? 'Macho' : 'Fêmea'} · {idadeTexto}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {animal.sisbovId && <div style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 20 }}>SISBOV: {animal.sisbovId}</div>}
              {animal.brincoEletronico && <div style={{ fontSize: 10, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '3px 8px', borderRadius: 20 }}>Brinco: {animal.brincoEletronico}</div>}
              {animal.pesoAtual && <div style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 20 }}>⚖ {animal.pesoAtual} kg</div>}
              {animal.lote && <div style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '3px 8px', borderRadius: 20 }}>📦 {animal.lote.nome}</div>}
            </div>
          </div>
        </div>

        {/* Stats sanitários */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
          {[
            { label: 'Vacinas', valor: String(rs.totalVacinas), icon: '💉', color: '#10b981' },
            { label: 'Medicações', valor: String(rs.totalMedicacoes), icon: '💊', color: '#60a5fa' },
            { label: 'Última ocorrência', valor: rs.ultimaOcorrencia ? new Date(rs.ultimaOcorrencia).toLocaleDateString('pt-BR') : '—', icon: '📅', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0f172a', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.valor}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #1e293b' }}>
        {([['passaporte', 'Identificação'], ['saude', 'Saúde & Vacinas'], ['movimentos', 'Movimentações']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setAba(k)}
            style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: 13, fontWeight: aba === k ? 700 : 400, color: aba === k ? '#f59e0b' : '#64748b', borderBottom: aba === k ? '2px solid #f59e0b' : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>
            {l}
          </button>
        ))}
      </div>

      {/* Aba Identificação */}
      {aba === 'passaporte' && (
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: '18px 20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94a3b8' }}>Dados de Identificação</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Espécie', valor: animal.especie },
              { label: 'Raça', valor: animal.raca || '—' },
              { label: 'Sexo', valor: animal.sexo === 'MACHO' ? 'Macho' : 'Fêmea' },
              { label: 'Data de nascimento', valor: animal.dataNascimento ? new Date(animal.dataNascimento).toLocaleDateString('pt-BR') : '—' },
              { label: 'Idade', valor: idadeTexto },
              { label: 'Peso de nascimento', valor: animal.pesoNascimento ? `${animal.pesoNascimento} kg` : '—' },
              { label: 'Peso atual', valor: animal.pesoAtual ? `${animal.pesoAtual} kg` : '—' },
              { label: 'SISBOV', valor: animal.sisbovId || '—' },
              { label: 'Brinco eletrônico', valor: animal.brincoEletronico || '—' },
              { label: 'RFID', valor: animal.rfid || '—' },
              { label: 'Fazenda de origem', valor: animal.origemFazenda || '—' },
              { label: 'Propriedade atual', valor: propriedade },
              { label: 'GTA de entrada', valor: animal.gtaOrigem || '—' },
              { label: 'Lote atual', valor: animal.lote?.nome || '—' },
            ].map(({ label, valor }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{valor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba Saúde */}
      {aba === 'saude' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowSaudeForm(true)}
              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Registro Sanitário
            </button>
          </div>
          {animal.saude.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💉</div>
              <p>Nenhum registro sanitário ainda</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {animal.saude.map(s => (
                <div key={s.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span>{TIPO_SAUDE_ICON[s.tipo]}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{s.descricao}</span>
                    <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>{new Date(s.dataRegistro).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {s.produto && <div style={{ fontSize: 11, color: '#94a3b8' }}>Produto: {s.produto}{s.dose ? ` · Dose: ${s.dose}` : ''}</div>}
                  {s.veterinario && <div style={{ fontSize: 11, color: '#94a3b8' }}>Responsável: {s.veterinario}</div>}
                  {s.proximaDose && <div style={{ fontSize: 11, color: '#f59e0b' }}>Próxima dose: {new Date(s.proximaDose).toLocaleDateString('pt-BR')}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba Movimentações */}
      {aba === 'movimentos' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {animal.movimentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
              <p>Nenhuma movimentação registrada</p>
            </div>
          ) : animal.movimentos.map(m => (
            <div key={m.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span>{TIPO_MOVIMENTO_ICON[m.tipo]}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{m.tipo}</span>
                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>{new Date(m.data).toLocaleDateString('pt-BR')}</span>
              </div>
              {m.origem && <div style={{ fontSize: 11, color: '#94a3b8' }}>De: {m.origem}</div>}
              {m.destino && <div style={{ fontSize: 11, color: '#94a3b8' }}>Para: {m.destino}</div>}
              {m.peso && <div style={{ fontSize: 11, color: '#f59e0b' }}>Peso: {m.peso} kg</div>}
              {m.gta && <div style={{ fontSize: 11, color: '#60a5fa' }}>GTA: {m.gta}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Modal saúde */}
      {showSaudeForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Registro Sanitário</h2>
            <form onSubmit={salvarSaude} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tipo</label>
                <select value={saudeForm.tipo} onChange={e => setSaudeForm(p => ({ ...p, tipo: e.target.value }))}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
                  {Object.entries(TIPO_SAUDE_ICON).map(([v, i]) => <option key={v} value={v}>{i} {v.charAt(0) + v.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              {[
                { label: 'Descrição *', key: 'descricao', placeholder: 'Ex: Febre Aftosa dose única' },
                { label: 'Produto / Vacina', key: 'produto', placeholder: 'Ex: Aftogen Booster' },
                { label: 'Dose', key: 'dose', placeholder: 'Ex: 2 ml IM' },
                { label: 'Veterinário responsável', key: 'veterinario', placeholder: 'Nome ou CRMV' },
                { label: 'Próxima dose', key: 'proximaDose', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder}
                    value={saudeForm[f.key as keyof typeof saudeForm]}
                    onChange={e => setSaudeForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.label.includes('*')}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowSaudeForm(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: '10px', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={savingSaude}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingSaude ? 0.6 : 1 }}>
                  {savingSaude ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
