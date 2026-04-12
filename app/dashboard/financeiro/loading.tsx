export default function FinanceiroLoading() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-slate-200 rounded-lg" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 h-64" />
        <div className="bg-white rounded-2xl border border-slate-200 p-6 h-64" />
      </div>
    </div>
  )
}
