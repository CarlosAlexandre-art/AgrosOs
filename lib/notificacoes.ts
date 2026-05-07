import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getResend } from '@/lib/email/resend'

// ─── Tipos de notificação ───────────────────────────────────────────────────────

export interface NotificationData {
  userId: string
  tipo: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PROMOTION' | 'REMINDER'
  titulo: string
  mensagem: string
  dadosAdicionais?: any
  canal: 'PUSH' | 'EMAIL' | 'AMBOS'
  agendarPara?: Date
  propertyId?: string
}

// ─── Criar notificação ─────────────────────────────────────────────────────────

export async function criarNotificacao(data: NotificationData) {
  try {
    // Salvar no banco se tiver tabela de notificações
    // const notificacao = await prisma.notificacao.create({
    //   data: {
    //     userId: data.userId,
    //     tipo: data.tipo,
    //     titulo: data.titulo,
    //     mensagem: data.mensagem,
    //     dadosAdicionais: data.dadosAdicionais ? JSON.stringify(data.dadosAdicionais) : null,
    //     canal: data.canal,
    //     agendarPara: data.agendarPara,
    //     propertyId: data.propertyId,
    //     status: data.agendarPara ? 'AGENDADA' : 'PENDENTE',
    //     createdAt: new Date()
    //   }
    // })

    console.log('📬 Notificação criada:', data)

    // Enviar imediatamente se não for agendada
    if (!data.agendarPara || data.agendarPara <= new Date()) {
      await enviarNotificacao(data)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return { success: false, error }
  }
}

// ─── Enviar notificação ───────────────────────────────────────────────────────

export async function enviarNotificacao(data: NotificationData) {
  try {
    // Buscar usuário e assinaturas push
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { pushSubscriptions: true }
    })

    if (!user) {
      console.error('Usuário não encontrado:', data.userId)
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Enviar Push Notification
    if (data.canal === 'PUSH' || data.canal === 'AMBOS') {
      await enviarPushNotification(data, user.pushSubscriptions)
    }

    // Enviar Email
    if (data.canal === 'EMAIL' || data.canal === 'AMBOS') {
      await enviarEmailNotification(data, user.email)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return { success: false, error }
  }
}

// ─── Push Notification ───────────────────────────────────────────────────────

async function enviarPushNotification(data: NotificationData, subscriptions: any[]) {
  if (subscriptions.length === 0) return

  const payload = {
    title: data.titulo,
    body: data.mensagem,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `oryonag-${data.tipo}`,
    data: {
      url: '/dashboard',
      ...data.dadosAdicionais
    }
  }

  for (const subscription of subscriptions) {
    try {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: subscription.endpoint,
          notification: payload,
          webpush: {
            headers: {
              'TTL': '86400' // 24 horas
            }
          }
        })
      })
    } catch (error) {
      console.error('Erro ao enviar push para', subscription.endpoint, error)
    }
  }
}

// ─── Email Notification ─────────────────────────────────────────────────────

async function enviarEmailNotification(data: NotificationData, userEmail: string) {
  try {
    const emailHtml = gerarEmailTemplate(data)
    
    const resend = getResend()
    await resend.emails.send({
      from: 'OryonAG <notificacoes@oryonag.com>',
      to: userEmail,
      subject: data.titulo,
      html: emailHtml
    })

    console.log('📧 Email enviado para:', userEmail)
  } catch (error) {
    console.error('Erro ao enviar email:', error)
  }
}

// ─── Template de Email ─────────────────────────────────────────────────────

