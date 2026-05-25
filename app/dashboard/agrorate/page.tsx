'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

type ScoreData = {
  score: number; category: string
  productionScore: number; efficiencyScore: number
  behaviorScore: number; operationalScore: number
  totalRevenue: number; totalCosts: number
  marginRate: number; activityCount: number
  dataCompleteness: number; lastCalculated: string
}

const CAT: Record<string, { label: string; color: string; hex: string; glow: string; desc: string }> = {
  ELITE:    { label: 'Elite',    hex: '#f59e0b', color: 'text-amber-400',   glow: 'rgba(245,158,11,.5)',  desc: 'Você está no topo — acesso às melhores condições do mercado' },
  HIGH:     { label: 'Alto',     hex: '#10b981', color: 'text-emerald-400', glow: 'rgba(16,185,129,.5)', desc: 'Excelente perfil — bancos competem por você' },
  GOOD:     { label: 'Bom',      hex: '#22c55e', color: 'text-green-400',   glow: 'rgba(34,197,94,.5)',  desc: 'Bom histórico — continue assim!' },
  REGULAR:  { label: 'Regular',  hex: '#3b82f6', color: 'text-blue-400',    glow: 'rgba(59,130,246,.5)', desc: 'Perfil moderado — há espaço para melhorar' },
  LOW:      { label: 'Baixo',    hex: '#f97316', color: 'text-orange-400',  glow: 'rgba(249,115,22,.5)', desc: 'Pontos de melhoria identificados' },
  CRITICAL: { label: 'Crítico',  hex: '#ef4444', color: 'text-red-400',     glow: 'rgba(239,68,68,.5)',  desc: 'Revise seus processos urgentemente' },
}

type Tab = 'score' | 'analytics' | 'credit'

