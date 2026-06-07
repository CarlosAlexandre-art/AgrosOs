import Link from 'next/link'

export default function ObrigadoPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0fdf4 0%, #f8f9fa 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* Ícone de sucesso */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #15803d, #16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(21,128,61,0.25)',
        }}>✅</div>

        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>
          Solicitação enviada!
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6, marginBottom: '32px' }}>
          Nossa especialista jurídica recebeu seus dados e entrará em contato em até <strong style={{ color: '#15803d' }}>24 horas</strong> com um diagnóstico inicial gratuito.
        </p>

        {/* O que acontece agora */}
        <div style={{
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px',
          padding: '24px', marginBottom: '28px', textAlign: 'left',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            O que acontece agora
          </div>
          {[
            { icon: '📬', texto: 'Nossa especialista recebeu um email com seus dados completos' },
            { icon: '📞', texto: 'Ela entrará em contato via WhatsApp em até 24h' },
            { icon: '📋', texto: 'Você receberá um diagnóstico jurídico inicial gratuito' },
            { icon: '🤝', texto: 'Se quiser avançar, ela apresentará um plano personalizado' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: i < 3 ? '12px' : 0 }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>{item.texto}</span>
            </div>
          ))}
        </div>

        {/* Link para o site da advogada */}
        <a
          href="https://talitamartinsadv.com.br"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white', fontWeight: 800, fontSize: '15px',
            padding: '14px 24px', borderRadius: '14px', textDecoration: 'none',
            marginBottom: '12px', boxShadow: '0 4px 12px rgba(21,128,61,0.25)',
          }}
        >
          ⚖️ Conhecer a especialista
        </a>

        <Link
          href="/legal/arq1"
          style={{ display: 'block', fontSize: '14px', color: '#9ca3af', textDecoration: 'none', marginTop: '8px' }}
        >
          ← Voltar ao início
        </Link>

        <p style={{ fontSize: '12px', color: '#d1d5db', marginTop: '32px' }}>
          ORYON Legal · Ecossistema OryonAG
        </p>
      </div>
    </div>
  )
}
