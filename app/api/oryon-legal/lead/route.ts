import { NextRequest, NextResponse } from 'next/server'

const ADVOGADA_EMAIL = process.env.ORYON_LEGAL_EMAIL ?? 'alexandre@oryonag.com.br'
const RESEND_KEY = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, telefone, email, cidade, estado, objetivo, origem } = body

    if (!nome || !telefone || !objetivo) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Envia e-mail para a advogada via Resend
    if (RESEND_KEY) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ORYON Legal <noreply@oryonag.com.br>',
          to: ADVOGADA_EMAIL,
          subject: `⚖️ Novo lead jurídico — ${nome} (${origem})`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px">
              <div style="background:#15803d;color:white;padding:24px 20px;border-radius:12px 12px 0 0">
                <h2 style="margin:0;font-size:18px">⚖️ Novo Lead — ORYON Legal</h2>
                <p style="margin:6px 0 0;opacity:0.8;font-size:12px">Origem: ${origem}</p>
              </div>
              <div style="background:#f9fafb;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">

                ${[
                  { label: 'Nome', value: nome, color: '#111827' },
                  { label: 'WhatsApp', value: `<a href="https://wa.me/55${telefone.replace(/\D/g, '')}" style="color:#15803d;font-weight:700;text-decoration:none">${telefone}</a>`, color: null },
                  { label: 'E-mail', value: email || '—', color: '#111827' },
                  { label: 'Cidade/Estado', value: `${cidade || '—'}${estado ? ` / ${estado}` : ''}`, color: '#111827' },
                  { label: 'Objetivo', value: objetivo, color: '#15803d' },
                ].map(row => `
                  <div style="padding:12px 0;border-bottom:1px solid #e5e7eb">
                    <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${row.label}</div>
                    <div style="font-size:15px;font-weight:600;color:${row.color || 'inherit'}">${row.value}</div>
                  </div>
                `).join('')}

                <div style="margin-top:16px;padding:14px 16px;background:white;border-radius:10px;border:1px solid #e5e7eb">
                  <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6">Lead gerado automaticamente pelo ecossistema OryonAG.</p>
                </div>
                <a href="https://wa.me/55${telefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(nome)}%2C%20sou%20da%20equipe%20ORYON%20Legal%20e%20gostaria%20de%20agendar%20um%20diagnóstico%20jurídico%20gratuito%20para%20você."
                   style="display:block;margin-top:14px;text-align:center;background:#25d366;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px">
                  💬 Responder via WhatsApp
                </a>
              </div>
            </div>
          `,
        }),
      })
      const resendData = await resendRes.json()
      console.log('Resend response:', JSON.stringify(resendData))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('oryon-legal lead error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
