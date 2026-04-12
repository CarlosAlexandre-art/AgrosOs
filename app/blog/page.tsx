import Link from 'next/link'
import Nav from '@/components/Nav'
import { getAllPosts } from '@/lib/blog'

const CATEGORY_COLORS: Record<string, string> = {
  Financeiro: 'bg-purple-100 text-purple-700',
  Operações: 'bg-blue-100 text-blue-700',
  AgroLink: 'bg-green-100 text-green-700',
  Equipe: 'bg-orange-100 text-orange-700',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="pt-24 pb-20">
        {/* Header */}
        <section className="px-6 py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(22,163,74,0.08), transparent)'}} />
          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-green-200 uppercase tracking-wider">
              📝 Blog AgroOS
            </div>
            <h1 className="text-5xl font-bold text-[#0f172a] mb-4">Conhecimento para o<br /><span style={{background: 'linear-gradient(135deg, #16a34a, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>agro moderno</span></h1>
            <p className="text-[#64748b] text-lg">Dicas práticas, estratégias e novidades para quem quer controlar melhor a operação da fazenda.</p>
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
