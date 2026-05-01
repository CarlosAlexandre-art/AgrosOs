'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SucessoContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [counted, setCounted] = useState(false)

  useEffect(() => {
    if (sessionId && !counted) {
      setCounted(true)
    }
  }, [sessionId, counted])

  return (
    <div className="min-h-full flex items-center justify-center bg-[#020c08] p-6">
      <style>{`
        @keyframes pop { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 30px rgba(22,163,74,.3)} 50%{box-shadow:0 0 60px rgba(22,163,74,.6)} }
      `}</style>

      <div className="text-center max-w-md" style={{animation:'rise .5s ease both'}}>
        {/* Icon */}
        <div style={{
          width:96,height:96,
          background:'linear-gradient(135deg,rgba(22,163,74,.3),rgba(5,150,105,.15))',
          borderRadius:'50%',
          border:'2px solid rgba(74,222,128,.3)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:44,margin:'0 auto 28px',
          animation:'pop .5s ease both, pulse-glow 2s ease-in-out infinite .5s',
        }}>
          🎉
        </div>

        <h1 style={{fontSize:28,fontWeight:900,color:'#fff',marginBottom:8}}>
          Investimento realizado!
        </h1>
        <p style={{color:'rgba(255,255,255,.4)',fontSize:14,lineHeight:1.6,marginBottom:32}}>
          Seu pagamento foi confirmado. Os tokens foram adicionados ao seu portfólio e você receberá o retorno ao final do período.
        </p>

        <div style={{
          background:'rgba(22,163,74,.08)',border:'1px solid rgba(22,163,74,.2)',
          borderRadius:16,padding:'16px 20px',marginBottom:28,
          display:'flex',alignItems:'center',gap:12,
        }}>
          <span style={{fontSize:20}}>📋</span>
          <div style={{textAlign:'left'}}>
            <div style={{fontWeight:700,color:'#4ade80',fontSize:13}}>Confirmação enviada</div>
            <div style={{color:'rgba(255,255,255,.35)',fontSize:12,marginTop:2}}>Recibo disponível no Stripe · ID: {sessionId?.slice(-8)}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <Link href="/dashboard/token/investimentos"
            style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#16a34a,#059669)',color:'#fff',fontWeight:700,padding:'12px 24px',borderRadius:14,textDecoration:'none',fontSize:14,boxShadow:'0 0 24px rgba(22,163,74,.35)'}}>
            Ver meus investimentos →
          </Link>
          <Link href="/dashboard/token/mercado"
            style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.6)',fontWeight:600,padding:'12px 24px',borderRadius:14,textDecoration:'none',fontSize:14}}>
            Voltar ao mercado
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SucessoPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center bg-[#020c08]" />}>
      <SucessoContent />
    </Suspense>
  )
}
