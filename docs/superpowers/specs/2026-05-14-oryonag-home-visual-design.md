# OryonAG Home — Visual Design Spec
## Minimalista-Sofisticado (Abordagem B)

**Data:** 2026-05-14  
**Projeto:** Landing Page Premium — OryonAG Ecossistema  
**Objetivo:** Home institucional que comunica excelência técnica através de minimalismo sofisticado  
**Status:** Design em Desenvolvimento

---

## 1. FILOSOFIA DE DESIGN

**Inspiração:** UnBound X + Salo + Immersive Garden

- ✅ Minimalismo sofisticado — espaço em branco generoso, sem poluição
- ✅ Tipografia protagonista — títulos grandes, assertivos, ocupam espaço
- ✅ Imagens/vídeos reais — conteúdo visual é o destaque, não efeitos
- ✅ Animações sutis — movimento elegante, não cinematográfico
- ✅ Hierarquia cristalina — sempre claro o que é importante

**Tom de Voz Visual:**  
"Parceiro tecnológico sério, mas acessível ao produtor rural. Elegância através da clareza."

---

## 2. ESTRUTURA DE SEÇÕES (13 total)

```
1. NAVBAR FIXA
2. HERO SECTION (Abordagem B: Split 60/40)
3. ECOSSISTEMA (Os 3 pilares conectados)
4. AGROCORE (Marketplace)
5. SMARTAGROOS (Sistema da Fazenda)
6. AGRORATE (Score de Crédito)
7. INTELLIGENCE HUB (15 módulos IA)
8. AGROTOKEN (Tokenização)
9. PLANOS (Comparação)
10. MÉTRICAS (Impacto social/ambiental)
11. FAQ
12. CTA FINAL
13. FOOTER
```

---

## 3. HERO SECTION — Split Layout 60/40

### Layout Desktop
```
┌────────────────────────┬──────────────────┐
│                        │                  │
│  60% — Vídeo           │  40% — 3D Map    │
│  Agrícola Loop         │  + Texto Center  │
│  (sem som)             │                  │
│                        │                  │
│  Cenas:                │  Navbar overlay  │
│  • Amanhecer           │  Label + H1      │
│  • Drone aerial        │  Subtítulo       │
│  • Colheita/máquina    │  CTA primário    │
│                        │  3 CTAs mini     │
│                        │  Stats bar       │
└────────────────────────┴──────────────────┘
```

### Tipografia Hero
- **Label:** DM Mono, 11px, #4ade80, pulsing dot
- **H1:** Fraunces 900, 96px, clamp(48-96), #f0fdf4
  - Palavra "conecta" com gradiente verde animado
- **Subtítulo:** DM Sans 300, 18px, clamp(16-20), #4a7c5c
- **CTAs Primário:** DM Sans 600, 14px, bg-#22c55e, hover scale + glow
- **CTAs Mini:** DM Sans 500, 12px, text-#4ade80, hover underline

### Animações Hero
- Fade in: 1s ease-out
- Vídeo parallax: -5% Y ao scroll
- Texto stagger: 0.12s, 0.28s, 0.4s de delay
- Stats bar count-up: 2s linear
- 3D mapa: rotação contínua 45s + mouse follow com lerp 0.1s

### Responsive
- **Desktop (1024+):** Split 60/40 lado a lado
- **Tablet (768-1023):** Stack vídeo 100%, 3D mini 20% tamanho, canto inf-dir
- **Mobile (<768):** Stack completo, 3D 120px² corner, fonte -20%

---

## 4. SEÇÕES ABAIXO DO HERO — Padrão Visual

### Padrão Geral de Seção
```
[Espaço em branco generoso]

┌─────────────────────────────────────┐
│ Título em Fraunces 72px bold        │
│ Em maiúscula parcial ou normal      │
│                                     │
│ Subtítulo em DM Sans 18px #4a7c5c  │
│ (máx 2 linhas, explicando valor)   │
└─────────────────────────────────────┘

[Espaço]

Conteúdo específico da seção
(varia por seção)

[Espaço em branco]
```

### Animações Padrão (Scroll)
- **Entrance:** Fade in + slide up 40px (0.6s ease-out)
- **Trigger:** Intersection Observer (elemento 30% visível na tela)
- **Delay:** Stagger 0.1s entre cards/items
- **Parallax leve:** Imagem -10% Y, texto normal (sutileza)

