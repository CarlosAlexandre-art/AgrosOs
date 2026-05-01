'use client'

import { useEffect, useState } from 'react'

export default function TokenHubPage() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <div style={{ background: '#7c3aed', color: 'white', padding: '8px 16px', borderRadius: 8, marginBottom: 24, display: 'inline-block', fontSize: 13, fontWeight: 700 }}>
        HUB v5 — sem erro de hidratação
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Diagnóstico de Roteamento</h1>
      <p style={{ marginBottom: 24, color: '#666', fontSize: 14 }}>
        Clica em cada botão. O erro #418 deve sumir. Me diz o que aparece em C e D.
      </p>

      <p style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>— Um nível —</p>

      <a href="/dashboard/operacoes"
        style={{ background: '#7c3aed', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 10, textDecoration: 'none', borderRadius: 8 }}>
        A) /dashboard/operacoes
      </a>

      <a href="/dashboard/financeiro"
        style={{ background: '#1d4ed8', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 24, textDecoration: 'none', borderRadius: 8 }}>
        B) /dashboard/financeiro
      </a>

      <p style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>— Dois níveis —</p>

      <a href="/dashboard/token/mercado"
        style={{ background: '#dc2626', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 10, textDecoration: 'none', borderRadius: 8 }}>
        C) /dashboard/token/mercado
      </a>

      <a href="/dashboard/token/novo"
        style={{ background: '#ea580c', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 10, textDecoration: 'none', borderRadius: 8 }}>
        D) /dashboard/token/novo
      </a>

      <a href="/dashboard/token/mercado" target="_blank" rel="noreferrer"
        style={{ background: '#059669', color: 'white', padding: '14px 24px', fontSize: 16, display: 'block', marginBottom: 24, textDecoration: 'none', borderRadius: 8 }}>
        E) mercado em NOVA ABA
      </a>

      {url && (
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151' }}>
          <strong>URL atual:</strong> {url}
        </div>
      )}
    </div>
  )
}
