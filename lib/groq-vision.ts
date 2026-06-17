const GROQ_VISION_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export type ModoAnalise = 'drone' | 'visita' | 'animal' | 'servico'

const PROMPTS: Record<ModoAnalise, string> = {
  drone: `Você é um especialista em agricultura de precisão e sensoriamento remoto. Analise estas imagens aéreas de lavoura capturadas por drone e forneça:

1. **Estado Geral da Lavoura** — condição visual das plantas (verde uniforme, amarelamento, manchas, etc.)
2. **Áreas com Problema** — identifique zonas com estresse hídrico, pragas visíveis, doenças ou falhas de plantio
3. **Estimativa de Cobertura** — percentual aproximado da área com boa cobertura vegetal
4. **Alertas Prioritários** — liste em ordem de urgência os pontos que exigem atenção imediata
5. **Recomendação de Ação** — o que o produtor deve fazer nos próximos dias

Seja objetivo, use linguagem acessível ao produtor rural brasileiro. Cite cores, padrões e localizações visíveis nas imagens.`,

  visita: `Você é um agrônomo especialista. Analise estas imagens de visita técnica ao campo e produza um relatório estruturado com:

1. **Condição da Cultura** — estágio fenológico observado e estado fitossanitário
2. **Solo e Umidade** — aparência do solo, sinais de compactação, erosão ou encharcamento
3. **Pragas e Doenças** — identifique qualquer sintoma visual de ataque ou infecção
4. **Infraestrutura** — condição de cercas, estradas internas, canais de irrigação se visíveis
5. **Conclusão e Próximos Passos** — resumo da visita e ações recomendadas

Formato de relatório técnico. Inclua data de geração e observações objetivas.`,

  animal: `Você é um médico veterinário especialista em bovinos e produção animal. Analise as imagens do animal e avalie:

1. **Escore de Condição Corporal (ECC)** — nota de 1 a 5 com justificativa visual
2. **Estado Geral** — postura, pelagem, mucosas visíveis, sinais de hidratação
3. **Sinais de Alerta** — claudicação, lesões visíveis, abatimento, alterações comportamentais
4. **Conformação** — avaliação do desenvolvimento muscular e estrutural
5. **Recomendação** — necessidade de intervenção veterinária ou ajuste nutricional

Use terminologia técnica mas explique em linguagem acessível ao produtor.`,

  servico: `Você é um auditor de serviços agrícolas. Analise as imagens enviadas como comprovante de execução de serviço e verifique:

1. **Serviço Executado** — o que foi realizado é visível nas imagens?
2. **Qualidade da Execução** — cobertura uniforme, sem falhas, dentro do padrão esperado
3. **Área Coberta** — estimativa visual da área trabalhada
4. **Conformidade** — há evidências visuais de que o serviço foi concluído adequadamente?
5. **Laudo** — APROVADO, APROVADO COM RESSALVAS ou REPROVADO, com justificativa

Este laudo será usado como comprovante no AgroCore.`,
}

export interface VideoAnalysisResult {
  modo: ModoAnalise
  frames: number
  analise: string
  geradoEm: string
  modeloUsado: string
}

export async function analisarFrames(
  framesBase64: string[],
  modo: ModoAnalise
): Promise<VideoAnalysisResult> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY não configurada')

  const imageContent = framesBase64.map(b64 => ({
    type: 'image_url' as const,
    image_url: { url: `data:image/jpeg;base64,${b64}` },
  }))

  const res = await fetch(GROQ_VISION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPTS[modo] },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq Vision erro ${res.status}: ${err}`)
  }

  const data = await res.json()
  return {
    modo,
    frames: framesBase64.length,
    analise: data.choices[0].message.content as string,
    geradoEm: new Date().toISOString(),
    modeloUsado: GROQ_VISION_MODEL,
  }
}
