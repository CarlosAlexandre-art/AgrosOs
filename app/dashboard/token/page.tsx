'use client'

export default function TokenHubPage() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <div style={{ background: '#7c3aed', color: 'white', padding: '8px 16px', borderRadius: 8, marginBottom: 24, display: 'inline-block', fontSize: 13, fontWeight: 700 }}>
        HUB v4 — se você vê isso, o deploy mais recente está no ar
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Diagnóstico de Roteamento</h1>
      <p style={{ marginBottom: 24, color: '#666', fontSize: 14 }}>
        Clica em cada botão e me diz: URL muda? Aparece algo? O que aparece?
      </p>

      {/* Rotas de 1 nível */}
      <p style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>— Um nível abaixo do dashboard —</p>

      <a href="/dashboard/operacoes"
        style={{ background: '#7c3aed', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 10, textDecoration: 'none', borderRadius: 8 }}>
        A) /dashboard/operacoes (1 nível — funciona?)
      </a>

      <a href="/dashboard/financeiro"
        style={{ background: '#1d4ed8', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 24, textDecoration: 'none', borderRadius: 8 }}>
        B) /dashboard/financeiro (1 nível — funciona?)
      </a>

      {/* Rotas de 2 níveis */}
      <p style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>— Dois níveis (token/subrota) —</p>

      <a href="/dashboard/token/mercado"
        style={{ background: '#dc2626', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 10, textDecoration: 'none', borderRadius: 8 }}>
        C) /dashboard/token/mercado (2 níveis)
      </a>

      <a href="/dashboard/token/novo"
        style={{ background: '#ea580c', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 10, textDecoration: 'none', borderRadius: 8 }}>
        D) /dashboard/token/novo (2 níveis)
      </a>

      {/* Abre em nova aba para ver console */}
      <a href="/dashboard/token/mercado" target="_blank"
        style={{ background: '#059669', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 24, textDecoration: 'none', borderRadius: 8 }}>
        E) /dashboard/token/mercado em NOVA ABA (ver URL e console)
      </a>

      {/* Verificar URL atual */}
      <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151' }}>
        <strong>URL atual:</strong>{' '}
        <span id="url-display">(carregando...)</span>
        <script dangerouslySetInnerHTML={{ __html: `
          document.getElementById('url-display').textContent = window.location.href;
        `}} />
      </div>
    </div>
  )
}
