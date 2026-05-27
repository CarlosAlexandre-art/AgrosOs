import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const textoManual = (formData.get('texto') as string | null)?.trim()

    if (!audioFile && !textoManual) {
      return NextResponse.json({ error: 'Áudio ou texto obrigatório' }, { status: 400 })
    }

    let transcricao: string

    if (textoManual) {
      // Fallback de texto — pula Whisper, usa o texto direto
      transcricao = textoManual
    } else {
      // Transcrição via Groq Whisper
      const whisperForm = new FormData()
      whisperForm.append('file', audioFile!, audioFile!.name || 'audio.webm')
      whisperForm.append('model', 'whisper-large-v3')
      whisperForm.append('language', 'pt')
      whisperForm.append('response_format', 'json')

      const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: whisperForm,
      })

      if (!whisperRes.ok) {
        const err = await whisperRes.text()
        console.error('[Whisper Error]', err)
        return NextResponse.json({ error: 'Erro na transcrição de áudio' }, { status: 500 })
      }

      const { text } = await whisperRes.json()
      if (!text?.trim()) {
        return NextResponse.json({ error: 'Nenhuma fala detectada' }, { status: 400 })
      }
      transcricao = text
    }

    // Extrai dados estruturados da transcrição via LLM
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        properties: {
          take: 1,
          select: {
            id: true,
            fields: { select: { id: true, name: true } },
            teamMembers: { select: { id: true, name: true } },
          },
        },
      },
    })

    const property = dbUser?.properties[0]
    const talhoes = property?.fields.map(f => f.name).join(', ') || 'nenhum'
    const equipe = property?.teamMembers.map(m => m.name).join(', ') || 'nenhum'

    const hoje = new Date().toISOString().split('T')[0]

    const extractPrompt = `Você é um assistente que extrai dados de atividades agrícolas a partir de transcrições de voz em português brasileiro.

Talhões disponíveis na fazenda: ${talhoes}
Membros da equipe: ${equipe}
Data de hoje: ${hoje}

Tipos de atividade válidos (use exatamente um destes):
PLANTIO, COLHEITA, PULVERIZACAO, ADUBACAO, IRRIGACAO, MANUTENCAO, MONITORAMENTO, VACINACAO, VERMIFUGACAO, PESAGEM, MANEJO, TRANSPORTE, OUTROS

Status válidos: PENDING (padrão), IN_PROGRESS (se em andamento), DONE (se já concluído)

Transcrição: "${transcricao}"

Responda APENAS com JSON válido, sem markdown, sem explicação:
{
  "type": "TIPO_DA_ATIVIDADE",
  "description": "descrição completa do que foi dito",
  "status": "PENDING",
  "startDate": "${hoje}",
  "endDate": null,
  "fieldName": "nome do talhão mencionado ou null",
  "assignedToName": "nome do membro da equipe mencionado ou null",
  "confianca": "alta/media/baixa"
}`

    const extracted = await groq([{ role: 'user', content: extractPrompt }], 512)

    let atividade: Record<string, unknown>
    try {
      const clean = extracted.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      atividade = JSON.parse(clean)
    } catch {
      return NextResponse.json({ transcricao, atividade: null, erro: 'Não foi possível extrair dados estruturados' })
    }

    // Resolve IDs de talhão e membro se mencionados
    let fieldId: string | undefined
    if (atividade.fieldName && property?.fields) {
      const field = property.fields.find(f =>
        f.name.toLowerCase().includes(String(atividade.fieldName).toLowerCase())
      )
      if (field) fieldId = field.id
    }

    let assignedToId: string | undefined
    if (atividade.assignedToName && property?.teamMembers) {
      const member = property.teamMembers.find(m =>
        m.name.toLowerCase().includes(String(atividade.assignedToName).toLowerCase())
      )
      if (member) assignedToId = member.id
    }

    return NextResponse.json({
      transcricao,
      atividade: {
        type: atividade.type,
        description: atividade.description,
        status: atividade.status || 'PENDING',
        startDate: atividade.startDate || hoje,
        endDate: atividade.endDate || null,
        fieldId: fieldId || null,
        assignedToId: assignedToId || null,
        propertyId: property?.id,
        confianca: atividade.confianca,
      },
    })
  } catch (e: any) {
    console.error('[VozParaAtividade Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}