function gerarEmailTemplate(data: NotificationData): string {
  const cores = {
    INFO: 'bg-blue-500',
    SUCCESS: 'bg-green-500',
    WARNING: 'bg-yellow-500',
    ERROR: 'bg-red-500',
    PROMOTION: 'bg-purple-500',
    REMINDER: 'bg-indigo-500'
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .cta { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌾 OryonAG</h1>
          <p>Ecossistema Digital do Agronegócio</p>
        </div>
        <div class="content">
          <div class="badge ${cores[data.tipo]}">${data.tipo}</div>
          <h2>${data.titulo}</h2>
          <p>${data.mensagem}</p>
          ${data.dadosAdicionais ? `<p style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px;">${JSON.stringify(data.dadosAdicionais, null, 2)}</p>` : ''}
          <a href="https://smartagros.vercel.app/dashboard" class="cta">Acessar Plataforma</a>
        </div>
        <div class="footer">
          <p>© 2026 OryonAG - Todos os direitos reservados</p>
          <p>Se você não deseja receber estes emails, <a href="https://smartagros.vercel.app/configuracoes">clique aqui</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ─── Notificações Automáticas ───────────────────────────────────────────────────

export class NotificacoesAutomaticas {
  // SmartAgroOS
  static async atividadeVencida(userId: string, propertyId: string, atividades: any[]) {
    await criarNotificacao({
      userId,
      tipo: 'WARNING',
      titulo: '⚠️ Atividades Vencendo',
      mensagem: `Você tem ${atividades.length} atividade(s) vencendo hoje. Verifique e atualize o status.`,
      canal: 'AMBOS',
      propertyId,
      dadosAdicionais: { atividades }
    })
  }

  static async metaAtingida(userId: string, propertyId: string, meta: any) {
    await criarNotificacao({
      userId,
      tipo: 'SUCCESS',
      titulo: '🎉 Meta Atingida!',
      mensagem: `Parabéns! Você atingiu a meta "${meta.titulo}" com ${meta.currentValue} de ${meta.targetValue}.`,
      canal: 'AMBOS',
      propertyId,
      dadosAdicionais: { meta }
    })
  }

  static async novoLembrete(userId: string, propertyId: string, lembrete: any) {
    await criarNotificacao({
      userId,
      tipo: 'REMINDER',
      titulo: '📅 Novo Lembrete',
      mensagem: `Lembrete: ${lembrete.titulo} - ${lembrete.descricao}`,
      canal: 'AMBOS',
      propertyId,
      dadosAdicionais: { lembrete }
    })
  }

  // AgroRate
  static async scoreAtualizado(userId: string, scoreAnterior: number, scoreNovo: number, categoria: string) {
    const mudanca = scoreNovo - scoreAnterior
    const tipo = mudanca > 0 ? 'SUCCESS' : 'WARNING'
    
    await criarNotificacao({
      userId,
      tipo,
      titulo: mudanca > 0 ? '📈 Score Melhorou!' : '📉 Score Alterado',
      mensagem: `Seu AgroRate foi atualizado: ${scoreAnterior} → ${scoreNovo} (${categoria}) ${mudanca > 0 ? `+${mudanca}` : mudanca}`,
      canal: 'AMBOS',
      dadosAdicionais: { scoreAnterior, scoreNovo, categoria }
    })
  }

  static async oportunidadeCredito(userId: string, oportunidades: any[]) {
    await criarNotificacao({
      userId,
      tipo: 'PROMOTION',
      titulo: '💰 Novas Oportunidades de Crédito',
      mensagem: `Temos ${oportunidades.length} nova(s) oportunidade(s) de crédito disponível(is) para você.`,
      canal: 'AMBOS',
      dadosAdicionais: { oportunidades }
    })
  }

  // Promocionais
  static async promocaoPlanoPro(userId: string) {
    await criarNotificacao({
      userId,
      tipo: 'PROMOTION',
      titulo: '🚀 Upgrade para Plano Pro',
      mensagem: 'Desbloqueie recursos premium e maximize sua produtividade com o plano Pro do SmartAgroOS.',
      canal: 'AMBOS',
      dadosAdicionais: { plano: 'pro', desconto: '20%' }
    })
  }

  static async boasVindas(userId: string, nome: string) {
    await criarNotificacao({
      userId,
      tipo: 'INFO',
      titulo: '👋 Bem-vindo ao OryonAG!',
      mensagem: `Olá, ${nome}! Estamos felizes em ter você no ecossistema agrícola mais completo do Brasil.`,
      canal: 'AMBOS',
      dadosAdicionais: { nome, plataforma: 'oryonag' }
    })
  }
}

// ─── Agendador de Notificações ───────────────────────────────────────────────

export async function processarNotificacoesAgendadas() {
  try {
    // const notificacoes = await prisma.notificacao.findMany({
    //   where: {
    //     status: 'AGENDADA',
    //     agendarPara: { lte: new Date() }
    //   }
    // })

    // for (const notificacao of notificacoes) {
    //   await enviarNotificacao({
    //     userId: notificacao.userId,
    //     tipo: notificacao.tipo,
    //     titulo: notificacao.titulo,
    //     mensagem: notificacao.mensagem,
    //     canal: notificacao.canal,
    //     dadosAdicionais: notificacao.dadosAdicionais ? JSON.parse(notificacao.dadosAdicionais) : undefined
    //   })

    //   await prisma.notificacao.update({
    //     where: { id: notificacao.id },
    //     data: { status: 'ENVIADA' }
    //   })
    // }

    console.log('📬 Notificações agendadas processadas')
  } catch (error) {
    console.error('Erro ao processar notificações agendadas:', error)
  }
}
