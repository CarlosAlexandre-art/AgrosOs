import Link from 'next/link'

export const metadata = {
  title: 'Termos de Serviço e Política de Privacidade — OryonAG / SmartAgroOS',
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
    <div className="space-y-3 text-slate-600 text-sm leading-relaxed">{children}</div>
  </section>
)

export default function TermosPage() {
  const updated = '13 de maio de 2026'

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0b1120] text-white py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-[#22c55e] text-xs font-bold uppercase tracking-widest mb-3">OryonAG · Ecossistema Agro</div>
          <h1 className="text-3xl font-bold mb-2">Termos de Serviço e Política de Privacidade</h1>
          <p className="text-slate-400 text-sm">Última atualização: {updated}</p>
        </div>
      </div>

      {/* Aviso Piloto */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm text-amber-800">
            <strong>Plataforma em fase piloto.</strong> O SmartAgroOS e o AgroToken estão em operação experimental.
            As funcionalidades, tarifas e condições descritas neste documento podem ser alteradas com aviso prévio de 15 dias.
            Este piloto <strong>não constitui oferta pública de valores mobiliários registrada na CVM</strong> — operamos sob
            volume máximo de R$ 100.000 por oferta e comunicação restrita, enquanto buscamos o enquadramento regulatório adequado.
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-6 py-12">

        <Section title="1. Identificação da Empresa">
          <p>
            O SmartAgroOS e o AgroToken são produtos da <strong>OryonAG</strong>, plataforma digital do agronegócio brasileiro.
            Para suporte e questões legais, entre em contato pelo e-mail:{' '}
            <a href="mailto:contato@oryon.ag" className="text-[#16a34a] underline">contato@oryon.ag</a>.
          </p>
          <p>
            O acesso à plataforma implica a aceitação integral destes Termos de Serviço. Caso não concorde com qualquer
            cláusula, não utilize os serviços.
          </p>
        </Section>

        <Section title="2. Descrição dos Serviços">
          <p>
            O SmartAgroOS oferece ferramentas operacionais para gestão agrícola, incluindo: mapeamento geoespacial,
            rastreamento de bovinos (BovTrace/Embrapa), análise de solo (SmartSolosExpert/Embrapa), inventário
            florestal (Netflora/Embrapa), monitoramento climático e gestão de atividades rurais.
          </p>
          <p>
            O <strong>AgroToken</strong> é um módulo experimental que permite a tokenização de ativos rurais (safras,
            materiais e maquinário) para captação de recursos. Trata-se de um produto em fase piloto sujeito à
            supervisão regulatória.
          </p>
        </Section>

        <Section title="3. AgroToken — Riscos e Limitações do Piloto">
          <p className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            ⚠️ LEIA COM ATENÇÃO: O AgroToken é um produto experimental. Investimentos em tokens de ativos rurais
            envolvem riscos significativos, incluindo perda total do capital investido.
          </p>
          <p><strong>Riscos principais:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Risco de inadimplência do produtor rural</li>
            <li>Risco climático, pragas ou perdas de safra</li>
            <li>Risco de liquidez — tokens não possuem mercado secundário neste piloto</li>
            <li>Risco regulatório — o enquadramento jurídico dos tokens está em definição</li>
            <li>O colateral físico (fazenda, maquinário) <strong>não foi auditado in loco</strong> pela OryonAG</li>
          </ul>
          <p>
            <strong>Limites do piloto:</strong> Cada oferta é limitada a R$ 100.000. Verificação de identidade (KYC/CPF)
            e número CAR são obrigatórios para emissão de tokens. A OryonAG cobra 2% de taxa de originação na aprovação
            e 3% sobre o valor captado no resgate.
          </p>
          <p>
            A OryonAG não é banco, corretora, ou instituição financeira regulada. Não garantimos retorno,
            liquidez ou viabilidade de qualquer oferta listada na plataforma.
          </p>
        </Section>

        <Section title="4. Cadastro e KYC">
          <p>
            O acesso ao AgroToken exige verificação de identidade (CPF) via API do Governo Federal. O usuário declara
            que as informações fornecidas são verdadeiras e se responsabiliza por qualquer fraude decorrente de dados
            falsos, sujeitando-se às sanções civis e criminais previstas em lei.
          </p>
          <p>
            O Cadastro Ambiental Rural (CAR) informado na criação de tokens é de responsabilidade exclusiva do produtor.
            A OryonAG não audita o CAR automaticamente — a verificação pode ser feita no{' '}
            <a href="https://www.car.gov.br/publico/imoveis/index" target="_blank" rel="noopener" className="text-[#16a34a] underline">
              Portal SICAR
            </a>.
          </p>
        </Section>

        <Section title="5. Pagamentos e Tarifas">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Taxa de originação AgroToken:</strong> 2% do valor total da oferta, cobrada na aprovação</li>
            <li><strong>Taxa de sucesso:</strong> 3% do valor captado, cobrada no resgate</li>
            <li><strong>Taxa de compra:</strong> 2% sobre o valor da transação, cobrada ao investidor</li>
            <li><strong>Plano Pro SmartAgroOS:</strong> R$ 89/mês ou conforme tabela vigente</li>
          </ul>
          <p>
            Pagamentos processados via <strong>Stripe</strong>. Em caso de estorno, a OryonAG seguirá a política de
            disputas do Stripe. Tarifas não são reembolsáveis após execução da operação.
          </p>
        </Section>

        <Section title="6. Política de Privacidade (LGPD)">
          <p>
            Esta seção descreve como a OryonAG coleta, usa e protege seus dados pessoais, em conformidade com a
            Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).
          </p>

          <p><strong>6.1 Dados coletados:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome, e-mail, CPF, telefone (cadastro)</li>
            <li>Dados geográficos (coordenadas GPS da fazenda)</li>
            <li>Dados de uso da plataforma (logs de acesso, funcionalidades usadas)</li>
            <li>Dados financeiros (transações AgroToken, histórico de pagamentos)</li>
            <li>Imagens enviadas (análise de solo, inventário florestal) — armazenadas temporariamente</li>
          </ul>

          <p><strong>6.2 Finalidade do tratamento:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Prestação dos serviços contratados</li>
            <li>Verificação de identidade (KYC/anti-fraude)</li>
            <li>Processamento de pagamentos</li>
            <li>Comunicações sobre o serviço (não enviamos spam)</li>
            <li>Cumprimento de obrigações legais e regulatórias</li>
          </ul>

          <p><strong>6.3 Compartilhamento de dados:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — banco de dados (servidores na região US East)</li>
            <li><strong>Stripe</strong> — processamento de pagamentos</li>
            <li><strong>Embrapa</strong> — APIs de análise agronômica (dados enviados anonimizados)</li>
            <li>Não vendemos dados pessoais a terceiros</li>
          </ul>

          <p><strong>6.4 Seus direitos (Art. 18 LGPD):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acesso, correção e portabilidade dos seus dados</li>
            <li>Exclusão dos dados (mediante solicitação — exceto quando há obrigação legal de retenção)</li>
            <li>Revogação do consentimento</li>
            <li>Informação sobre compartilhamento</li>
          </ul>
          <p>
            Para exercer seus direitos, envie solicitação para{' '}
            <a href="mailto:privacidade@oryon.ag" className="text-[#16a34a] underline">privacidade@oryon.ag</a>.
          </p>

          <p><strong>6.5 Retenção de dados:</strong> mantemos dados pelo prazo necessário à prestação do serviço
          e por 5 anos após o encerramento da conta, conforme exigências fiscais e legais brasileiras.</p>

          <p><strong>6.6 Cookies:</strong> utilizamos cookies de sessão para autenticação. Não utilizamos cookies
          de rastreamento publicitário.</p>
        </Section>

        <Section title="7. Propriedade Intelectual">
          <p>
            Todo o conteúdo da plataforma (código, design, marca OryonAG, SmartAgroOS, AgroToken) é de propriedade
            da OryonAG. É vedada a reprodução, modificação ou distribuição sem autorização prévia por escrito.
          </p>
          <p>
            As APIs da Embrapa (BovTrace, SmartSolosExpert, AGROFIT, Netflora) são de propriedade da Empresa
            Brasileira de Pesquisa Agropecuária e utilizadas sob seus respectivos termos de uso.
          </p>
        </Section>

        <Section title="8. Limitação de Responsabilidade">
          <p>
            A OryonAG não se responsabiliza por: (i) perdas decorrentes de investimentos em AgroToken;
            (ii) imprecisões nas análises das APIs Embrapa; (iii) interrupções de serviço por força maior
            ou falhas de terceiros (Supabase, Stripe, Vercel); (iv) decisões agrícolas ou financeiras tomadas
            com base nas ferramentas da plataforma.
          </p>
          <p>
            As ferramentas do SmartAgroOS são de suporte à decisão — não substituem laudos técnicos,
            assessoria agronômica profissional ou consultoria financeira especializada.
          </p>
        </Section>

        <Section title="9. Foro e Lei Aplicável">
          <p>
            Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de São Paulo/SP
            para dirimir quaisquer controvérsias, renunciando as partes a qualquer outro, por mais privilegiado
            que seja.
          </p>
        </Section>

        <Section title="10. Contato e Encarregado de Dados (DPO)">
          <p>
            Para dúvidas sobre estes Termos ou sua privacidade:
          </p>
          <ul className="list-none space-y-1">
            <li>📧 <a href="mailto:contato@oryon.ag" className="text-[#16a34a] underline">contato@oryon.ag</a></li>
            <li>🔒 <a href="mailto:privacidade@oryon.ag" className="text-[#16a34a] underline">privacidade@oryon.ag</a> (assuntos LGPD)</li>
          </ul>
        </Section>

        <div className="border-t border-slate-200 pt-8 text-center">
          <p className="text-xs text-slate-400 mb-4">
            Ao utilizar a plataforma OryonAG / SmartAgroOS, você declara ter lido, compreendido e
            concordado com estes Termos de Serviço e Política de Privacidade.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="text-sm text-[#16a34a] hover:underline">← Página inicial</Link>
            <Link href="/dashboard" className="text-sm text-[#16a34a] hover:underline">Acessar plataforma →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