// Animated particle background
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let id: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.5 + .5,
    }))
    function frame() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 120) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(34,197,94,${.15*(1-d/120)})`; ctx.lineWidth=.5; ctx.stroke() }
      }
      pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle='rgba(74,222,128,.45)'; ctx.shadowColor='#4ade80'; ctx.shadowBlur=6; ctx.fill(); ctx.shadowBlur=0 })
      id = requestAnimationFrame(frame)
    }
    frame()
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-60" />
}

// Score gauge SVG
function ScoreGauge({ score, hex, glow }: { score: number; hex: string; glow: string }) {
  const pct = score / 1000
  const r = 80, cx = 100, cy = 100
  const totalAngle = Math.PI * 1.5
  const startAngle = Math.PI * 0.75
  const endAngle = startAngle + totalAngle * pct
  const px = (a: number) => cx + r * Math.cos(a)
  const py = (a: number) => cy + r * Math.sin(a)
  const largeArc = totalAngle * pct > Math.PI ? 1 : 0
  const trackEnd = startAngle + totalAngle
  return (
    <svg viewBox="0 0 200 160" className="w-52 h-44">
      {/* Track */}
      <path
        d={`M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 1 1 ${px(trackEnd - 0.001)} ${py(trackEnd - 0.001)}`}
        fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="14" strokeLinecap="round"
      />
      {/* Arc */}
      {score > 0 && (
        <path
          d={`M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${px(endAngle)} ${py(endAngle)}`}
          fill="none" stroke={hex} strokeWidth="14" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
        />
      )}
      <text x={cx} y={cy + 10} textAnchor="middle" fill={hex} fontSize="36" fontWeight="900">{score}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="rgba(255,255,255,.25)" fontSize="10" fontWeight="600">de 1000 pontos</text>
    </svg>
  )
}

function MiniBar({ label, score, hex, weight }: { label: string; score: number; hex: string; weight: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5 text-xs">
        <span className="text-slate-400 font-medium">{label} <span className="text-slate-600">·{weight}%</span></span>
        <span className="font-bold" style={{ color: hex }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: hex, boxShadow: `0 0 8px ${hex}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 1000) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: .3 }}
        />
      </div>
    </div>
  )
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function AgroRateDashboard() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('score')
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return }
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      if (res.ok) setData(await res.json())
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!data) return
    setDisplayed(0)
    const steps = 60, target = data.score
    let cur = 0
    const id = setInterval(() => {
      cur += target / steps
      if (cur >= target) { setDisplayed(target); clearInterval(id) }
      else setDisplayed(Math.floor(cur))
    }, 1800 / steps)
    return () => clearInterval(id)
  }, [data])

  const cat = data ? (CAT[data.category] ?? CAT.REGULAR) : CAT.REGULAR
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'score', label: 'Score', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '🔍' },
    { id: 'credit', label: 'Crédito', icon: '💳' },
  ]

  return (
    <div className="relative min-h-full bg-[#020c08] overflow-hidden">
      <style>{`
        @keyframes pulse-orb{0%,100%{opacity:.12;transform:scale(1)}50%{opacity:.25;transform:scale(1.1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes shimmer-g{0%{background-position:200% center}100%{background-position:-200% center}}
        .rate-shimmer{background:linear-gradient(90deg,#22c55e,#86efac,#10b981,#22c55e);background-size:200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-g 3s linear infinite}
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <ParticleField />
        <div style={{position:'absolute',top:'30%',right:'-5%',width:400,height:400,background:'radial-gradient(circle,rgba(34,197,94,.1) 0%,transparent 70%)',animation:'pulse-orb 7s ease-in-out infinite'}}/>
        <div style={{position:'absolute',bottom:'-5%',left:'5%',width:350,height:350,background:'radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 70%)',animation:'pulse-orb 9s ease-in-out infinite 2s'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(34,197,94,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.025) 1px,transparent 1px)',backgroundSize:'48px 48px'}}/>
      </div>

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-black text-white">
              Agro<span className="rate-shimmer">Rate</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Score de crédito baseado em dados reais da sua fazenda</p>
          </div>
          <a href="https://agrorate.app" target="_blank" rel="noopener noreferrer"
            style={{display:'flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#065f46,#059669)',color:'#fff',fontWeight:700,fontSize:13,padding:'10px 18px',borderRadius:12,textDecoration:'none',boxShadow:'0 0 24px rgba(6,95,70,.5)'}}>
            Abrir AgroRate
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:'linear'}}
              style={{width:48,height:48,border:'3px solid rgba(34,197,94,.15)',borderTopColor:'#22c55e',borderRadius:'50%'}}/>
            <p className="text-slate-500 text-sm">Calculando seu AgroRate...</p>
          </div>
        ) : !data ? (
          /* No data state */
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:24,padding:40,textAlign:'center',maxWidth:480,margin:'0 auto'}}>
            <div style={{fontSize:48,marginBottom:16}}>🌾</div>
            <h2 style={{fontWeight:800,color:'rgba(255,255,255,.85)',fontSize:18,marginBottom:8}}>Configure sua fazenda para gerar o score</h2>
            <p style={{color:'rgba(255,255,255,.35)',fontSize:13,lineHeight:1.6,marginBottom:24}}>
              O AgroRate é calculado com os dados da sua propriedade no SmartAgroOS. Registre receitas, custos e atividades para começar.
            </p>
            <a href="https://agroos.site" target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#16a34a,#059669)',color:'#fff',fontWeight:700,padding:'12px 24px',borderRadius:12,textDecoration:'none',boxShadow:'0 0 24px rgba(22,163,74,.35)'}}>
              Abrir SmartAgroOS →
            </a>
          </motion.div>
        ) : (
          <>
            {/* Main score card */}
            <motion.div initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{delay:.1}}
              style={{
                background:'linear-gradient(135deg,rgba(255,255,255,.03) 0%,rgba(255,255,255,.01) 100%)',
                border:'1px solid rgba(255,255,255,.07)',
                borderRadius:24,padding:32,
                boxShadow:`0 0 60px ${cat.glow}20`,
                position:'relative',overflow:'hidden',
              }}>
              <div style={{position:'absolute',top:0,right:0,width:280,height:280,background:`radial-gradient(circle,${cat.glow.replace('.5)','.12)')} 0%,transparent 70%)`}}/>
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                {/* Gauge */}
                <div className="flex flex-col items-center">
                  <ScoreGauge score={displayed} hex={cat.hex} glow={cat.glow} />
                  <div style={{display:'inline-flex',alignItems:'center',gap:8,background:`${cat.hex}15`,border:`1px solid ${cat.hex}30`,borderRadius:999,padding:'6px 16px',marginTop:8}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:cat.hex,display:'inline-block'}}/>
                    <span style={{fontWeight:700,color:cat.hex,fontSize:13}}>{cat.label}</span>
                  </div>
                  <p style={{color:'rgba(255,255,255,.3)',fontSize:12,textAlign:'center',marginTop:8,maxWidth:200}}>{cat.desc}</p>
                </div>

                {/* Composition */}
                <div className="space-y-4">
                  <div style={{fontWeight:700,color:'rgba(255,255,255,.5)',fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em'}}>Composição do score</div>
                  <MiniBar label="Produção"      score={data.productionScore}  hex="#22c55e" weight={30} />
                  <MiniBar label="Eficiência"    score={data.efficiencyScore}  hex="#06b6d4" weight={25} />
                  <MiniBar label="Comportamento" score={data.behaviorScore}    hex="#8b5cf6" weight={25} />
                  <MiniBar label="Operacional"   score={data.operationalScore} hex="#f59e0b" weight={20} />
                  <div style={{paddingTop:12,borderTop:'1px solid rgba(255,255,255,.06)',fontSize:11,color:'rgba(255,255,255,.2)'}}>
                    Atualizado em {new Date(data.lastCalculated).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Metrics row */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.2}}
              className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Receita total', value: fmt(data.totalRevenue), hex: '#22c55e', icon: '💵' },
                { label: 'Margem', value: `${Math.round(data.marginRate * 100)}%`, hex: '#06b6d4', icon: '📈' },
                { label: 'Atividades', value: `${data.activityCount}`, hex: '#8b5cf6', icon: '✅' },
                { label: 'Completude', value: `${data.dataCompleteness}%`, hex: '#f59e0b', icon: '📋' },
              ].map(m => (
                <div key={m.label} style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,padding:'16px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-10,right:-10,fontSize:40,opacity:.06}}>{m.icon}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.3)',fontWeight:600,marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>{m.label}</div>
                  <div style={{fontSize:22,fontWeight:900,color:m.hex}}>{m.value}</div>
                </div>
              ))}
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.25}} className="flex gap-2">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    padding:'8px 18px',borderRadius:12,fontSize:13,fontWeight:600,
                    border:`1px solid ${tab===t.id ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.06)'}`,
                    background: tab===t.id ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.02)',
                    color: tab===t.id ? '#22c55e' : 'rgba(255,255,255,.35)',
                    cursor:'pointer',transition:'all .2s ease',
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </motion.div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tab === 'score' && (
                <motion.div key="score" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}
                  className="grid md:grid-cols-2 gap-4">
                  {/* Credit preview */}
                  <div style={{background:'linear-gradient(135deg,rgba(6,95,70,.4),rgba(5,150,105,.2))',border:'1px solid rgba(16,185,129,.2)',borderRadius:20,padding:24}}>
                    <div style={{fontSize:11,color:'rgba(74,222,128,.6)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>Disponível agora</div>
                    <div style={{fontSize:42,fontWeight:900,color:'#fff',lineHeight:1}}>
                      {data.score >= 900 ? '12' : data.score >= 750 ? '9' : data.score >= 600 ? '6' : data.score >= 450 ? '3' : '1'}
                    </div>
                    <div style={{color:'rgba(255,255,255,.5)',fontSize:13,marginBottom:16}}>ofertas de crédito</div>
                    <div style={{background:'rgba(0,0,0,.2)',borderRadius:12,padding:12,fontSize:12,color:'rgba(255,255,255,.6)',display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
                      <div style={{display:'flex',justifyContent:'space-between'}}><span>Melhor taxa</span><span style={{fontWeight:700,color:'#4ade80'}}>{data.score >= 750 ? '1,0%' : data.score >= 600 ? '1,2%' : '1,5%'} a.m.</span></div>
                      <div style={{display:'flex',justifyContent:'space-between'}}><span>Prazo máx.</span><span style={{fontWeight:700,color:'#4ade80'}}>18 meses</span></div>
                    </div>
                    <Link href="/dashboard/agrorate/credito"
                      style={{display:'block',textAlign:'center',background:'rgba(255,255,255,.1)',color:'#fff',fontWeight:700,fontSize:13,padding:'10px',borderRadius:12,textDecoration:'none'}}>
                      Ver todas as ofertas →
                    </Link>
                  </div>

                  {/* Tips */}
                  <div style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:24}}>
                    <div style={{fontWeight:700,color:'rgba(255,255,255,.5)',fontSize:11,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16}}>Como melhorar</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[
                        data.productionScore < 600 && { icon:'🌾', text:'Registre receitas de culturas no SmartAgroOS para aumentar Produção', hi:true },
                        data.efficiencyScore < 600 && { icon:'💰', text:'Reduza custos ou aumente receita para melhorar Eficiência', hi:true },
                        data.behaviorScore < 600 && { icon:'📋', text:'Lance custos todo mês — consistência melhora Comportamento', hi:false },
                        data.dataCompleteness < 80 && { icon:'📊', text:'Complete o perfil da propriedade (talhões, culturas, equipe)', hi:false },
                        { icon:'🤖', text:'Peça dicas personalizadas ao Conselheiro IA', hi:false },
                      ].filter(Boolean).slice(0,3).map((tip: any, i) => (
                        <div key={i} style={{display:'flex',gap:10,padding:'10px 12px',borderRadius:12,background: tip.hi ? 'rgba(249,115,22,.08)' : 'rgba(255,255,255,.03)',border:`1px solid ${tip.hi ? 'rgba(249,115,22,.2)' : 'rgba(255,255,255,.05)'}`}}>
                          <span style={{fontSize:16,flexShrink:0}}>{tip.icon}</span>
                          <span style={{fontSize:12,color:'rgba(255,255,255,.55)',lineHeight:1.4}}>{tip.text}</span>
                          {tip.hi && <span style={{fontSize:9,fontWeight:900,color:'#f97316',background:'rgba(249,115,22,.15)',padding:'2px 6px',borderRadius:999,flexShrink:0,alignSelf:'flex-start',marginTop:1}}>urgente</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === 'analytics' && (
                <motion.div key="analytics" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}
                  className="grid md:grid-cols-2 gap-4">
                  {/* Completude radial */}
                  <div style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:24,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <div style={{fontWeight:700,color:'rgba(255,255,255,.5)',fontSize:11,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:20,alignSelf:'flex-start'}}>Completude dos dados</div>
                    <svg viewBox="0 0 160 160" className="w-36 h-36">
                      <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="12"/>
                      <motion.circle cx="80" cy="80" r="65" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={2*Math.PI*65}
                        initial={{strokeDashoffset:2*Math.PI*65}}
                        animate={{strokeDashoffset:2*Math.PI*65*(1-data.dataCompleteness/100)}}
                        transition={{delay:.3,duration:1.2,ease:'easeOut'}}
                        transform="rotate(-90 80 80)"
                        style={{filter:'drop-shadow(0 0 8px rgba(34,197,94,.5))'}}/>
                      <text x="80" y="85" textAnchor="middle" fill="#22c55e" fontSize="28" fontWeight="900">{data.dataCompleteness}%</text>
                    </svg>
                    <div style={{color:'rgba(255,255,255,.3)',fontSize:12,marginTop:8}}>dados da propriedade preenchidos</div>
                  </div>

                  {/* Score breakdown bars */}
                  <div style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:24}}>
                    <div style={{fontWeight:700,color:'rgba(255,255,255,.5)',fontSize:11,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:20}}>Score por dimensão</div>
                    <div className="space-y-5">
                      {[
                        {label:'Produção',   v:data.productionScore,  hex:'#22c55e', w:30},
                        {label:'Eficiência', v:data.efficiencyScore,  hex:'#06b6d4', w:25},
                        {label:'Comportamento',v:data.behaviorScore,  hex:'#8b5cf6', w:25},
                        {label:'Operacional',v:data.operationalScore, hex:'#f59e0b', w:20},
                      ].map(d => (
                        <div key={d.label}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}>
                            <span style={{color:'rgba(255,255,255,.4)',fontWeight:500}}>{d.label} <span style={{color:'rgba(255,255,255,.2)',fontSize:10}}>·{d.w}%</span></span>
                            <span style={{color:d.hex,fontWeight:700}}>{d.v}</span>
                          </div>
                          <div style={{height:6,background:'rgba(255,255,255,.05)',borderRadius:999,overflow:'hidden'}}>
                            <motion.div style={{height:'100%',borderRadius:999,background:d.hex,boxShadow:`0 0 8px ${d.hex}60`}}
                              initial={{width:0}} animate={{width:`${(d.v/1000)*100}%`}} transition={{delay:.2,duration:1,ease:'easeOut'}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === 'credit' && (
                <motion.div key="credit" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} className="space-y-3">
                  {[
                    {bank:'Sicredi',     tipo:'Cooperativa', nome:'Crédito Rural Premium', taxa:1.0, valor:200000, min:750, dest:true},
                    {bank:'Banco do Brasil', tipo:'Banco',   nome:'Finagro',              taxa:1.4, valor:150000, min:600, dest:false},
                    {bank:'Sicoob',      tipo:'Cooperativa', nome:'Crédito Insumos',       taxa:1.5, valor:100000, min:650, dest:false},
                    {bank:'AgroCred',   tipo:'Fintech',      nome:'Antecipação de Recebíveis', taxa:2.0, valor:50000, min:500, dest:false},
                  ].map(o => {
                    const unlocked = data.score >= o.min
                    return (
                      <motion.div key={o.bank} whileHover={unlocked ? {scale:1.01} : {}}
                        style={{
                          background: o.dest ? 'linear-gradient(135deg,rgba(6,95,70,.3),rgba(5,150,105,.15))' : 'rgba(255,255,255,.02)',
                          border: `1px solid ${o.dest ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,.06)'}`,
                          borderRadius:16,padding:'16px 20px',opacity:unlocked?1:.4,
                          display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,
                        }}>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                            <span style={{fontWeight:700,color:'rgba(255,255,255,.8)',fontSize:14}}>{o.bank}</span>
                            <span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.3)',background:'rgba(255,255,255,.06)',padding:'2px 8px',borderRadius:999}}>{o.tipo}</span>
                            {o.dest && <span style={{fontSize:10,fontWeight:700,color:'#4ade80',background:'rgba(34,197,94,.15)',padding:'2px 8px',borderRadius:999}}>Recomendado</span>}
                          </div>
                          <div style={{fontSize:12,color:'rgba(255,255,255,.3)'}}>{o.nome} · até {fmt(o.valor)} · Score mín. {o.min}</div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:24,fontWeight:900,color:'#4ade80'}}>{o.taxa}%</div>
                          <div style={{fontSize:10,color:'rgba(255,255,255,.25)'}}>ao mês</div>
                        </div>
                      </motion.div>
                    )
                  })}
                  <Link href="/dashboard/agrorate/credito" style={{display:'block',textAlign:'center',padding:'14px',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.15)',borderRadius:16,color:'#22c55e',fontWeight:700,fontSize:13,textDecoration:'none'}}>
                    Ver todas as ofertas disponíveis →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom AI CTA */}
            <motion.button initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}}
              onClick={() => window.dispatchEvent(new CustomEvent('ai-prefill', { detail: { prompt: `Analise meu score AgroRate de ${data.score} pontos (${cat.label}). Minha margem é ${Math.round(data.marginRate*100)}% e completude de dados ${data.dataCompleteness}%. O que devo priorizar para subir de categoria?` }}))}
              style={{width:'100%',background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.2)',borderRadius:16,padding:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:10,color:'rgba(139,92,246,.8)',fontWeight:700,fontSize:13,cursor:'pointer',transition:'all .2s ease'}}
            >
              <span style={{fontSize:18}}>🤖</span>
              Pedir análise personalizada ao Conselheiro IA
            </motion.button>
          </>
        )}
      </div>
    </div>
  )
}
