import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 512, height: 512 }

export async function GET() {
  return new ImageResponse(
    <div style={{
      width: 512, height: 512,
      background: '#020c05',
      borderRadius: 116,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Chip verde — representa o "OS" da fazenda */}
      <div style={{
        position: 'relative',
        width: 330, height: 330,
        background: 'linear-gradient(145deg, #14532d 0%, #16a34a 55%, #22c55e 100%)',
        borderRadius: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Folha */}
        <div style={{
          width: 112, height: 150,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: '50% 8% 50% 8%',
          transform: 'rotate(-12deg)',
        }} />
        {/* Nós de conexão nos cantos */}
        <div style={{ position: 'absolute', top: 20, left: 20, width: 20, height: 20, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: 20, right: 20, width: 20, height: 20, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, width: 20, height: 20, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 20, right: 20, width: 20, height: 20, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
      </div>
      {/* Label OS */}
      <div style={{
        color: '#4ade80',
        fontSize: 52,
        fontWeight: 900,
        fontFamily: 'sans-serif',
        marginTop: 24,
        letterSpacing: 8,
      }}>OS</div>
    </div>,
    { width: 512, height: 512 }
  )
}
