'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function TabNav({ unreadCount }: { unreadCount: number }) {
  const router = useRouter()
  const params = useSearchParams()
  const tab = params.get('tab') ?? 'ativos'

  function go(t: string) {
    router.push(`?tab=${t}`, { scroll: false })
  }

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      <button
        onClick={() => go('ativos')}
        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'ativos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
      >
        Ativos
        {unreadCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <button
        onClick={() => go('historico')}
        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'historico' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
      >
        Histórico
      </button>
    </div>
  )
}
