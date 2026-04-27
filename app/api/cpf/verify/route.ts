import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cpf } = await request.json()
  const digits = String(cpf).replace(/\D/g, '')
  if (digits.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
  }

  const apiKey = process.env.CPF_BRASIL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Serviço de verificação não configurado' }, { status: 503 })
  }

  const res = await fetch(`https://api.cpf-brasil.org/cpf/${digits}`, {
    headers: { 'X-API-Key': apiKey },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 404) {
      return NextResponse.json({ error: 'CPF não encontrado na base Receita Federal' }, { status: 404 })
    }
    return NextResponse.json({ error: `Erro na verificação: ${res.status}` }, { status: 502 })
  }

  const data = await res.json()
  if (!data.success || !data.data?.NOME) {
    return NextResponse.json({ error: 'Dados não disponíveis para este CPF' }, { status: 422 })
  }

  const { NOME, NASC, SEXO } = data.data

  await prisma.user.update({
    where: { supabaseId: user.id },
    data: { cpf: digits, kycVerified: true },
  })

  return NextResponse.json({ verified: true, nome: NOME, nasc: NASC, sexo: SEXO })
}
