const BASE_URL = 'https://app.clicksign.com/api/v1'
const TOKEN = process.env.CLICKSIGN_API_TOKEN

export function isClicksignConfigured() {
  return !!TOKEN
}

async function cs(path: string, method = 'GET', body?: object) {
  const url = `${BASE_URL}${path}?access_token=${TOKEN}`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Clicksign ${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

function buildDocumentContent(params: {
  title: string
  produtor: string
  cpf: string
  propriedade: string
  tipoToken: string
  valorTotal: number
  totalTokens: number
  tokenPrice: number
  retorno?: number
  prazoMeses?: number
  taxaOriginacao: number
  taxaSucesso: number
}): string {
  const now = new Date().toLocaleDateString('pt-BR')
  return `
TERMO DE EMISSÃO DE TOKEN AGRÍCOLA — AgroToken

Data: ${now}

EMISSOR
Nome: ${params.produtor}
CPF: ${params.cpf}
Propriedade: ${params.propriedade}

DADOS DO TOKEN
Título: ${params.title}
Tipo de Ativo: ${params.tipoToken}
Valor Total do Ativo: R$ ${params.valorTotal.toLocaleString('pt-BR')}
Quantidade de Tokens: ${params.totalTokens.toLocaleString('pt-BR')} tokens
Preço por Token: R$ ${params.tokenPrice.toLocaleString('pt-BR')}
${params.retorno ? `Rendimento Esperado: ${params.retorno}% ao período` : ''}
${params.prazoMeses ? `Prazo: ${params.prazoMeses} meses` : ''}

TAXAS DA PLATAFORMA
Taxa de Originação: ${params.taxaOriginacao}% (cobrada na aprovação)
Taxa de Sucesso: ${params.taxaSucesso}% (cobrada na liquidação)

DECLARAÇÕES DO EMISSOR
O emissor declara que:
1. As informações sobre o ativo são verídicas e de sua responsabilidade;
2. Está ciente das exigências da CVM Resolução 88 para tokens de investimento;
3. Concorda com os Termos de Uso da plataforma AgroToken;
4. Entende que esta emissão está em fase piloto sem registro em blockchain (etapa futura);
5. Autoriza a AgroToken a verificar os dados apresentados.

Ao assinar este documento digitalmente, o emissor confirma todas as declarações acima.

PLATAFORMA
AgroToken — Tokenização de Ativos Agrícolas
Desenvolvido por Ecossistema Agro
`.trim()
}

export async function createSignatureRequest(params: {
  title: string
  produtor: string
  cpf: string
  email: string
  phone?: string
  propriedade: string
  tipoToken: string
  valorTotal: number
  totalTokens: number
  tokenPrice: number
  retorno?: number
  prazoMeses?: number
}): Promise<{ docKey: string; signerKey: string; signatureUrl: string }> {

  const content = buildDocumentContent({
    ...params,
    taxaOriginacao: 2,
    taxaSucesso: 3,
  })

  const contentBase64 = Buffer.from(content, 'utf-8').toString('base64')
  const deadlineAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Upload do documento
  const docRes = await cs('/documents', 'POST', {
    document: {
      path: `/agrotoken/${params.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`,
      content_base64: `data:text/plain;base64,${contentBase64}`,
      deadline_at: deadlineAt,
      auto_close: true,
      locale: 'pt-BR',
      sequence_enabled: false,
    },
  })
  const docKey: string = docRes.document.key

  // 2. Cria o signatário (o produtor)
  const signerRes = await cs('/signers', 'POST', {
    signer: {
      email: params.email,
      phone_number: params.phone ?? '',
      name: params.produtor,
      documentation: params.cpf,
      has_documentation: true,
      delivery: 'email',
      official_document_enabled: false,
    },
  })
  const signerKey: string = signerRes.signer.key

  // 3. Vincula signatário ao documento
  const listRes = await cs('/lists', 'POST', {
    list: {
      document_key: docKey,
      signer_key: signerKey,
      sign_as: 'approve',
      message: `Olá ${params.produtor}, por favor assine o Termo de Emissão do seu token agrícola "${params.title}" na plataforma AgroToken.`,
    },
  })

  // 4. Notifica por email
  await cs('/notifications', 'POST', {
    message: {
      document_key: docKey,
      signer_key: signerKey,
    },
  })

  return {
    docKey,
    signerKey,
    signatureUrl: listRes.list.url ?? `https://app.clicksign.com/sign/${listRes.list.key}`,
  }
}

export async function getDocumentStatus(docKey: string): Promise<{
  status: string
  signedAt?: string
}> {
  const res = await cs(`/documents/${docKey}`)
  const doc = res.document
  return {
    status: doc.status,
    signedAt: doc.finished_at ?? undefined,
  }
}
