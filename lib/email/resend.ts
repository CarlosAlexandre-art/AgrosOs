import { Resend } from 'resend'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendEmailConfirmation(name: string, email: string, confirmationUrl: string) {
  const resend = getResend()
  const firstName = name.split(' ')[0]
  await resend.emails.send({
    from: 'SmartAgroOS <noreply@parceirosdeproposito.com>',
    to: email,
    subject: 'Confirme seu e-mail para acessar o SmartAgroOS',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

            <div style="background:linear-gradient(135deg,#15803d,#16a34a);padding:36px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">🌾</div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">SmartAgroOS</h1>
              <p style="margin:6px 0 0;color:#bbf7d0;font-size:14px;">Sistema Operacional da Fazenda</p>
            </div>

            <div style="padding:36px 32px;">
              <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:700;">Olá, ${firstName}! 👋</h2>
              <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;">
                Obrigado por criar sua conta no SmartAgroOS. Para ativar o acesso, confirme seu endereço de e-mail clicando no botão abaixo.
              </p>
              <p style="margin:0 0 28px;color:#94a3b8;font-size:13px;">
                Este link expira em 24 horas.
              </p>

              <div style="text-align:center;margin-bottom:28px;">
                <a href="${confirmationUrl}"
                   style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.2px;">
                  ✅ Confirmar meu e-mail
                </a>
              </div>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#15803d;font-size:13px;font-weight:600;">Após confirmar, você poderá:</p>
                <ul style="margin:0;padding:0 0 0 18px;color:#166534;font-size:13px;line-height:2;">
                  <li>Cadastrar sua propriedade e talhões</li>
                  <li>Controlar safras e atividades</li>
                  <li>Acompanhar financeiro e metas</li>
                  <li>Usar a IA agronômica (AgroGPT)</li>
                </ul>
              </div>

              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.6;">
                Se você não criou esta conta, ignore este e-mail.<br/>
                O botão não funcionou? Copie e cole este link no navegador:<br/>
                <span style="color:#475569;word-break:break-all;">${confirmationUrl}</span>
              </p>
            </div>

            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 SmartAgroOS · OryonAG Ecosystem</p>
            </div>

          </div>
        </body>
      </html>
    `,
  })
}

export async function sendWelcomeEmail(name: string, email: string) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SmartAgroOS <noreply@parceirosdeproposito.com>',
    to: email,
    subject: 'Bem-vindo ao SmartAgroOS 🌾',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

            <!-- Header -->
            <div style="background:#16a34a;padding:32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">🌾</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SmartAgroOS</h1>
              <p style="margin:4px 0 0;color:#bbf7d0;font-size:14px;">Sistema Operacional da Fazenda</p>
            </div>

            <!-- Body -->
            <div style="padding:32px;">
              <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Olá, ${name}! 👋</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Bem-vindo ao SmartAgroOS. Sua conta foi criada com sucesso e você já pode começar a gerenciar sua operação agrícola.
              </p>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;color:#15803d;font-size:14px;font-weight:600;">O que você pode fazer agora:</p>
                <ul style="margin:0;padding:0 0 0 20px;color:#166534;font-size:14px;line-height:2;">
                  <li>Cadastrar sua propriedade e talhões</li>
                  <li>Registrar atividades e operações</li>
                  <li>Controlar custos e financeiro</li>
                  <li>Gerenciar sua equipe</li>
                  <li>Acompanhar metas da safra</li>
                </ul>
              </div>

              <div style="text-align:center;margin-bottom:24px;">
                <a href="https://agroos.site/dashboard" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  Acessar o dashboard →
                </a>
              </div>

              <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
                Qualquer dúvida, responda este email que te ajudamos.
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2025 SmartAgroOS · Sistema Operacional da Fazenda</p>
            </div>

          </div>
        </body>
      </html>
    `,
  })
}

export async function sendPromotionalEmail(email: string, name: string, subject: string, title: string, body: string, cta: string, url: string) {
  const resend = getResend()
  await resend.emails.send({
    from: 'SmartAgroOS <noreply@parceirosdeproposito.com>',
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
            <div style="background:#16a34a;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">SmartAgroOS</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">Olá, ${name.split(' ')[0]}!</h2>
              <h3 style="color:#16a34a;font-size:18px;margin-bottom:16px;">${title}</h3>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">${body}</p>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  ${cta}
                </a>
              </div>
            </div>
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 SmartAgroOS · OryonAG Ecosystem</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
