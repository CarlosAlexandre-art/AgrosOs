'use client'

export default function TokenHubPage() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Diagnóstico de Navegação</h1>

      <p style={{ marginBottom: 16, color: '#666' }}>Clica em cada botão e me diz o que acontece (URL muda? Página muda?):</p>

      <a href="/dashboard/operacoes"
        style={{ background: '#7c3aed', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 12, textDecoration: 'none', borderRadius: 8 }}>
        A) Ir para Operacoes (/dashboard/operacoes)
      </a>

      <a href="/dashboard/token/mercado"
        style={{ background: '#dc2626', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 12, textDecoration: 'none', borderRadius: 8 }}>
        B) Ir para Mercado (/dashboard/token/mercado)
      </a>

      <a href="/dashboard/token/novo"
        style={{ background: '#ea580c', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 12, textDecoration: 'none', borderRadius: 8 }}>
        C) Ir para Novo Token (/dashboard/token/novo)
      </a>

      <button
        onClick={() => { window.location.replace('/dashboard/token/mercado') }}
        style={{ background: '#0891b2', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', width: '100%', marginBottom: 12, border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
        D) window.location.replace para Mercado
      </button>

      <button
        onClick={() => { window.open('/dashboard/token/mercado', '_blank') }}
        style={{ background: '#059669', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', width: '100%', marginBottom: 12, border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
        E) Abrir Mercado em nova aba
      </button>
    </div>
  )
}
