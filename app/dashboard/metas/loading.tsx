export default function MetasLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 bg-slate-200 rounded-lg" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 bg-slate-200 rounded" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full" />
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
