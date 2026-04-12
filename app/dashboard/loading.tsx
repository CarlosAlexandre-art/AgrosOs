export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-pulse">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-36 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="w-9 h-9 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Atividades */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="h-5 w-40 bg-slate-200 rounded" />
          </div>
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-12 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
