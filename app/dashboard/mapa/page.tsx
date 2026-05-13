import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import MapaClient from './MapaClient'

export default async function MapaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      properties: {
        take: 1,
        select: {
          id: true,
          name: true,
          lat: true,
          lng: true,
          sizeHectares: true,
          fields: {
            select: { id: true, name: true, sizeHectares: true, lat: true, lng: true, geoJson: true },
          },
        },
      },
    },
  })

  const property = dbUser?.properties[0]

  if (!property) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12 text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Nenhuma propriedade cadastrada</h1>
        <p className="text-slate-500 text-sm">Cadastre uma propriedade primeiro para usar o mapa interativo.</p>
      </div>
    )
  }

  const data = {
    id: property.id,
    name: property.name,
    lat: property.lat,
    lng: property.lng,
    sizeHectares: Number(property.sizeHectares),
    fields: property.fields.map(f => ({
      id: f.id,
      name: f.name,
      sizeHectares: Number(f.sizeHectares),
      lat: f.lat,
      lng: f.lng,
      geoJson: f.geoJson,
    })),
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mapa da Fazenda</h1>
          <p className="text-sm text-slate-500 mt-0.5">{property.name} · imagem de satélite em tempo real</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tiles © Esri · OpenStreetMap
        </div>
      </div>

      {/* Map — takes remaining height */}
      <div className="flex-1 min-h-0">
        <MapaClient data={data} />
      </div>
    </div>
  )
}