### Cores por Seção
- **Bg:** Alternância #020c05 (main) e #0d1f0d (accent dark)
- **Texto:** Branco #ffffff, muted #4a7c5c, accent #4ade80
- **Borders:** #22c55e/20 opacity (sutil)

---

## 5. SEÇÃO "ECOSSISTEMA" — Layout Específico

### Visual
```
┌─────────────────────────────────────┐
│  [Diagrama/Animação 3D]             │
│  Mostra conexão entre os 3 produtos │
│  Centro: Logo OryonAG               │
│  Linhas animadas conectando         │
└─────────────────────────────────────┘
```

### Cards dos 3 Produtos
Grid 3 colunas (desktop), 1 coluna (mobile)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ [Ícone]     │ │ [Ícone]     │ │ [Ícone]     │
│             │ │             │ │             │
│ AgroCore    │ │ SmartAgroOS │ │ AgroRate    │
│ Marketplace │ │ Sistema ERP │ │ Score Créd. │
│             │ │             │ │             │
│ 2 linhas    │ │ 2 linhas    │ │ 2 linhas    │
│ descrição   │ │ descrição   │ │ descrição   │
│             │ │             │ │             │
│ Saiba mais →│ │ Saiba mais →│ │ Saiba mais →│
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## 6. SEÇÃO "AGROCORE" — Layout Específico

### Estrutura
```
[Espaço]

Título: "Contrate serviços rurais com inteligência"
Subtítulo: "Marketplace com IA que conecta produtores e prestadores"

[Espaço]

Fluxo Visual em 5 ícones:
[ Solicitar ] → [ Match ] → [ Proposta ] → [ Executar ] → [ Avaliar ]

[Espaço]

Grid 3 colunas de 6 tipos de serviço:
Pulverização | Colheita | Drone | Topografia | Análise Solos | Consultoria

Cada card:
[Imagem real do serviço]
Nome do serviço
Badge "Verificado" / "Top Avaliado"

[Espaço]

Social proof:
"⭐ 4.9/5 | 15.000+ serviços realizados"

[CTA]
"Solicitar serviço grátis →"
```

### Imagens
- Fotos REAIS de campo — produtor em pé na lavoura, drone sobrevoando, colheita em ação
- Não usar stock genérico — usar imagens que remetem ao Brasil

---

## 7. SEÇÃO "SMARTAGROOS" — Layout Específico

### Estrutura
```
Título: "O sistema nervoso da sua fazenda"

[Espaço]

[Screenshot real do dashboard SmartAgroOS]
(Imagem em full-width com border sutil)

[Espaço]

"Gerene suas propriedades, atividades, financeiro e gado — tudo integrado."

[Espaço]

Grid 4 colunas dos módulos (com categorias):

OPERACIONAL | FINANCEIRO | GEOESPACIAL | PECUÁRIA IA
─────────────────────────────────────────────────────
Dashboard  | Receitas   | Mapa       | AgroVet (★)
Atividades | Custos     | UTM        | NutriBov (★)
Campos     | Margens    | LiDAR      | AgroGrade (★)
Equipe     | Relatórios | Satélite   | AgroTrade (★)
Metas      | Análise    | NDVI       | ...

(★ = Destacado com chip verde "QUBO")

[CTA]
"Começar grátis →"
```

---

## 8. SEÇÃO "AGRORATE" — Layout Específico

### Estrutura
```
Título: "Acesse crédito rural com o score da sua fazenda"

[Espaço]

[Gauge animado do score — visual protagonista]
Score: 650 (visual progress bar)

[Espaço]

"O score é calculado por:"
- 60% Dados operacionais da fazenda
- 20% Seu perfil
- 10% Documentação
- 10% Comportamento

[Espaço]

"13 linhas de crédito disponíveis:"
[Grid 4x3 ou carrossel das linhas — logos ou nomes]

[CTA]
"Ver meu score →"
```

---

## 9. SEÇÃO "INTELLIGENCE HUB" — Layout Específico

### Estrutura
```
Bg escuro: #020c05

Título: "15 módulos de IA"
Subtítulo: "Algoritmos quânticos trabalhando pela sua fazenda"

[Espaço]

"O que é QUBO?"
Explicação em 2 linhas curtas sobre computação quântica simulada.

[Espaço]

Grid 3 colunas agrupado por produto:
┌─────────────────────────────────────┐
│ SmartAgroOS (7 módulos)             │
├─────────────────────────────────────┤
│ • RAPIDS Pipeline                   │
│ • Due Diligence AgroToken           │
│ • QUBO Token Pricing                │
│ • SafraPlanner QUBO                 │
│ • ET₀ Hídrico                       │
│ • Monitoramento 24h                 │
│ • Sistema de Tier                   │
└─────────────────────────────────────┘
[Similar para AgroCore e AgroRate]

[Espaço]

Chips de algoritmos na base:
[ QUBO SA ] [ Markowitz ] [ Logistic Reg ] [ ET₀ FAO-56 ] [ TSP ] [ NVIDIA NIM ]

[CTA]
"Explorar Intelligence Hub →"
```

