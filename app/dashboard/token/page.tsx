'use client'

export default function TokenHubPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>AgroToken — Diagnóstico</h1>

      <button
        style={{ background: 'red', color: 'white', padding: '16px 32px', fontSize: 18, display: 'block', width: '100%', marginBottom: 16, cursor: 'pointer', border: 'none', borderRadius: 8 }}
        onClick={() => { alert('JS FUNCIONA! Agora navegando...'); window.location.href = '/dashboard/token/mercado'; }}
      >
        TESTE 1: alert + window.location (JS puro)
      </button>

      <a
        href="/dashboard/token/mercado"
        style={{ background: 'blue', color: 'white', padding: '16px 32px', fontSize: 18, display: 'block', marginBottom: 16, textDecoration: 'none', borderRadius: 8 }}
      >
        TESTE 2: anchor nativo para Mercado
      </a>

      <a
        href="/dashboard"
        style={{ background: 'green', color: 'white', padding: '16px 32px', fontSize: 18, display: 'block', marginBottom: 16, textDecoration: 'none', borderRadius: 8 }}
      >
        TESTE 3: anchor nativo para Dashboard principal
      </a>
    </div>
  )
}
