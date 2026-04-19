# 🌾 AGRO RATE
## Infraestrutura de Crédito do Agro Moderno

> **"A produção virou garantia."**

---

## 1. VISÃO DO PRODUTO

### O que é
AgroRate é a camada de inteligência financeira do ecossistema Agro — um sistema de pontuação (score) que transforma dados reais de produção em poder de crédito.

### O que NÃO é
- Não é um banco
- Não é uma fintech tradicional
- Não é apenas um score de crédito

### O que FAZ
- **Mede** capacidade produtiva real
- **Analisa** comportamento financeiro
- **Gera** score baseado em dados, não em papel
- **Libera** acesso a crédito com condições melhores

### Frase de posicionamento
> *"Aqui, crédito não é promessa. É dado."*

---

## 2. PROBLEMA QUE RESOLVE

### Cenário atual do crédito rural
```
BANCOS VÊM                    AGRORATE VÊ
─────────────────────────────────────────────────
Histórico limitado        →   Produção real
Burocracia extrema       →   Dados自动izados
Garantia física          →   Eficiência comprovada
Aprovação em semanas     →   Score em segundos
Juros uniformes          →   Juros por perfil
```

### Impacto
- **Produtor bom** → crédito fácil e barato
- **Produtor médio** → crédito acessível
- **Banco** → risco reduzido, inadimplência menor

---

## 3. COMO FUNCIONA

### Arquitetura de Dados (4 Camadas)

```
┌─────────────────────────────────────────────────────────┐
│                    🌐 AGRO RATE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   CAMADA 1  │    │   CAMADA 2  │    │   CAMADA 3  │ │
│  │    DADOS    │    │    DADOS    │    │    DADOS    │ │
│  │ OPERACIONAIS│    │ EXECUÇÃO    │    │ GEOFÍSICOS  │ │
│  │             │    │             │    │             │ │
│  │ • Fluxo caixa│    │ • Serviços │    │ • NDVI      │ │
│  │ • Custos    │    │ • Produção  │    │ • Clima     │ │
│  │ • Insumos   │    │ • Frequência│    │ • Solo      │ │
│  │ • Manutenção│    │ • Eficiência│    │ • Histórico │ │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            ▼                            │
│                   ┌─────────────────┐                   │
│                   │     CAMADA 4     │                   │
│                   │   INTELIGÊNCIA  │                   │
│                   │   COMPARATIVA   │                   │
│                   │                 │                   │
│                   │ • Benchmark     │                   │
│                   │ • Eficiência    │                   │
│                   │ • Tendência     │                   │
│                   └────────┬────────┘                   │
│                            ▼                            │
│                   ┌─────────────────┐                   │
│                   │      SCORE      │                   │
│                   │    (0 - 1000)    │                   │
│                   └─────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Fontes de Dados

| Fonte | Dados | Origem |
|-------|-------|--------|
| **AgroOS** | Fluxo de caixa, custos, receitas | Gestor financeiro |
| **AgroCore** | Serviços, produtividade, frequência | Execução de campo |

---

## 4. ALGORITMO DE SCORE

### Componentes do Score

```
AGRO RATE = ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PRODUÇÃO (30%)
  ├── Volume produzido vs. área
  ├── Qualidade da produção
  └── Histórico de safras

  EFICIÊNCIA (25%)
  ├── Custo por hectare
  ├── Margem bruta
  └── Produtividade vs. benchmark

  COMPORTAMENTO (25%)
  ├── Pontualidade de pagamentos
  ├── Histórico de débitos
  └── Giro de fornecedores

  OPERACIONAL (20%)
  ├── Frequência de uso do sistema
  ├── Completude de dados
  └── Regularidade de registros
