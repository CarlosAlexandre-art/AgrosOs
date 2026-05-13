import Link from 'next/link'

interface Props {
  icon: string
  feature: string
  desc: string
}

export default function ProPaywall({ icon, feature, desc }: Props) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          🔒 Recurso exclusivo Pro
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">{feature}</h1>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">{desc}</p>
        <Link
          href="/dashboard/planos"
          className="inline-flex items-center gap-2 bg-[#16a34a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors"
        >
          Ver planos →
        </Link>
      </div>
    </div>
  )
}
