export default function OperacoesLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
        <div className="divide-y divide-slate-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-56 bg-slate-200 rounded" />
                <div className="h-3 w-36 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-24 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
