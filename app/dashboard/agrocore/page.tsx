import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AgroCoreBackground from '@/components/AgroCoreBackground'

const SERVICOS = [
  { icon: '✈️', nome: 'Pulverização aérea', desc: 'Drones e aeronaves de precisão', color: 'from-sky-500/10 to-sky-500/5', border: 'hover:border-sky-500/30', glow: 'rgba(14,165,233,.3)' },
  { icon: '🚜', nome: 'Mecanização', desc: 'Plantio, colheita e preparo de solo', color: 'from-amber-500/10 to-amber-500/5', border: 'hover:border-amber-500/30', glow: 'rgba(245,158,11,.3)' },
  { icon: '🚛', nome: 'Transporte', desc: 'Logística de grãos e insumos', color: 'from-orange-500/10 to-orange-500/5', border: 'hover:border-orange-500/30', glow: 'rgba(249,115,22,.3)' },
  { icon: '🔬', nome: 'Análise de solo', desc: 'Laudos técnicos e recomendações', color: 'from-purple-500/10 to-purple-500/5', border: 'hover:border-purple-500/30', glow: 'rgba(168,85,247,.3)' },
  { icon: '💧', nome: 'Irrigação', desc: 'Instalação e manutenção de sistemas', color: 'from-blue-500/10 to-blue-500/5', border: 'hover:border-blue-500/30', glow: 'rgba(59,130,246,.3)' },
  { icon: '🌱', nome: 'Consultoria', desc: 'Acompanhamento agronômico completo', color: 'from-emerald-500/10 to-emerald-500/5', border: 'hover:border-emerald-500/30', glow: 'rgba(16,185,129,.3)' },
]

const STEPS = [
  { num: '01', title: 'Crie uma atividade', desc: 'Acesse Operacional → Nova atividade' },
  { num: '02', title: 'Selecione Via AgroCore', desc: 'No campo "Executor" da atividade' },
  { num: '03', title: 'Acesse o AgroCore', desc: 'Finalize a contratação na plataforma' },
  { num: '04', title: 'Custo integrado', desc: 'Lançado automaticamente no Financeiro' },
]

