'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface SaudeRecord {
  id: string; tipo: string; descricao: string; produto?: string
  dose?: string; veterinario?: string; dataRegistro: string; proximaDose?: string
}
interface MovimentoRecord {
  id: string; tipo: string; origem?: string; destino?: string
  peso?: number; data: string; gta?: string; observacao?: string
}
interface Animal {
  id: string; identificacao: string; especie: string; raca?: string; sexo: string
  dataNascimento?: string; pesoAtual?: number; pesoNascimento?: number
  brincoEletronico?: string; sisbovId?: string; rfid?: string
  origemFazenda?: string; gtaOrigem?: string
  lote?: { nome: string; objetivo: string; status: string } | null
  saude: SaudeRecord[]
  movimentos: MovimentoRecord[]
}

const TIPO_COR: Record<string, string> = {
  VACINA: '#16a34a', MEDICACAO: '#2563eb', EXAME: '#7c3aed',
  DIAGNOSTICO: '#0891b2', OBSERVACAO: '#78716c',
}
const TIPO_ICON: Record<string, string> = {
  VACINA: '💉', MEDICACAO: '💊', EXAME: '🔬', DIAGNOSTICO: '🩺', OBSERVACAO: '📝',
}
const MOV_ICON: Record<string, string> = {
  ENTRADA: '➡️', SAIDA: '⬅️', TRANSFERENCIA: '🔄', ABATE: '🔴', NASCIMENTO: '🌱',
}

