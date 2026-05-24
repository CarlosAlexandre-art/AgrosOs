interface Props {
  size?: number
}

export default function AgroOSLogo({ size = 40 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="9" fill="#0f172a"/>
      <circle cx="18" cy="18" r="12" stroke="#16a34a" strokeWidth="1.2" fill="none" opacity="0.6"/>
      <path d="M18 9 C18 9 11 13.5 11 18.5 C11 22 14 25 18 25 C22 25 25 22 25 18.5 C25 13.5 18 9 18 9Z"
        fill="rgba(22,163,74,0.15)" stroke="#4ade80" strokeWidth="1.3" strokeLinejoin="round"/>
      <line x1="18" y1="9" x2="18" y2="25" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="18" y1="13.5" x2="14.5" y2="11.8" stroke="#4ade80" strokeWidth="0.9" strokeLinecap="round" opacity="0.8"/>
      <line x1="18" y1="13.5" x2="21.5" y2="11.8" stroke="#4ade80" strokeWidth="0.9" strokeLinecap="round" opacity="0.8"/>
      <line x1="18" y1="17.5" x2="13.5" y2="15.8" stroke="#4ade80" strokeWidth="0.9" strokeLinecap="round" opacity="0.8"/>
      <line x1="18" y1="17.5" x2="22.5" y2="15.8" stroke="#4ade80" strokeWidth="0.9" strokeLinecap="round" opacity="0.8"/>
    </svg>
  )
}
