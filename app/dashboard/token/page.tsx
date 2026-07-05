// AgroToken em espera — página "disponível em breve" no lugar do hub.
// Os fluxos de emissão/compra ficam pausados; subpáginas redirecionam para cá.

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

.at-soon { font-family: 'Outfit', sans-serif; }

@keyframes at-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes at-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
  50%      { box-shadow: 0 0 0 6px rgba(22,163,74,0); }
}
@keyframes at-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes at-float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}

.at-soon .at-title em {
  font-style: normal;
  background: linear-gradient(90deg, #16a34a 0%, #4ade80 50%, #16a34a 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: at-shimmer 4s linear infinite;
}
.at-soon .at-dot { animation: at-pulse 2.5s ease infinite; }
.at-soon .at-coin { animation: at-float 5s ease-in-out infinite; }
.at-soon .at-e1 { animation: at-fadeUp .5s ease both; }
.at-soon .at-e2 { animation: at-fadeUp .5s ease .08s both; }
.at-soon .at-e3 { animation: at-fadeUp .5s ease .16s both; }
.at-soon .at-e4 { animation: at-fadeUp .55s ease .26s both; }
.at-soon .at-e5 { animation: at-fadeUp .55s ease .36s both; }
`

const FEATURES = [
  {
    title: 'Tokenização de recebíveis',
    desc: 'Transforme sua produção futura em ativos digitais negociáveis',
  },
  {
    title: 'Registro imutável',
    desc: 'Cada operação gravada em blockchain na rede Polygon',
  },
  {
    title: 'Liquidez para o produtor',
    desc: 'Antecipe capital conectando sua safra a investidores',
  },
]

export default function AgroTokenEmBrevePage() {
  return (
    <div className="at-soon" style={{
      background: 'linear-gradient(160deg, #0d2218 0%, #142e1e 60%, #0d2218 100%)',
      minHeight: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Grade hexagonal de fundo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16.2V49L28 65.2L0 49V16.2Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3Cpath d='M28 33.8L56 50V82.8L28 99L0 82.8V50Z' fill='none' stroke='rgba(22,163,74,0.04)' stroke-width='0.6'/%3E%3C/svg%3E")`,
        backgroundSize: '56px 100px',
        opacity: 0.8,
      }} />

      {/* Glow central */}
      <div style={{
        position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
        width: 560, height: 320, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(22,163,74,0.14) 0%, transparent 70%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px, 6vw, 64px) clamp(16px, 4vw, 28px)',
        maxWidth: 760, margin: '0 auto', textAlign: 'center',
      }}>

        {/* Moeda flutuante */}
        <div className="at-coin at-e1" style={{
          width: 88, height: 88, borderRadius: 24, marginBottom: 32,
          background: 'linear-gradient(145deg, rgba(22,163,74,0.22) 0%, rgba(22,163,74,0.06) 100%)',
          border: '1px solid rgba(74,222,128,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(22,163,74,0.25)',
        }}>
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </div>

        {/* Eyebrow */}
        <div className="at-e2" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 28, height: 1, background: '#16a34a' }} />
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#16a34a',
          }}>AgroToken · Polygon Mainnet</span>
          <div style={{ width: 28, height: 1, background: '#16a34a' }} />
        </div>

        {/* Título */}
        <h1 className="at-title at-e3" style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(36px, 6vw, 58px)',
          fontWeight: 800,
          color: '#e8faf0',
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          margin: '0 0 14px',
        }}>
          Disponível<br /><em>em breve</em>
        </h1>

        <p className="at-e3" style={{
          fontSize: 15, color: '#7fb392', maxWidth: 480, margin: '0 auto 40px',
          fontWeight: 400, lineHeight: 1.6,
        }}>
          Estamos finalizando a tokenização de ativos agrícolas com liquidez,
          transparência e registro imutável em blockchain. Vale a pena esperar.
        </p>

        {/* Status */}
        <div className="at-e4" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '10px 22px', borderRadius: 999, marginBottom: 48,
          background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
        }}>
          <span className="at-dot" style={{
            width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block',
          }} />
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80',
          }}>Em desenvolvimento</span>
        </div>

        {/* Features */}
        <div className="at-e5" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14, width: '100%', maxWidth: 680,
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              padding: '22px 20px', borderRadius: 16, textAlign: 'left',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(22,163,74,0.14)',
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700,
                color: '#dcfce7', marginBottom: 6,
              }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#5a906c', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