export default function PassaportePublicoPage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<{ animal: Animal; idadeTexto: string; resumoSaude: { totalVacinas: number; totalMedicacoes: number; ultimaOcorrencia: string | null }; propriedade: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/passaporte/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setErro(d.error); else setData(d) })
      .catch(() => setErro('Erro ao carregar passaporte'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>🐄</div>
        <p style={{ color: '#16a34a', fontWeight: 600 }}>Carregando passaporte...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (erro || !data) return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: '#dc2626', fontWeight: 600 }}>{erro || 'Animal não encontrado'}</p>
      </div>
    </div>
  )

  const { animal, idadeTexto, resumoSaude: rs, propriedade } = data

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
        .fade-in { animation: fadeUp 0.5s ease both; }
        .fade-in-1 { animation-delay: 0.1s; }
        .fade-in-2 { animation-delay: 0.2s; }
        .fade-in-3 { animation-delay: 0.3s; }
        .fade-in-4 { animation-delay: 0.4s; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f0fdf4', paddingBottom: 80 }}>

        {/* Header */}
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
          padding: '28px 24px 32px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>🌿</span>
                <span style={{ color: '#d1fae5', fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>SmartAgroOS</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px' }}>
                <span style={{ color: '#a7f3d0', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Passaporte Digital</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
                {animal.sexo === 'MACHO' ? '🐂' : '🐄'}
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>{animal.identificacao}</h1>
                <p style={{ fontSize: 13, color: '#a7f3d0', marginTop: 2 }}>
                  {animal.raca || animal.especie} · {animal.sexo === 'MACHO' ? 'Macho' : 'Fêmea'} · {idadeTexto}
                </p>
                <p style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>📍 {propriedade}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

          {/* Código chips */}
          <div className="fade-in fade-in-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {animal.sisbovId && (
              <div style={{ background: '#dcfce7', border: '1px solid #16a34a', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 5 }}>
                🏷️ SISBOV: {animal.sisbovId}
              </div>
            )}
            {animal.brincoEletronico && (
              <div style={{ background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 5 }}>
                📡 Brinco: {animal.brincoEletronico}
              </div>
            )}
            {animal.rfid && (
              <div style={{ background: '#faf5ff', border: '1px solid #7c3aed', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 5 }}>
                📶 RFID: {animal.rfid}
              </div>
            )}
            {!animal.sisbovId && !animal.brincoEletronico && !animal.rfid && (
              <div style={{ background: '#f1f5f9', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#94a3b8' }}>
                Sem códigos eletrônicos registrados
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="fade-in fade-in-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { icon: '💉', valor: String(rs.totalVacinas), label: 'Vacinas' },
              { icon: '💊', valor: String(rs.totalMedicacoes), label: 'Medicações' },
              { icon: '⚖️', valor: animal.pesoAtual ? `${animal.pesoAtual} kg` : '—', label: 'Peso atual' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#065f46' }}>{s.valor}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Dados de identificação */}
          <div className="fade-in fade-in-2" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#064e3b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              🐄 Identificação
            </h2>
            <div style={{ display: 'grid', gap: 0 }}>
              {[
                ['Espécie', animal.especie],
                ['Raça', animal.raca || '—'],
                ['Sexo', animal.sexo === 'MACHO' ? 'Macho' : 'Fêmea'],
                ['Nascimento', animal.dataNascimento ? new Date(animal.dataNascimento).toLocaleDateString('pt-BR') : '—'],
                ['Idade', idadeTexto],
                ['Peso de nascimento', animal.pesoNascimento ? `${animal.pesoNascimento} kg` : '—'],
                ['Fazenda de origem', animal.origemFazenda || '—'],
                ['GTA de entrada', animal.gtaOrigem || '—'],
                ['Propriedade atual', propriedade],
                ['Lote atual', animal.lote?.nome || '—'],
                ['Objetivo do lote', animal.lote?.objetivo || '—'],
              ].map(([label, valor]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textAlign: 'right', maxWidth: '60%' }}>{valor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico sanitário */}
          <div className="fade-in fade-in-3" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#064e3b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              💉 Histórico Sanitário
              <span style={{ marginLeft: 'auto', fontSize: 12, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                {animal.saude.length} registro{animal.saude.length !== 1 ? 's' : ''}
              </span>
            </h2>
            {animal.saude.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Nenhum registro sanitário</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {animal.saude.map(s => (
                  <div key={s.id} style={{ borderLeft: `3px solid ${TIPO_COR[s.tipo] ?? '#94a3b8'}`, paddingLeft: 12, paddingTop: 2, paddingBottom: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{TIPO_ICON[s.tipo]}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{s.descricao}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>
                        {new Date(s.dataRegistro).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {s.produto && (
                      <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        {s.produto}{s.dose ? ` · ${s.dose}` : ''}
                      </p>
                    )}
                    {s.veterinario && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Resp.: {s.veterinario}</p>}
                    {s.proximaDose && (
                      <p style={{ fontSize: 12, color: '#d97706', marginTop: 2, fontWeight: 600 }}>
                        🗓 Próxima dose: {new Date(s.proximaDose).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Movimentações */}
          <div className="fade-in fade-in-4" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#064e3b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              🗺️ Movimentações
              <span style={{ marginLeft: 'auto', fontSize: 12, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                {animal.movimentos.length}
              </span>
            </h2>
            {animal.movimentos.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Nenhuma movimentação</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {animal.movimentos.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{MOV_ICON[m.tipo]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.tipo}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(m.data).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {m.origem && <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>De: {m.origem}</p>}
                      {m.destino && <p style={{ fontSize: 12, color: '#64748b' }}>Para: {m.destino}</p>}
                      {m.peso && <p style={{ fontSize: 12, color: '#d97706' }}>Peso: {m.peso} kg</p>}
                      {m.gta && <p style={{ fontSize: 12, color: '#2563eb' }}>GTA: {m.gta}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
              🌿 Verificado por <strong style={{ color: '#059669' }}>SmartAgroOS</strong> · agroos.site
            </div>
            <div style={{ fontSize: 11, color: '#cbd5e1' }}>
              ID: {animal.id} · Gerado em {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

        </div>

        {/* Botão flutuante de exportar PDF */}
        <div className="no-print" style={{ position: 'fixed', bottom: 24, right: 20, left: 20, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              background: 'linear-gradient(135deg, #065f46, #059669)',
              color: '#fff', border: 'none', borderRadius: 16,
              padding: '14px 32px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(5,150,105,0.4)',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(5,150,105,0.5)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(5,150,105,0.4)' }}
          >
            📄 Exportar Carteira em PDF
          </button>
        </div>

      </div>
    </>
  )
}
