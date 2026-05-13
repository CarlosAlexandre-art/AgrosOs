let cachedToken: string | null = null
let tokenExpiry = 0

export function clearEmbrapaTokenCache() {
  cachedToken = null
  tokenExpiry = 0
}

export async function getEmbrapaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const key = process.env.EMBRAPA_CLIENT_KEY
  const secret = process.env.EMBRAPA_CLIENT_SECRET
  if (!key || !secret) throw new Error('EMBRAPA_CLIENT_KEY ou EMBRAPA_CLIENT_SECRET não configurados')

  const basic = Buffer.from(`${key}:${secret}`).toString('base64')
  const res = await fetch('https://api.cnptia.embrapa.br/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Falha ao obter token Embrapa: ${res.status}`)
  const data = await res.json() as { access_token: string; expires_in: number }

  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000 // renova 60s antes
  return cachedToken
}
