import dynamic from 'next/dynamic'

const HeroSection = dynamic(() => import('@/components/Hero/HeroSection'), {
  ssr: true,
  loading: () => <div className="bg-[#020c05] min-h-screen" />
})

export default function OryonAGPage() {
  return (
    <div className="bg-[#020c05] min-h-screen">
      <HeroSection />
    </div>
  )
}
