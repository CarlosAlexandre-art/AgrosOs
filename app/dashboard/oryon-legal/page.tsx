import Link from 'next/link'

export default function OryonLegalPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '640px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #15803d, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(21,128,61,0.25)' }}>⚖️</div>
          <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>ORYON Legal</h1>
          <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6 }}>
            Proteção Jurídica, Patrimonial e Empresarial para o Agro.<br />
            <strong style={{ color: '#374151' }}>Escolha uma arquitetura abaixo para testar:</strong>
          </p>
        </div>

        {/* Arquitetura 01 */}
        <Link href="/dashboard/oryon-legal/arquitetura-1" style={{ textDecoration: 'none', display: 'block', marginBottom: '16px' }}>
          <div style={{ background: 'white', border: '2px solid #fde68a', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Arquitetura 01</span>
                  <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px' }}>Acesso Direto</span>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, marginBottom: '14px' }}>Formulário simples → alertas contextuais → lead entregue imediatamente para a advogada. Menor atrito, maior volume.</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['✅ Alertas automáticos', '📋 Formulário rápido', '📬 Lead entregue em segundos'].map(t => (
                    <span key={t} style={{ background: '#f0fdf4', color: '#166534', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px' }}>{t}</span>
                  ))}
                </div>
              </div>
              <span style={{ fontSize: '20px', color: '#9ca3af', flexShrink: 0 }}>→</span>
            </div>
          </div>
        </Link>

        {/* Arquitetura 02 */}
        <Link href="/dashboard/oryon-legal/arquitetura-2" style={{ textDecoration: 'none', display: 'block', marginBottom: '32px' }}>
          <div style={{ background: 'white', border: '2px solid #bfdbfe', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>⭐</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Arquitetura 02</span>
                  <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px' }}>Diagnóstico Inteligente</span>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, marginBottom: '14px' }}>Quiz de 7 perguntas → IA Groq analisa → Score Jurídico → relatório completo entregue para a advogada. Lead pré-qualificado, maior ticket.</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['🤖 IA Groq real', '📊 Score Jurídico', '📋 Relatório completo', '👩‍⚖️ Lead qualificado'].map(t => (
                    <span key={t} style={{ background: '#eff6ff', color: '#1e40af', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px' }}>{t}</span>
                  ))}
                </div>
              </div>
              <span style={{ fontSize: '20px', color: '#9ca3af', flexShrink: 0 }}>→</span>
            </div>
          </div>
        </Link>

        {/* Rodapé */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#166534', fontWeight: 600, margin: 0 }}>
            Teste as duas, escolha uma e ela vira a versão oficial da plataforma.
          </p>
        </div>

      </div>
    </div>
  )
}
