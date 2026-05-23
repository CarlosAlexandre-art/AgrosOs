import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 192, height: 192 }

export async function GET() {
  return new ImageResponse(
    <div style={{
      width: 192, height: 192,
      background: '#020c05',
      borderRadius: 44,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Chip verde — representa o "OS" da fazenda */}
      <div style={{
        position: 'relative',
        width: 124, height: 124,
        background: 'linear-gradient(145deg, #14532d 0%, #16a34a 55%, #22c55e 100%)',
        borderRadius: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Folha */}
        <div style={{
          width: 42, height: 56,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: '50% 8% 50% 8%',
          transform: 'rotate(-12deg)',
        }} />
        {/* Nós de conexão nos cantos */}
        <div style={{ position: 'absolute', top: 8, left: 8, width: 8, height: 8, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, width: 8, height: 8, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 8, right: 8, width: 8, height: 8, background: 'rgba(255,255,255,0.45)', borderRadius: '50%' }} />
      </div>
      {/* Label OS */}
      <div style={{
        color: '#4ade80',
        fontSize: 20,
        fontWeight: 900,
        fontFamily: 'sans-serif',
        marginTop: 10,
        letterSpacing: 3,
      }}>OS</div>
    </div>,
    { width: 192, height: 192 }
  )
}
