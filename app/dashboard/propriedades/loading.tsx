export default function PropriedadesLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-36 bg-slate-100" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="flex gap-4">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
