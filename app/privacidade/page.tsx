import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — SmartAgroOS',
  description: 'Como o SmartAgroOS coleta, usa e protege seus dados, em conformidade com a LGPD.',
}

const SECOES = [
  {
    titulo: '1. Quem somos',
    texto: 'O SmartAgroOS é o sistema operacional da fazenda desenvolvido pela OryonAG. Para contato sobre dados pessoais, escreva para: privacidade@oryonag.com.br',
  },
  {
    titulo: '2. Dados que coletamos',
    itens: [
      'Nome e e-mail (cadastro e autenticação)',
      'CPF (verificação KYC para funcionalidades financeiras)',
      'Dados da propriedade rural (área, localização, talhões)',
      'Registros operacionais inseridos pelo usuário (atividades, financeiro, pecuária, aquicultura)',
      'Dados de localização GPS (somente quando o AgroNav estiver em uso e com permissão concedida)',
      'Dados de uso da plataforma (logs de acesso para segurança e melhorias)',
    ],
  },
  {
    titulo: '3. Como usamos seus dados',
    itens: [
      'Autenticação e controle de acesso à plataforma',
      'Geração de relatórios e análises da sua fazenda',
      'Funcionamento dos módulos de IA (AgroGPT, alertas, diagnósticos)',
      'Cálculo de score AgroRate (quando solicitado)',
      'Cumprimento de obrigações legais e regulatórias',
    ],
  },
  {
    titulo: '4. Base legal (LGPD)',
    itens: [
      'Execução de contrato: dados necessários para oferecer o serviço contratado',
      'Legítimo interesse: melhorias de produto, segurança da plataforma',
      'Consentimento: dados de localização GPS e comunicações de marketing',
      'Cumprimento de obrigação legal: dados fiscais e regulatórios',
    ],
  },
  {
    titulo: '5. Compartilhamento',
    texto: 'Seus dados não são vendidos. Compartilhamos apenas com fornecedores de infraestrutura (Supabase/PostgreSQL para banco de dados, Vercel para hospedagem, Groq para processamento de IA) sob contratos de confidencialidade, e quando exigido por lei.',
  },
  {
    titulo: '6. Retenção',
    texto: 'Mantemos seus dados enquanto sua conta estiver ativa. Após solicitação de exclusão, removemos os dados em até 30 dias, exceto quando obrigados a retê-los por lei (ex.: registros fiscais por 5 anos).',
  },
  {
    titulo: '7. Seus direitos (LGPD — Art. 18)',
    itens: [
      'Confirmação da existência de tratamento',
      'Acesso aos dados que temos sobre você',
      'Correção de dados incompletos ou desatualizados',
      'Anonimização ou exclusão de dados desnecessários',
      'Portabilidade dos seus dados',
      'Revogação do consentimento a qualquer momento',
      'Exclusão completa da conta e dados',
    ],
  },
  {
    titulo: '8. Cookies',
    texto: 'Usamos cookies essenciais para autenticação (gerenciados pelo Supabase com HttpOnly e Secure) e cookies de preferência (tema, idioma) armazenados localmente. Não usamos cookies de rastreamento publicitário.',
  },
  {
    titulo: '9. Segurança',
    texto: 'Aplicamos criptografia em trânsito (HTTPS/TLS), autenticação via Supabase Auth, controle de acesso por nível de usuário e monitoramento de atividades suspeitas. Em caso de incidente, notificamos os afetados em até 72 horas.',
  },
  {
    titulo: '10. Contato e exclusão de dados',
    texto: 'Para exercer seus direitos, solicitar exclusão de conta ou tirar dúvidas: privacidade@oryonag.com.br. Respondemos em até 15 dias úteis.',
  },
]

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#f1f5f9', padding: '48px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, textDecoration: 'none', marginBottom: 32 }}>
          ← Voltar
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#16a34a,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1 }}>Política de Privacidade</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>SmartAgroOS · Última atualização: junho de 2026</p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, marginTop: 20, padding: '16px 20px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 12 }}>
          Esta política é parte do nosso compromisso com a <strong style={{ color: '#4ade80' }}>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>. Leia com atenção para entender como seus dados são tratados.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {SECOES.map(s => (
            <section key={s.titulo}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{s.titulo}</h2>
              {s.texto && <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.75, margin: 0 }}>{s.texto}</p>}
              {s.itens && (
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.itens.map(item => (
                    <li key={item} style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: '20px 24px', background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)', borderRadius: 14 }}>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            Para solicitar <strong style={{ color: '#38bdf8' }}>exclusão de conta e dados</strong>, envie um e-mail para{' '}
            <a href="mailto:privacidade@oryonag.com.br" style={{ color: '#38bdf8' }}>privacidade@oryonag.com.br</a>{' '}
            com o assunto "Exclusão de Dados — SmartAgroOS". Processamos em até 30 dias.
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#475569', marginTop: 32, textAlign: 'center' }}>
          SmartAgroOS · OryonAG · CNPJ em processo de regularização · privacidade@oryonag.com.br
        </p>
      </div>
    </div>
  )
}
