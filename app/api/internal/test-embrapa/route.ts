import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.EMBRAPA_CLIENT_KEY
  const secret = process.env.EMBRAPA_CLIENT_SECRET

  if (!key || !secret) {
    return NextResponse.json({ ok: false, etapa: 'env', erro: 'EMBRAPA_CLIENT_KEY ou EMBRAPA_CLIENT_SECRET não configurados no Vercel' })
  }

  // Etapa 1: obter token
  let token: string
  try {
    const basic = Buffer.from(`${key}:${secret}`).toString('base64')
    const res = await fetch('https://api.cnptia.embrapa.br/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    })
    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json({ ok: false, etapa: 'token', status: res.status, erro: body })
    }
    const data = await res.json() as { access_token: string; expires_in: number }
    token = data.access_token
  } catch (e: any) {
    return NextResponse.json({ ok: false, etapa: 'token', erro: e.message })
  }

  // Etapa 2: testar BovTrace (listar raças)
  try {
    const res = await fetch('https://api.cnptia.embrapa.br/bovtrace/v1/racas', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.text()
    if (!res.ok) {
      return NextResponse.json({ ok: false, etapa: 'bovtrace', status: res.status, erro: body, tokenOk: true })
    }
    return NextResponse.json({ ok: true, etapa: 'bovtrace', status: res.status, tokenOk: true, amostra: JSON.parse(body) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, etapa: 'bovtrace', erro: e.message, tokenOk: true })
  }
}
