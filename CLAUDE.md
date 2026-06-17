# SmartAgroOS — Contexto para IA

## O que é
Sistema operacional da fazenda — dashboard completo para gestão rural. Inclui módulos de safra, pecuária, aquicultura, financeiro, IA agronômica, AgroNav (GPS de campo), AgroToken (blockchain) e integração com AgroCore e AgroRate.

URL produção: agroos.site

## Stack
- **Framework**: Next.js 15 App Router, TypeScript
- **Banco**: PostgreSQL (Supabase) via Prisma ORM
- **Auth**: Supabase Auth (cookies httpOnly)
- **IA**: Groq API — LLaMA 3.3 70B (`lib/groq.ts`) — NÃO substituir por OpenAI
- **Mapas**: Leaflet (com pitfalls conhecidos — ver abaixo)
- **3D**: Three.js (sempre com `dynamic ssr:false`)
- **Blockchain**: AgroToken (smart contracts de recebíveis rurais)
- **Deploy**: Vercel

## Estrutura de Pastas
```
app/
  dashboard/        → Todas as páginas do dashboard (protegidas por auth)
    safra/          → Gestão de safras e talhões
    bovinos/        → Pecuária bovina
    aqua-*/         → 8 módulos de aquicultura
    financeiro/     → Financeiro e fluxo de caixa
    agronav/        → GPS e navegação de campo
    configuracoes/  → Perfil, senha, LGPD
    ...             → 40+ módulos no total
  api/
    ai/             → 30+ endpoints de IA (agrogpt, alertas, análises...)
    lgpd/           → Exclusão de dados
    user/           → Perfil e role do usuário
    blockchain/     → AgroToken endpoints
    ...
components/         → Componentes React
lib/
  groq.ts           → Cliente Groq singleton
  prisma.ts         → Cliente Prisma singleton
  rate-limit.ts     → Rate limiter in-memory
  security.ts       → logSecurityEvent(), isRateLimited(), checkConcentrationRisk()
  supabase/         → createClient() server e client
```

## Módulos Principais
| Módulo | Pasta | Descrição |
|--------|-------|-----------|
| AgroGPT | `dashboard/equipe-ia` | Chat IA agronômica (30req/h limitado) |
| AgroNav | `dashboard/agronav` | GPS campo, histórico, multi-talhão |
| Aquicultura | `dashboard/aqua-*` | 8 módulos (gestão, nutrição, biologia...) |
| AgroToken | `dashboard/ecosistema` | Tokenização de recebíveis rurais |
| Financeiro | `dashboard/financeiro` | Fluxo de caixa, DRE, relatórios |
| Digital Twin | `dashboard/digital-twin-rural` | Simulação digital da fazenda |

## Padrões de Código
- **Rate limiting**: `rateLimit(key, limite, windowMs)` de `@/lib/rate-limit`
- **Auth**: sempre `createClient()` do server + `supabase.auth.getUser()`
- **Segurança**: CPF nunca retornado em listagens (removido do `/api/user/role`)
- **Leaflet**: NÃO usar com `display:none` — causa erro NaN nas coordenadas
- **Three.js**: sempre importar com `dynamic(() => import(...), { ssr: false })`
- **Next.js 15**: `searchParams` é Promise — usar `await searchParams`

## Pitfalls Críticos
- **Leaflet + display:none**: o mapa fica com NaN nas coordenadas. Usar `visibility:hidden` ou montar só quando visível
- **Aquicultura tabs**: trocar abas causa scroll para o topo — salvar `main.scrollTop` antes e restaurar via `useLayoutEffect`
- **Prisma 7**: `new PrismaClient()` sem args falha — usar `@prisma/adapter-pg` com `connectionString`

## Regras que Nunca Quebram
1. Nunca push para main sem confirmação explícita
2. Nunca rodar `prisma migrate deploy` em produção sem confirmar
3. Nunca remover campos do schema Prisma sem avaliar impacto

@AGENTS.md
