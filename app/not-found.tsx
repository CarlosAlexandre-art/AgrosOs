import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🌾</div>
        <h1 className="text-6xl font-bold text-[#16a34a] mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Página não encontrada</h2>
        <p className="text-slate-500 mb-8">
          Essa página não existe ou foi removida. Volte para o início e continue gerenciando sua operação.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors"
          >
            Ir para o dashboard
          </Link>
          <Link
            href="/"
            className="border-2 border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:border-slate-300 transition-colors"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
