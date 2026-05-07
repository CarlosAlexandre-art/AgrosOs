'use client'

import dynamic from 'next/dynamic'

interface Field {
  id: string
  name: string
  sizeHectares: number
  lat: number | null
  lng: number | null
  geoJson: string | null
}

interface MapData {
  id: string
  name: string
  lat: number | null
  lng: number | null
  sizeHectares: number
  fields: Field[]
}

const FarmMap = dynamic(() => import('@/components/FarmMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Carregando mapa...</p>
      </div>
    </div>
  ),
})

export default function MapaClient({ data }: { data: MapData }) {
  return <FarmMap data={data} />
}
