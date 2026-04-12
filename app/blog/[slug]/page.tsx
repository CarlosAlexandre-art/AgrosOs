import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { getPostBySlug, getAllPosts } from '@/lib/blog'

const CATEGORY_COLORS: Record<string, string> = {
  Financeiro: 'bg-purple-100 text-purple-700',
  Operações: 'bg-blue-100 text-blue-700',
  AgroLink: 'bg-green-100 text-green-700',
  Equipe: 'bg-orange-100 text-orange-700',
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  // Converte markdown básico para HTML simples
  const html = post.content
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '$1')

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="pt-24 pb-20">
        {/* Back */}
        <div className="max-w-3xl mx-auto px-6 pt-8 mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#16a34a] transition-colors font-medium">
            ← Voltar ao Blog
          </Link>
        </div>

        {/* Article header */}
        <article className="max-w-3xl mx-auto px-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                {post.category}
              </span>
              <span className="text-xs text-[#94a3b8]">{post.readTime} de leitura</span>
              <span className="text-xs text-[#94a3b8]">
                {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                {post.coverEmoji}
              </div>
              <h1 className="text-4xl font-bold text-[#0f172a] leading-tight">{post.title}</h1>
            </div>

            <p className="text-xl text-[#64748b] leading-relaxed border-l-4 border-green-200 pl-4">
              {post.excerpt}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <div
              className="prose prose-lg max-w-none text-[#374151] leading-relaxed
                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#0f172a] [&_h2]:mt-10 [&_h2]:mb-4
                [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0f172a] [&_h3]:mt-8 [&_h3]:mb-3
                [&_p]:mb-5 [&_p]:leading-relaxed
                [&_ul]:space-y-2 [&_ul]:mb-5 [&_ul]:pl-0 [&_ul]:list-none
                [&_li]:flex [&_li]:items-start [&_li]:gap-2
                [&_li]:before:content-['✓'] [&_li]:before:text-[#16a34a] [&_li]:before:font-bold [&_li]:before:flex-shrink-0
                [&_strong]:font-bold [&_strong]:text-[#0f172a]"
              dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
            />
          </div>

          {/* CTA */}
          <div className="mt-12 bg-[#f0fdf4] rounded-2xl border border-green-200 p-8 text-center">
            <div className="text-3xl mb-3">🌾</div>
            <h3 className="text-xl font-bold text-[#0f172a] mb-2">Pronto para colocar em prática?</h3>
            <p className="text-[#64748b] mb-6">Comece a usar o AgroOS gratuitamente e leve o controle para sua fazenda.</p>
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors shadow-md shadow-green-200">
              Criar conta grátis →
            </Link>
          </div>

          {/* Author */}
          <div className="mt-8 flex items-center gap-4 pt-8 border-t border-gray-100">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-[#16a34a]">
              {post.author[0]}
            </div>
            <div>
              <div className="font-semibold text-sm text-[#0f172a]">{post.author}</div>
              <div className="text-xs text-[#94a3b8]">AgroOS</div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
