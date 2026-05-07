---
description: Regras Stripe no AgroOS — planos, assinaturas, KYC
paths:
  - "src/app/api/stripe/**"
  - "src/app/api/webhooks/**"
  - "src/lib/stripe*"
  - "src/lib/planos*"
---

# Pagamentos — AgroOS (Stripe)

## Planos Atuais (lib/planos.ts)
- `starter` — gratuito, 2 membros, sem metas/receitas/exportar
- `pro` — pago, 5 membros, metas, receitas, exportar relatórios
- `enterprise` — ilimitado
- `admin` — acesso total (interno)

## Pendente
- UI de onboarding Stripe para o produtor (endpoint já existe, falta o botão)
- Planos Stripe ainda não configurados em produção

## Regras
- NUNCA alterar lógica de planos sem confirmar — afeta acesso de usuários ativos
- Sempre testar com conta Stripe em modo teste antes de produção
- Limites de plano devem ser verificados no servidor, não apenas no frontend
