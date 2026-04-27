'use client'

import { useEffect, useState } from 'react'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(b64: string) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type SubState = 'idle' | 'requesting' | 'success' | 'denied'

export default function TokenPage() {
  const [subState, setSubState] = useState<SubState>('idle')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && localStorage.getItem('agrotoken_notif_done')) {
      setSubState('success')
    }
  }, [])

  async function handleNotify() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setSubState('denied')
      return
    }
    setSubState('requesting')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setSubState('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC ? urlBase64ToUint8Array(VAPID_PUBLIC) : undefined,
      })

      const json = sub.toJSON()
      await fetch('/api/launch/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      localStorage.setItem('agrotoken_notif_done', '1')
      setSubState('success')
    } catch {
      setSubState('denied')
    }
  }

  return (
    <>
      {/* Keyframes via style tag */}
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-28px) translateX(14px)} 66%{transform:translateY(12px) translateX(-10px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(20px) translateX(-18px)} 66%{transform:translateY(-16px) translateX(22px)} }
        @keyframes float3 { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-22px) translateX(8px)} }
        @keyframes pulse-glow { 0%,100%{opacity:.18;transform:scale(1)} 50%{opacity:.35;transform:scale(1.12)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-rev { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes rise { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(90px) rotate(0deg)} to{transform:rotate(360deg) translateX(90px) rotate(-360deg)} }
        @keyframes orbit2 { from{transform:rotate(180deg) translateX(130px) rotate(-180deg)} to{transform:rotate(540deg) translateX(130px) rotate(-540deg)} }
        .rise-1{animation:rise .6s ease both}
        .rise-2{animation:rise .6s ease .1s both}
        .rise-3{animation:rise .6s ease .2s both}
        .rise-4{animation:rise .6s ease .3s both}
        .rise-5{animation:rise .6s ease .4s both}
        .shimmer-text{background:linear-gradient(90deg,#4ade80,#86efac,#16a34a,#4ade80);background-size:200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite}
      `}</style>

      <div className="relative min-h-full flex flex-col items-center justify-center overflow-hidden bg-[#020c08] px-4 py-12">

        {/* ── Background orbs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Large glow center */}
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:600, height:600,
            transform:'translate(-50%,-50%)',
            background:'radial-gradient(circle, rgba(22,163,74,.18) 0%, transparent 70%)',
            animation:'pulse-glow 5s ease-in-out infinite',
          }}/>
          {/* Top-right glow */}
          <div style={{
            position:'absolute', top:-80, right:-80,
            width:400, height:400,
            background:'radial-gradient(circle, rgba(22,163,74,.12) 0%, transparent 70%)',
            animation:'float1 9s ease-in-out infinite',
          }}/>
          {/* Bottom-left glow */}
          <div style={{
            position:'absolute', bottom:-60, left:-60,
            width:340, height:340,
            background:'radial-gradient(circle, rgba(5,150,105,.14) 0%, transparent 70%)',
            animation:'float2 11s ease-in-out infinite',
          }}/>

          {/* Orbiting dots */}
          {mounted && (
            <div style={{position:'absolute',top:'50%',left:'50%',width:0,height:0}}>
              <div style={{position:'absolute',width:6,height:6,borderRadius:'50%',background:'#4ade80',opacity:.6,animation:'orbit 7s linear infinite',boxShadow:'0 0 12px #4ade80'}}/>
              <div style={{position:'absolute',width:4,height:4,borderRadius:'50%',background:'#34d399',opacity:.4,animation:'orbit2 12s linear infinite',boxShadow:'0 0 8px #34d399'}}/>
            </div>
          )}

          {/* Spinning rings */}
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:380, height:380,
            transform:'translate(-50%,-50%)',
            border:'1px solid rgba(74,222,128,.07)',
            borderRadius:'50%',
            animation:'spin-slow 30s linear infinite',
          }}>
            <div style={{position:'absolute',top:-3,left:'50%',width:6,height:6,borderRadius:'50%',background:'rgba(74,222,128,.3)',transform:'translateX(-50%)'}}/>
          </div>
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:520, height:520,
            transform:'translate(-50%,-50%)',
            border:'1px solid rgba(74,222,128,.04)',
            borderRadius:'50%',
            animation:'spin-rev 45s linear infinite',
          }}>
            <div style={{position:'absolute',bottom:-2,left:'50%',width:4,height:4,borderRadius:'50%',background:'rgba(74,222,128,.2)',transform:'translateX(-50%)'}}/>
          </div>

          {/* Floating particles */}
          {mounted && [
            {top:'15%',left:'10%',s:3,a:.4,d:'float1 7s ease-in-out infinite'},
            {top:'25%',left:'85%',s:2,a:.3,d:'float2 9s ease-in-out infinite'},
            {top:'70%',left:'20%',s:2,a:.25,d:'float3 8s ease-in-out infinite'},
            {top:'80%',left:'75%',s:3,a:.35,d:'float1 10s ease-in-out infinite 2s'},
            {top:'45%',left:'92%',s:2,a:.2,d:'float2 6s ease-in-out infinite 1s'},
            {top:'55%',left:'5%',s:2,a:.2,d:'float3 11s ease-in-out infinite 3s'},
            {top:'10%',left:'50%',s:2,a:.15,d:'float1 13s ease-in-out infinite'},
            {top:'90%',left:'45%',s:2,a:.15,d:'float2 8s ease-in-out infinite 4s'},
          ].map((p,i) => (
            <div key={i} style={{
              position:'absolute', top:p.top, left:p.left,
              width:p.s, height:p.s,
              borderRadius:'50%',
              background:'#4ade80',
              opacity:p.a,
              animation:p.d,
              boxShadow:`0 0 ${p.s*3}px #4ade80`,
            }}/>
          ))}

          {/* Grid overlay */}
          <div style={{
            position:'absolute',inset:0,
            backgroundImage:'linear-gradient(rgba(74,222,128,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,.025) 1px, transparent 1px)',
            backgroundSize:'60px 60px',
          }}/>
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full">

          {/* Badge */}
          <div className="rise-1 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <span style={{width:6,height:6,borderRadius:'50%',background:'#4ade80',animation:'blink 1.5s ease-in-out infinite',display:'inline-block'}}/>
            Em desenvolvimento
          </div>

          {/* Main icon */}
          <div className="rise-2 relative mb-6">
            <div style={{
              width:96,height:96,
              background:'linear-gradient(135deg, rgba(22,163,74,.3), rgba(5,150,105,.15))',
              borderRadius:28,
              border:'1px solid rgba(74,222,128,.2)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:44,
              boxShadow:'0 0 40px rgba(22,163,74,.25), inset 0 1px 0 rgba(255,255,255,.05)',
            }}>
              🌾
            </div>
            <div style={{
              position:'absolute',inset:-1,
              borderRadius:28,
              border:'1px solid transparent',
              background:'linear-gradient(135deg,rgba(74,222,128,.3),transparent,rgba(52,211,153,.2)) border-box',
              WebkitMask:'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite:'destination-out',
              maskComposite:'exclude',
            }}/>
          </div>

          {/* Heading */}
          <h1 className="rise-3 text-5xl sm:text-6xl font-black text-white mb-3 tracking-tight leading-none">
            Agro<span className="shimmer-text">Token</span>
          </h1>
          <p className="rise-3 text-sm font-bold text-green-400/70 uppercase tracking-[.25em] mb-5">
            Tokenização de ativos agrícolas
          </p>

          <p className="rise-4 text-slate-400 text-base leading-relaxed mb-8 max-w-md">
            A plataforma que vai permitir produtores rurais captarem capital tokenizando sua safra — e investidores participarem da produção do campo com transparência total.
          </p>

          {/* Feature pills */}
          <div className="rise-4 flex flex-wrap gap-2 justify-center mb-10">
            {['Laudo automático','Marketplace','CVM 88','Blockchain Polygon','Score AgroRate','Investimento fracionado'].map(f => (
              <span key={f} style={{
                background:'rgba(74,222,128,.05)',
                border:'1px solid rgba(74,222,128,.12)',
                color:'rgba(74,222,128,.7)',
                fontSize:11,fontWeight:600,
                padding:'4px 12px',borderRadius:999,
              }}>{f}</span>
            ))}
          </div>

          {/* Notification CTA */}
          <div className="rise-5 w-full max-w-sm">
            {subState === 'success' ? (
              <div style={{
                background:'rgba(22,163,74,.12)',
                border:'1px solid rgba(22,163,74,.3)',
                borderRadius:20,
                padding:'16px 24px',
                display:'flex',alignItems:'center',gap:12,
              }}>
                <span style={{fontSize:24}}>🎉</span>
                <div className="text-left">
                  <div style={{fontWeight:700,color:'#4ade80',fontSize:14}}>Você vai saber primeiro!</div>
                  <div style={{color:'rgba(255,255,255,.4)',fontSize:12,marginTop:2}}>Notificação ativa. Avisaremos no lançamento.</div>
                </div>
              </div>
            ) : subState === 'denied' ? (
              <div style={{
                background:'rgba(239,68,68,.08)',
                border:'1px solid rgba(239,68,68,.2)',
                borderRadius:20,
                padding:'14px 20px',
                color:'rgba(248,113,113,.8)',
                fontSize:13,textAlign:'center',
              }}>
                Notificações bloqueadas. Habilite nas configurações do navegador.
              </div>
            ) : (
              <button
                onClick={handleNotify}
                disabled={subState === 'requesting'}
                style={{
                  width:'100%',
                  background:'linear-gradient(135deg, #16a34a, #059669)',
                  color:'#fff',
                  fontWeight:800,fontSize:15,
                  padding:'16px 32px',borderRadius:20,
                  border:'none',cursor:'pointer',
                  boxShadow:'0 0 40px rgba(22,163,74,.4), 0 4px 20px rgba(0,0,0,.3)',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                  transition:'transform .15s ease, box-shadow .15s ease',
                  position:'relative',overflow:'hidden',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 60px rgba(22,163,74,.5), 0 8px 30px rgba(0,0,0,.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 40px rgba(22,163,74,.4), 0 4px 20px rgba(0,0,0,.3)' }}
              >
                {subState === 'requesting' ? (
                  <>
                    <span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin-slow .7s linear infinite',display:'inline-block',flexShrink:0}}/>
                    Ativando notificação...
                  </>
                ) : (
                  <>
                    <span style={{fontSize:18}}>🔔</span>
                    Ativar notificação de lançamento
                  </>
                )}
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{width:'100%',maxWidth:400,height:1,background:'linear-gradient(90deg,transparent,rgba(74,222,128,.1),transparent)',margin:'40px 0'}}/>

          {/* Coming soon cards */}
          <div className="rise-5 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
            {[
              { icon:'👨‍🌾', title:'Para produtores', desc:'Tokenize safra, material ou maquinário. Capte de múltiplos investidores sem depender de um único banco.' },
              { icon:'📈', title:'Para investidores', desc:'Invista em ativos agrícolas reais com retorno e prazo definidos. Laudo de capacidade produtiva incluso.' },
              { icon:'🔒', title:'Regulado e seguro', desc:'Operação estruturada dentro da CVM Resolução 88 e blockchain Polygon com contratos ERC-1400.' },
            ].map(c => (
              <div key={c.title} style={{
                background:'rgba(255,255,255,.03)',
                border:'1px solid rgba(74,222,128,.08)',
                borderRadius:16,
                padding:'16px',
                backdropFilter:'blur(8px)',
              }}>
                <div style={{fontSize:24,marginBottom:8}}>{c.icon}</div>
                <div style={{fontWeight:700,color:'rgba(255,255,255,.8)',fontSize:13,marginBottom:4}}>{c.title}</div>
                <p style={{color:'rgba(255,255,255,.35)',fontSize:12,lineHeight:1.5}}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
