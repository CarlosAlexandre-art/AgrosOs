import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const propertyId = formData.get('propertyId') as string | null

    if (!file || !propertyId) {
      return NextResponse.json({ error: 'Arquivo e propertyId são obrigatórios' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WebP.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande. Máximo 10MB.' }, { status: 400 })
    }

    // Verifica que a propriedade pertence ao usuário
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { where: { id: propertyId }, select: { id: true, coverUrl: true } } },
    })
    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const admin = createAdminClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${propertyId}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    // Remove capa anterior
    if (property.coverUrl) {
      try {
        const oldUrl = new URL(property.coverUrl)
        const oldPath = oldUrl.pathname.split('/property-covers/')[1]
        if (oldPath) await admin.storage.from('property-covers').remove([oldPath])
      } catch { /* ignora */ }
    }

    const { error: uploadError } = await admin.storage
      .from('property-covers')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = admin.storage.from('property-covers').getPublicUrl(path)

    await prisma.property.update({ where: { id: propertyId }, data: { coverUrl: publicUrl } })

    return NextResponse.json({ coverUrl: publicUrl })
  } catch (error) {
    console.error('Erro ao salvar capa:', error)
    return NextResponse.json({ error: 'Erro interno ao salvar foto' }, { status: 500 })
  }
}
