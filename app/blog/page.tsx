import Link from 'next/link'
import Nav from '@/components/Nav'
import { getAllPosts } from '@/lib/blog'

const CATEGORY_COLORS: Record<string, string> = {
  Financeiro: 'bg-purple-100 text-purple-700',
  Operações: 'bg-blue-100 text-blue-700',
  AgroLink: 'bg-green-100 text-green-700',
  Equipe: 'bg-orange-100 text-orange-700',
  Agronegócio: 'bg-amber-100 text-amber-700',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="pt-24 pb-20">
        {/* Banner */}
        <section className="relative overflow-hidden" style={{minHeight: 420}}>
          {/* Sky */}
          <div className="absolute inset-0" style={{background: 'linear-gradient(175deg, #0c2818 0%, #14532d 30%, #16a34a 65%, #86efac 85%, #fef9c3 100%)'}} />
          {/* Glow solar */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{top: '55%', width: 340, height: 340, background: 'radial-gradient(circle, rgba(250,204,21,0.35) 0%, rgba(250,204,21,0.12) 40%, transparent 70%)', borderRadius: '50%'}} />
          {/* Campo / horizonte SVG */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,140 Q120,100 240,130 Q360,160 480,120 Q600,80 720,115 Q840,150 960,110 Q1080,70 1200,120 Q1320,165 1440,130 L1440,180 L0,180 Z" fill="#052e16" opacity="0.95"/>
            <path d="M0,160 Q180,130 360,155 Q540,180 720,150 Q900,120 1080,155 Q1260,190 1440,160 L1440,180 L0,180 Z" fill="#021a0e" opacity="1"/>
            {/* Trigo/plantas estilizadas */}
            {[60,130,220,310,440,560,650,740,830,950,1080,1180,1280,1380].map((x, i) => (
              <g key={i} transform={`translate(${x}, ${140 + (i % 3) * 8})`}>
                <line x1="0" y1="0" x2="0" y2="30" stroke="#15803d" strokeWidth="1.5" opacity="0.8"/>
                <ellipse cx="0" cy="-2" rx="3" ry="8" fill="#16a34a" opacity="0.9"/>
                <line x1="-5" y1="10" x2="0" y2="6" stroke="#15803d" strokeWidth="1" opacity="0.7"/>
                <line x1="5" y1="12" x2="0" y2="8" stroke="#15803d" strokeWidth="1" opacity="0.7"/>
              </g>
            ))}
          </svg>
          {/* Conteúdo */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-white/20 uppercase tracking-widest">
              ✦ Blog SmartAgroOS
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">
              Conhecimento para o<br />
              <span style={{background: 'linear-gradient(90deg, #86efac, #fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>agro moderno</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-xl">
              Dicas práticas, estratégias e dados para quem quer controlar melhor a operação da fazenda.
            </p>
            {/* Stats */}
            <div className="flex items-center gap-6 mt-8 flex-wrap justify-center">
              {[
                { val: '24,8%', label: 'do PIB brasileiro' },
                { val: 'US$ 168bi', label: 'em exportações' },
                { val: '3,8M', label: 'produtores rurais' },
              ].map(s => (
                <div key={s.label} className="text-center bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-3">
                  <div className="text-xl font-black text-white">{s.val}</div>
                  <div className="text-[11px] text-white/60 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Posts */}
        <section className="px-6 max-w-5xl mx-auto">
          {/* Featured post */}
          {posts[0] && (
            <Link href={`/blog/${posts[0].slug}`} className="group block mb-10">
              <div className="bg-[#f8fafc] rounded-3xl border border-gray-100 overflow-hidden hover:border-green-200 hover:shadow-xl hover:shadow-green-50 transition-all p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-24 h-24 bg-green-50 rounded-2xl flex items-center justify-center text-6xl flex-shrink-0">
                    {posts[0].coverEmoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[posts[0].category] || 'bg-gray-100 text-gray-600'}`}>
                        {posts[0].category}
                      </span>
                      <span className="text-xs text-[#94a3b8]">{posts[0].readTime} de leitura</span>
                      <span className="text-xs text-[#94a3b8]">{new Date(posts[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-3 group-hover:text-[#16a34a] transition-colors">{posts[0].title}</h2>
                    <p className="text-[#64748b] leading-relaxed">{posts[0].excerpt}</p>
                    <div className="mt-4 flex items-center gap-2 text-[#16a34a] font-semibold text-sm">
                      Ler artigo <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Other posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.slice(1).map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-green-200 hover:shadow-lg hover:shadow-green-50 transition-all h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                      {post.coverEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-[#94a3b8]">{post.readTime}</span>
                      </div>
                      <h3 className="font-bold text-[#0f172a] mb-2 group-hover:text-[#16a34a] transition-colors leading-snug">{post.title}</h3>
                      <p className="text-sm text-[#64748b] line-clamp-2">{post.excerpt}</p>
                      <div className="mt-3 text-sm text-[#94a3b8]">
                        {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-20 text-[#94a3b8]">
              <div className="text-5xl mb-4">📝</div>
              <p>Nenhum post ainda.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