---

## 10. CORES E TIPOGRAFIA REFERÊNCIA

| Elemento | Font | Tamanho | Peso | Cor |
|----------|------|---------|------|-----|
| H1 (títulos seções) | Fraunces | 72px clamp(48-96) | 900 | #ffffff |
| H2 (subtítulos) | DM Sans | 18px clamp(16-20) | 300 | #4a7c5c |
| Body | DM Sans | 16px | 400 | #ffffff |
| Label/Eyebrow | DM Mono | 11px | 500 | #4ade80 |
| CTA texto | DM Sans | 14px | 600 | #020c05 (dark) ou #4ade80 (light) |

| Cor | Uso |
|-----|-----|
| #020c05 | Bg principal (muito escuro, quase preto) |
| #0d1f0d | Bg alternado (verde muito escuro) |
| #22c55e | CTA, accent primário, borders visuais |
| #4ade80 | Neon, labels, hover effects |
| #86efac | Gradiente em títulos |
| #f0fdf4 | Texto branco/light |
| #4a7c5c | Texto muted/secundário |

---

## 11. ESPAÇAMENTO PADRÃO

- Padding seção: 80px vertical, 40px horizontal (desktop)
- Padding mobile: 40px vertical, 20px horizontal
- Gap entre cards: 24px (desktop), 16px (mobile)
- Margin bottom seção: 120px
- Espaço em branco entre seções: GENEROSO (não apinhado)

---

## 12. ANIMAÇÕES SUTIS — Catálogo

| Efeito | Quando | Duração | Easing |
|--------|--------|---------|--------|
| Fade In | Scroll enter | 0.6s | ease-out |
| Slide Up | Scroll enter | 0.6s | ease-out |
| Parallax | Scroll contínuo | — | linear |
| Hover glow | Mouse over CTA | 0.2s | ease-in-out |
| Count-up | Stats bar | 2s | linear |
| Stagger cards | Scroll enter | 0.1s delay | ease-out |
| Scale button | Hover | 0.2s | ease-in |

---

## 13. IMAGENS NECESSÁRIAS — Referência de Estilo

### Hero (Vídeo)
- Amanhecer em campo brasileiro (produtor, luz dourada)
- Drone sobrevoando plantação verde
- Máquina colheitadeira em ação

### AgroCore
- Telas reais do app (screenshot)
- Produtor em pé na lavoura com tablet
- Prestador de serviço trabalhando

### SmartAgroOS
- Dashboard screenshot (dados reais)
- Mapa de fazenda com talhões
- Gráfico de análise financeira

### AgroRate
- Gauge/score visual
- Gráfico de composição de score
- Interface do score

### Geral
- Bandeira Brasil (hero)
- Ícones dos módulos IA (SVG)
- Logos das 13 linhas de crédito

**Estilo fotográfico:** Real, autêntico, Brasil, não genérico stock. Luz natural, cores naturais (verde campo, solo marrom, céu azul).

---

## 14. RESPONSIVE BEHAVIOR

| Breakpoint | Mudanças |
|-----------|----------|
| Desktop (1024+) | Split 60/40, grid 3-4 colunas, tipografia full |
| Tablet (768-1023) | Stack, grid 2 colunas, tipografia -15% |
| Mobile (<768) | Stack completo, grid 1 coluna, tipografia -20%, touch targets 48px |

---

## 15. PERFORMANCE TARGETS

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Vídeo hero: < 10MB (otimizado)
- Total JS: < 150KB (sem 3D pesado)

---

## 16. PRÓXIMOS PASSOS

1. ✅ Spec aprovada pelo usuário
2. → Invocar writing-plans para plano de implementação detalhado
3. → Implementar em `/app/ecosistema/page.tsx`
4. → Coletar imagens de qualidade
5. → Testar performance e responsividade
6. → Deploy em produção

---

**Autor:** Claude AI  
**Versão:** 1.0  
**Status:** Aguardando aprovação do usuário
