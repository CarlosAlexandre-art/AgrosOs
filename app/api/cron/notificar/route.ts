import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'
import { sendPromotionalEmail } from '@/lib/email/resend'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const hour = now.getHours()
  
  // Mensagens diferentes dependendo do horário (Manhã vs Noite)
  const isMorning = hour < 12
  const subject = isMorning ? 'Bom dia com SmartAgroOS! 🚜' : 'Sua fazenda em dia com SmartAgroOS! 🌙'
  const title = isMorning ? 'Hora de planejar o dia no campo!' : 'Como foi o dia na fazenda?'
  const message = isMorning 
    ? 'Acesse seu dashboard e confira as atividades planejadas para hoje. Mantenha sua operação organizada e eficiente.'
    : 'Registre suas atividades do dia e mantenha seus custos atualizados. O SmartAgroOS ajuda você a ter controle total.'
  const cta = isMorning ? 'Ver atividades hoje' : 'Registrar operações'

  try {
    const usuarios = await prisma.user.findMany({
      where: { email: { not: '' } },
      select: { id: true, email: true, name: true }
    })

    let count = 0
    for (const user of usuarios) {
      if (!user.email) continue
      
      // Enviar Push
      await sendPushToUser(user.id, {
        title: subject,
        body: message,
        url: '/dashboard'
      }).catch(() => {})

      // Enviar Email
      await sendPromotionalEmail(
        user.email,
        user.name || 'Produtor',
        subject,
        title,
        message,
        cta,
        'https://agroos.site/dashboard'
      ).catch(() => {})

      count++
      // Delay para respeitar limites
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    return NextResponse.json({ ok: true, processados: count })
  } catch (error) {
    console.error('Erro no cron de notificações SmartAgroOS:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