export default async function AgroCoreInternalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        include: {
          activities: { where: { executor: 'AGROLINK' }, orderBy: { createdAt: 'desc' }, take: 5 },
        },
      },
    },
  })

  const plan = (dbUser as any)?.plan ?? 'starter'
  const isPago = ['pro', 'enterprise', 'admin'].includes(plan)

  if (!isPago) {
    return (
      <div className="relative min-h-full flex items-center justify-center overflow-hidden bg-[#020c08] p-6">
        <style>{`
          @keyframes pulse-orb { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.3;transform:scale(1.1)} }
          @keyframes rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{position:'absolute',top:'50%',left:'50%',width:500,height:500,transform:'translate(-50%,-50%)',background:'radial-gradient(circle,rgba(22,163,74,.15) 0%,transparent 70%)',animation:'pulse-orb 5s ease-in-out infinite'}}/>
        </div>
        <div className="relative z-10 text-center max-w-md" style={{animation:'rise .6s ease both'}}>
          <div style={{width:80,height:80,background:'linear-gradient(135deg,rgba(22,163,74,.2),rgba(5,150,105,.1))',borderRadius:24,border:'1px solid rgba(74,222,128,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,margin:'0 auto 24px',boxShadow:'0 0 40px rgba(22,163,74,.2)'}}>
            🔗
          </div>
          <h1 className="text-2xl font-black text-white mb-2">AgroCore — Plano Pro</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Contrate serviços externos integrados à sua operação. Disponível no plano Pro ou Enterprise.
          </p>
          <Link href="/dashboard/planos"
            style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#16a34a,#059669)',color:'#fff',fontWeight:700,padding:'12px 28px',borderRadius:14,textDecoration:'none',boxShadow:'0 0 30px rgba(22,163,74,.4)'}}>
            Ver planos →
          </Link>
        </div>
      </div>
    )
  }

  const property = dbUser?.properties[0]
  const agrocoreActivities = property?.activities || []

  return (
    <>
      <style>{`
        @keyframes float-orb { 0%,100%{transform:translate(0,0)} 33%{transform:translate(20px,-30px)} 66%{transform:translate(-15px,15px)} }
        @keyframes pulse-glow { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.3;transform:scale(1.08)} }
        @keyframes spin-ring { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        .service-card:hover { transform: translateY(-4px); }
        .service-card { transition: transform .2s ease, box-shadow .2s ease; }
        .agrocore-shimmer { background: linear-gradient(90deg,#679d3f,#86efac,#22c55e,#679d3f); background-size:200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
      `}</style>

      <div className="relative min-h-full bg-[#020c08] overflow-hidden">

        {/* Animated network background */}
        <div className="absolute inset-0 pointer-events-none">
          <AgroCoreBackground />
          {/* Orbs */}
          <div style={{position:'absolute',top:-100,right:-100,width:500,height:500,background:'radial-gradient(circle,rgba(103,157,63,.12) 0%,transparent 70%)',animation:'float-orb 12s ease-in-out infinite'}}/>
          <div style={{position:'absolute',bottom:-80,left:-80,width:400,height:400,background:'radial-gradient(circle,rgba(22,163,74,.1) 0%,transparent 70%)',animation:'float-orb 15s ease-in-out infinite 3s'}}/>
          {/* Grid */}
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(74,222,128,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,.02) 1px,transparent 1px)',backgroundSize:'50px 50px'}}/>
        </div>

        <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div style={{animation:'rise .5s ease both'}} className="flex items-center justify-between pt-2">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-widest">
                <span style={{width:6,height:6,borderRadius:'50%',background:'#4ade80',animation:'blink 1.4s ease-in-out infinite',display:'inline-block'}}/>
                Integrado ao SmartAgroOS
              </div>
              <h1 className="text-3xl font-black text-white">
                Agro<span className="agrocore-shimmer">Core</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1">Marketplace de serviços agrícolas conectado à sua operação</p>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_AGROCORE_URL || 'https://agrocore.live'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:'flex',alignItems:'center',gap:8,
                background:'linear-gradient(135deg,#16a34a,#059669)',
                color:'#fff',fontWeight:700,fontSize:14,
                padding:'12px 20px',borderRadius:14,textDecoration:'none',
                boxShadow:'0 0 30px rgba(22,163,74,.35)',
                transition:'box-shadow .2s ease',
              }}
            >
              Acessar AgroCore
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>

          {/* Hero banner */}
          <div style={{animation:'rise .5s ease .08s both',position:'relative',borderRadius:24,overflow:'hidden',border:'1px solid rgba(74,222,128,.12)',boxShadow:'0 0 60px rgba(22,163,74,.1)'}}>
            <div style={{background:'linear-gradient(135deg,rgba(16,78,39,.8) 0%,rgba(15,23,42,.9) 60%,rgba(15,23,42,.95) 100%)',padding:'36px 40px'}}>
              <div style={{position:'absolute',top:0,right:0,width:300,height:'100%',background:'radial-gradient(ellipse at right center,rgba(103,157,63,.25),transparent 70%)'}}/>
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-slate-300 text-base leading-relaxed mb-6">
                    Solicite um serviço AgroCore e crie automaticamente a atividade na sua fazenda — com custo integrado ao financeiro e histórico completo.
                  </p>
                  <Link href="/dashboard/operacoes/nova"
                    style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(22,163,74,.15)',border:'1px solid rgba(22,163,74,.3)',color:'#4ade80',fontWeight:700,fontSize:13,padding:'10px 20px',borderRadius:12,textDecoration:'none'}}>
                    Criar atividade via AgroCore →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['Custo por atividade','Histórico completo','Integração automática','Financeiro unificado'].map(f => (
                    <div key={f} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
                      <span style={{color:'#4ade80',fontSize:14}}>✓</span>
                      <span style={{color:'rgba(255,255,255,.6)',fontSize:12,fontWeight:500}}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Services grid */}
          <div style={{animation:'rise .5s ease .16s both'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-base">Serviços disponíveis</h2>
              <span style={{fontSize:12,color:'rgba(255,255,255,.3)',fontWeight:500}}>{SERVICOS.length} categorias</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICOS.map(s => (
                <a
                  key={s.nome}
                  href={process.env.NEXT_PUBLIC_AGROCORE_URL || 'https://agrocore.live'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-card"
                  style={{
                    display:'block',textDecoration:'none',
                    background:'rgba(255,255,255,.03)',
                    border:'1px solid rgba(255,255,255,.07)',
                    borderRadius:16,padding:'20px',
                  }}
                >
                  <div style={{fontSize:28,marginBottom:10}}>{s.icon}</div>
                  <div style={{fontWeight:700,color:'rgba(255,255,255,.85)',fontSize:13,marginBottom:4}}>{s.nome}</div>
                  <div style={{color:'rgba(255,255,255,.35)',fontSize:12}}>{s.desc}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6" style={{animation:'rise .5s ease .24s both'}}>
            {/* How it works */}
            <div className="lg:col-span-2" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:24}}>
              <h2 style={{fontWeight:700,color:'rgba(255,255,255,.8)',fontSize:14,marginBottom:20}}>Como usar o AgroCore pelo SmartAgroOS</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {STEPS.map(s => (
                  <div key={s.num} style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#16a34a,#059669)',color:'#fff',fontSize:11,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 14px rgba(22,163,74,.4)'}}>
                      {s.num}
                    </div>
                    <div>
                      <div style={{fontWeight:600,color:'rgba(255,255,255,.75)',fontSize:13}}>{s.title}</div>
                      <div style={{color:'rgba(255,255,255,.3)',fontSize:12,marginTop:2}}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity history */}
            <div style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                <div style={{fontWeight:700,color:'rgba(255,255,255,.7)',fontSize:13}}>Serviços solicitados</div>
              </div>
              {agrocoreActivities.length === 0 ? (
                <div style={{padding:32,textAlign:'center'}}>
                  <div style={{fontSize:28,marginBottom:8}}>🔗</div>
                  <p style={{color:'rgba(255,255,255,.25)',fontSize:12}}>Nenhum serviço solicitado ainda.</p>
                  <Link href="/dashboard/operacoes/nova"
                    style={{display:'inline-block',marginTop:12,fontSize:12,color:'#4ade80',textDecoration:'none',fontWeight:600}}>
                    Solicitar serviço →
                  </Link>
                </div>
              ) : (
                <div>
                  {agrocoreActivities.map((a: any) => (
                    <Link key={a.id} href={`/dashboard/operacoes/${a.id}`}
                      style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,.04)',textDecoration:'none'}}>
                      <div style={{width:32,height:32,background:'rgba(22,163,74,.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🔗</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:'rgba(255,255,255,.7)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.type}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,.25)',marginTop:1}}>{new Date(a.startDate).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