```

### Fórmula Base

```typescript
scoreFinal = (
  pontuacaoProducao * 0.30 +
  pontuacaoEficiencia * 0.25 +
  pontuacaoComportamento * 0.25 +
  pontuacaoOperacional * 0.20
) * 1000
```

### Faixas de Score

| Score | Perfil | Condições |
|-------|--------|-----------|
| 900-1000 | Elite | Juros mínimos, limites altos |
| 750-899 | Alto | Juros baixos, aprovação rápida |
| 600-749 | Bom | Juros padrões, aprovação normal |
| 450-599 | Regular | Juros elevados, garantias |
| 300-449 | Baixo | Crédito limitado |
| 0-299 | Crítico | Análise manual obrigatória |

---

## 5. MODELOS DE MONETIZAÇÃO

### Modelo 1: Venda de Leads (IMEDIATO)
```
Banco paga por produtor qualificado
└── Score > 800: R$ 50-100/lead
└── Score > 700: R$ 30-50/lead
└── Score > 600: R$ 10-30/lead
```

### Modelo 2: Taxa por Crédito Aprovado (MÉDIO PRAZO)
```
% sobre valor financiado
└── 0.5% a 2% do valor do crédito
```

### Modelo 3: Antecipação de Recebíveis (MÉDIO PRAZO)
```
Produtor antecipa pagamento de serviço
└── Taxa: 2-5% ao mês
└── Plataforma fica com spread
```

### Modelo 4: White-label / API (LONGO PRAZO)
```
Bancos usam nosso score em seus sistemas
└── Assinatura mensal: R$ 5.000-50.000/mês
└── Por consulta: R$ 0.50-5.00/consulta
```

### Modelo 5: Marketplace de Crédito (LONGO PRAZO)
```
Produtor escolhe melhor oferta
└── Comissão: 0.5-1% do valor contratado
└── Destaque pago: R$ 100-500/visualização
```

---

## 6. ESTRATÉGIA DE ENTRADA NO MERCADO

### Fase 1: Validação (Meses 1-3)
```
✓ Integrar AgroRate no AgroOS existente
✓ Mostrar score para usuários atuais
✓ Simular crédito (sem integração real)
✓ Coleta de dados sem atrito
```

### Fase 2: Primeiras Parcerias (Meses 4-6)
```
✓ Fechar com 1 cooperativa ou banco regional
✓ Integração manual (CSV/planilha)
✓ Geração de primeiras comissões
✓ Validação do modelo
```

### Fase 3: Escala (Meses 7-12)
```
✓ Múltiplos parceiros financeiros
✓ API de integração
✓ Comparador de crédito no app
✓ Dashboard para instituições
```

### Fase 4: Domínio (Ano 2+)
```
✓ Carteira digital (BaaS)
✓ Crédito próprio via parceiro
✓ Antecipação de recebíveis
✓ Expansão nacional
```

---

## 7. INTEGRAÇÃO COM ECOSSISTEMA

```
┌─────────────────────────────────────────────────────────┐
│                      ECOSSISTEMA AGRO                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐     │
│   │ AGROCORE │ ───▶ │  AGROOS  │ ───▶ │ AGORATE  │     │
│   │          │      │          │      │          │     │
│   │ Execução │      │ Gestão   │      │ Crédito  │     │
│   │          │      │ Financeiro│     │          │     │
│   └──────────┘      └──────────┘      └──────────┘     │
│        │                 │                 │           │
│        │                 │                 │           │
│        ▼                 ▼                 ▼           │
│   ┌─────────────────────────────────────────────┐      │
│   │              DADOS COMPARTILHADOS           │      │
│   │  • Produtividade    • Fluxo de caixa        │      │
│   │  • Serviços         • Custos                 │      │
│   │  • Área cultivada   • Pagamentos            │      │
│   └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Dados
1. **AgroCore** coleta dados de execução → `producao`, `servicos`, `produtividade`
2. **AgroOS** processa financials → `caixa`, `custos`, `pagamentos`
3. **AgroRate** analisa e gera score → `score`, `perfil`, `recomendacoes`

---

## 8. PÚBLICO-ALVO

### Primário (Onde está o produto)
- Produtores rurais de médio porte
- Produtores que já usam AgroOS/AgroCore

### Secundário (Onde está o dinheiro)
- Cooperativas agrícolas
- Bancos (Banco do Brasil, Sicredi, Sicoob)
- Fintechs de crédito rural

### Terciário (Escala)
- Investidores e fundos
- Seguradoras agrícolas
- Empresas de insumos

---

## 9. DIFERENCIAL COMPETITIVO

### vs. Sistema Bancário Tradicional
| Tradicional | AgroRate |
|-------------|----------|
| Olha passado | Olha produção real |
| Olha papel | Olha comportamento |
| Olha garantia | Olha eficiência |
| Sem granularidade | Score dinâmico |

### vs. Fintechs de Crédito
| Fintechs | AgroRate |
|---------|----------|
| Score genérico | Score específico do agro |
| Dados externos | Dados primários do produtor |
| Aprovação lenta | Score em tempo real |
| Juros altos | Juros por perfil |

---

## 10. BARREIRA DE ENTRADA (MOAT)

### Por que o cliente não sai?

```
ANO 1: Produtor entra no sistema
         │
         ▼
   Usa AgroCore + AgroOS
   Construindo histórico
         │
         ▼
ANO 2: Score AgroRate = 850
         │
         ▼
   "Quer sair? Perde seu score."
         │
         ▼
   Volta a ser "desconhecido" no mercado
         │
         ▼
   FIELIDADE DE 5+ ANOS
```

### Meta de dados que aumenta com tempo
- Histórico de produção (safras)
- Comportamento financeiro (meses)
- Eficiência comparativa (anos)
- Tendência de crescimento

---

## 11. MÉTRICAS DE SUCESSO

### Produto
- Número de scores gerados
- Precisão do score (% de adimplência por faixa)
- Tempo de geração de score

### Negócio
- MRR (Receita Recorrente Mensal)
- CAC (Custo de Aquisição de Cliente)
- LTV (Valor do Tempo de Vida)
- Taxa de conversão de leads em crédito

### Impacto
- Volume de crédito facilitado
- Redução de inadimplência para parceiros
- Satisfação do produtor (% de bons clientes)

---

## 12. PRÓXIMOS PASSOS DE DESENVOLVIMENTO

### Semana 1-2: MVP Técnico
- [ ] Schema Prisma do AgroRate
- [ ] Algoritmo de score básico
- [ ] Página de score no dashboard
- [ ] Mockups de integração bancária

### Semana 3-4: Validação
- [ ] Teste com usuários actuales
- [ ] Ajustes no algoritmo
- [ ] Primeiro pitch para cooperativa

### Mês 2: Lançamento Beta
- [ ] Score visível para todos
- [ ] Simulador de crédito
- [ ] Integração com 1 parceiro

---

## CONTATO / DÚVIDAS

Documento vivo — atualizar conforme evolução do produto.
