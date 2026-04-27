'use client'

export default function LaunchCTA() {
  function showPopup() {
    localStorage.removeItem('agrotoken_launch_popup_dismissed')
    window.dispatchEvent(new CustomEvent('show-launch-popup'))
  }

  return (
    <button
      onClick={showPopup}
      className="inline-flex items-center justify-center gap-2 bg-[#16a34a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors text-sm"
    >
      <span>🔔</span> Me avise no lançamento
    </button>
  )
}
