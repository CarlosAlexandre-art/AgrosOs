export default function AgroRatePage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">💰</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Em breve
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">AgroRate</h1>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          Score de crédito rural baseado em dados reais da sua operação — produção, eficiência, comportamento financeiro e histórico operacional.
        </p>
      </div>
    </div>
  )
}
