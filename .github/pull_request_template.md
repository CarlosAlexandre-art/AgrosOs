## O que muda

<!-- Descreva o que foi implementado ou corrigido. Uma frase clara. -->

## Por que muda

<!-- Contexto: qual problema resolve? qual feature entrega? -->

## Checklist

### Segurança
- [ ] Nenhuma chave de API exposta no código ou via `NEXT_PUBLIC_`
- [ ] Rotas novas com input externo têm validação
- [ ] Rotas públicas novas têm rate limiting (`lib/rate-limit.ts`)
- [ ] CPF não retornado em listagens (usar `select` no Prisma)

### Banco de dados (se tocou no schema Prisma)
- [ ] ATENÇÃO: banco compartilhado com AgroRate — migration impacta os dois sistemas
- [ ] Novos campos são opcionais ou têm default
- [ ] Migration revisada e aprovada
- [ ] `npx prisma generate` rodou após a migration

### Componentes visuais (se tocou em mapas ou 3D)
- [ ] Leaflet não está sob `display:none` (causa NaN nas coordenadas)
- [ ] Three.js importado com `dynamic(..., { ssr: false })`
- [ ] Troca de abas nas páginas de aquicultura não causa scroll para o topo

### Geral
- [ ] `npm run build` passou sem erros
- [ ] Nenhum `console.log` de debug no código final
- [ ] Commit segue o padrão: `feat:`, `fix:`, `refactor:`, `chore:` em português

## Tipo de mudança

- [ ] Feature nova
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Segurança
- [ ] Infraestrutura / config
