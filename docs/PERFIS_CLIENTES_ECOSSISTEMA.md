# Perfis de Clientes — Ecossistema Agro
*Documento vivo · Atualizado em junho/2026 · Versão 1.0*

> Este documento reúne os perfis assertivos dos clientes do ecossistema composto por **AgroCore**, **SmartAgroOS** e **AgroRate**. Os perfis foram construídos a partir da análise dos módulos, fluxos, integrações e dados de uso de cada plataforma.

---

## Índice

1. [AgroCore — Produtores que Contratam Serviços](#agrocore-produtores)
   - [P1 · Médio Produtor de Grãos](#p1--médio-produtor-de-grãos)
   - [P2 · Pequeno Agricultor Familiar](#p2--pequeno-agricultor-familiar)
   - [P3 · Grande Produtor Rural](#p3--grande-produtor-rural)
2. [AgroCore — Prestadores de Serviços](#agrocore-prestadores)
   - [P4 · Operador de Máquinas Agrícolas](#p4--operador-de-máquinas-agrícolas)
   - [P5 · Agrônomo / Técnico Autônomo](#p5--agrônomo--técnico-autônomo)
   - [P6 · Piloto de Drone Agrícola](#p6--piloto-de-drone-agrícola)
   - [P7 · Veterinário Rural / Inseminador](#p7--veterinário-rural--inseminador)
3. [SmartAgroOS — Usuários do Sistema de Gestão](#smartagroos)
   - [P8 · Fazendeiro Gestor Moderno](#p8--fazendeiro-gestor-moderno)
   - [P9 · Gerente / Engenheiro Agrônomo de Fazenda](#p9--gerente--engenheiro-agrônomo-de-fazenda)
   - [P10 · Visitante Curioso do Site](#p10--visitante-curioso-do-site)
4. [AgroRate — Produtores que Buscam Crédito](#agrorate)
   - [P11 · Produtor em Busca de Custeio Agrícola](#p11--produtor-em-busca-de-custeio-agrícola)
   - [P12 · Produtor em Expansão de Área ou Equipamentos](#p12--produtor-em-expansão-de-área-ou-equipamentos)
   - [P13 · Produtor com Histórico de Crédito Comprometido](#p13--produtor-com-histórico-de-crédito-comprometido)
5. [Mapa de Sobreposição entre Plataformas](#mapa-de-sobreposição)
6. [Canais e Mensagens por Perfil](#canais-e-mensagens)

---

## AgroCore — Produtores que Contratam Serviços {#agrocore-produtores}

---

### P1 · Médio Produtor de Grãos

> *"Eu sei o que preciso, só não tenho tempo pra ficar ligando pra todo mundo."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 35–55 anos |
| **Gênero** | Predominantemente masculino (82%) |
| **Escolaridade** | Ensino médio completo a superior incompleto (Agronomia, Administração) |
| **Localização** | MT, GO, MS, PR, SP interior — municípios de médio porte com vocação agrícola |
| **Renda familiar** | R$ 15.000–80.000/mês (varia muito pela sazonalidade) |
| **Estado civil** | Casado, filhos adolescentes ou adultos |

#### Perfil da Propriedade
- **Área**: 100–500 hectares
- **Culturas principais**: Soja, milho, algodão, sorgo (cultivos de ciclo curto)
- **Estrutura**: 1–3 funcionários fixos, contrata serviços sazonalmente
- **Maquinário**: Possui trator e implementos básicos, terceiriza colheita e pulverização
- **Régua de tecnologia**: Usa WhatsApp intensamente; conhece apps de clima (Tempo Certo, Climatempo); pode ter tentado algum sistema de gestão mas abandonou por complexidade

#### Jobs To Be Done (O que precisa fazer)
1. **Contratar pulverização** com urgência quando aparece praga ou fungo
2. **Agendar colheita** com antecedência para não perder janela de safra
3. **Terceirizar plantio** quando seu equipamento quebra ou está com problema
4. **Encontrar análise de solo** para planejamento de adubação
5. **Controlar quem foi na fazenda e quando** (rastreabilidade)

#### Dores e Frustrações
- Passa horas no telefone para encontrar prestador disponível na região
- Recebe indicações de conhecidos, mas não tem como verificar qualidade antes
- Depende de "tchau" de confiança que pode não estar disponível no momento certo
- Não tem visão clara de quanto está gastando com serviços terceirizados por safra
- Medo de contratar sem garantia e perder dinheiro em disputa
- Sazonalidade faz com que os bons prestadores estejam sempre ocupados no pico

#### Motivações e Objetivos
- Maximizar produtividade por hectare
- Reduzir custo de produção sem sacrificar qualidade
- Ter controle e previsibilidade da operação
- Crescer área plantada sem precisar comprar mais equipamento
- Profissionalizar a gestão para eventualmente envolver os filhos no negócio

#### Como Chega ao AgroCore
- Indicação de vizinho ou colega de cooperativa
- Post patrocinado no Facebook ou Instagram (conteúdo agro)
- Stands em feiras regionais (Agrishow, Tecnoshow)
- Canal do YouTube de produtores que testam ferramentas
- Grupo de WhatsApp de produtores da região

#### O que Busca na Plataforma
- Rapidez: publicar o serviço e receber propostas em minutos
- Confiança: ver avaliações reais de outros produtores
- Transparência: saber o preço antes de fechar
- Histórico: manter registro de todos os serviços contratados
- Comodidade: pagar com segurança sem precisar andar com dinheiro em espécie

#### Objeções / Barreiras
- *"Não conheço a empresa, como sei que é confiável?"* → Avaliações e histórico do prestador
- *"Prefiro contratar quem já conheço"* → Pode adicionar prestadores conhecidos como favoritos
- *"E se o serviço for mal feito?"* → Sistema de disputa e escrow no pagamento
- *"Minha internet é ruim na fazenda"* → PWA offline parcial

#### Canais Preferidos
- WhatsApp (comunicação principal)
- Instagram (consume conteúdo agro)
- Grupos de WhatsApp de produtores
- Rádio local e TV aberta (ainda relevante)

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★★★ | ★★★☆☆ | ★★★★☆ |

---

### P2 · Pequeno Agricultor Familiar

> *"Quero melhorar, mas não posso arriscar muito. Cada real conta."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 30–60 anos |
| **Gênero** | Masculino e feminino (mais diverso nesse perfil) |
| **Escolaridade** | Ensino fundamental a médio |
| **Localização** | Interior de MG, PR, SC, RS, BA, PE — municípios pequenos |
| **Renda familiar** | R$ 3.000–12.000/mês |
| **Estado civil** | Casado, família trabalhando junto na propriedade |

#### Perfil da Propriedade
- **Área**: Até 50 hectares (módulos fiscais pequenos, assentamentos, DAP obrigatória)
- **Culturas principais**: Milho, feijão, mandioca, horticultura, frutas, café
- **Estrutura**: Mão de obra familiar, raramente contrata fixo
- **Maquinário**: Nenhum ou mínimo (microtrator, enxada motorizada)
- **Acesso a crédito**: Via PRONAF — muitas vezes não sabe como funciona ou tem dificuldade de acessar

#### Jobs To Be Done
1. **Contratar mecanização** para preparo do solo que não consegue fazer manualmente
2. **Encontrar aplicação de defensivo** certificada para culturas orgânicas ou convencionais
3. **Acessar consultoria agronômica** que normalmente só grandes produtores conseguem
4. **Transportar produção** para cooperativa ou mercado local

#### Dores e Frustrações
- Sente que as ferramentas digitais "não são para ele"
- Não tem CNPJ e às vezes se sente excluído de serviços formalizados
- Dificuldade de navegar em apps complexos (letra pequena, muitas telas)
- Desconfiança com pagamentos online — prefere dinheiro ou PIX direto
- Conexão de internet instável na propriedade
- Não sabe "o preço certo" dos serviços — sente que está sempre pagando mais

#### Motivações e Objetivos
- Garantir produção para sustento da família e pequena renda extra
- Ter acesso às mesmas ferramentas que o grande produtor usa
- Dignidade no trabalho e reconhecimento como produtor rural
- Acesso a programas governamentais (PRONAF, PAA, etc.)
- Deixar algo para os filhos

#### Como Chega ao AgroCore
- Indicação de técnico da EMATER ou cooperativa
- Programa de extensão rural do governo
- Familiar ou vizinho que já usa
- Feiras do agricultor familiar

#### O que Busca na Plataforma
- Interface simples: poucos cliques para conseguir o serviço
- Preço acessível e transparente
- Serviço próximo: não quer prestador de outra cidade
- Atendimento humano disponível quando travar no app

#### Objeções / Barreiras
- *"Não sei mexer muito bem no celular"* → Onboarding simplificado
- *"Tenho medo de golpe"* → Escrow garante que só paga após serviço concluído
- *"Prefiro pagar depois do serviço"* → Explicar modelo de garantia
- *"Não tenho cartão"* → PIX disponível

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★★☆ | ★★☆☆☆ | ★★★★★ (PRONAF) |

---

### P3 · Grande Produtor Rural

> *"Preciso de escala, confiabilidade e relatórios para justificar para o conselho."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 40–65 anos (dono) / 28–45 anos (gestor) |
| **Gênero** | Predominantemente masculino no topo; diverso na gestão |
| **Escolaridade** | Superior completo (Agronomia, Eng. Agronômica, Administração, Direito) |
| **Localização** | MT, GO, BA, PI, MA (MATOPIBA), MS — latifúndios e grupos empresariais |
| **Faturamento** | R$ 500.000+/mês (grupo empresarial agrícola) |
| **Estrutura** | Empresa rural, CNPJ, contador, agrônomo próprio |

#### Perfil da Propriedade
- **Área**: 1.000–50.000 hectares (pode ter várias propriedades)
- **Culturas**: Soja, milho, algodão, eucalipto, cana — escala industrial
- **Maquinário**: Frota própria significativa, mas terceiriza picos e especialidades
- **Time**: 10–200 funcionários, gerentes de área, zootecnista, agrônomo

#### Jobs To Be Done
1. **Contratar serviços especializados em massa** (georreferenciamento de 5.000ha, drone em lote)
2. **Auditoria e rastreabilidade** de todos os serviços executados (certificações internacionais)
3. **Flexibilidade de escala**: preencher lacunas quando frota própria está sobrecarregada
4. **Diversidade de fornecedores** para não depender de um só prestador

#### Dores e Frustrações
- Processo burocrático de homologação de fornecedores (RH, jurídico, financeiro envolvidos)
- Dificuldade de gestão de múltiplos prestadores simultaneamente
- Falta de relatórios para compliance e auditoria ESG
- Risco de prestador não qualificado em área crítica (aplicação de agroquímicos regulados)

#### Motivações e Objetivos
- Certificações internacionais (RTRS, Rainforest Alliance, ISO)
- Rastreabilidade de campo para exportação
- Gestão de risco operacional
- Eficiência de custo em larga escala
- Relatórios ESG para investidores e cooperativas

#### Como Chega ao AgroCore
- Equipe comercial do AgroCore (outbound)
- Indicação de consultor agronômico
- Eventos de alto nível (Forum do Agro, APROSOJA)
- Artigo em Globo Rural, Canal Rural, Valor Econômico

#### O que Busca na Plataforma
- Plano Enterprise com funcionalidades ilimitadas
- API ou integração com ERP próprio
- Relatórios gerenciais exportáveis
- SLA garantido com suporte dedicado
- Possibilidade de criar base de prestadores homologados

#### Objeções / Barreiras
- *"Preciso de NF para tudo"* → Prestadores PJ com emissão de nota
- *"Meu jurídico precisa revisar os termos"* → Contratos via ClickSign
- *"Já tenho um sistema, como integra?"* → Roadmap de API

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★☆☆ (Enterprise) | ★★★★★ | ★★★☆☆ |

---

## AgroCore — Prestadores de Serviços {#agrocore-prestadores}

---

### P4 · Operador de Máquinas Agrícolas

> *"Tenho a máquina, tenho a capacidade. Só falta o cliente certo na hora certa."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 28–55 anos |
| **Gênero** | 95% masculino |
| **Escolaridade** | Ensino médio completo, cursos técnicos (SENAR, SENAI) |
| **Localização** | Interior agrícola — itinerante por raio de 100–300km |
| **Renda mensal** | R$ 6.000–25.000 (altamente sazonal) |
| **Regime** | Autônomo, MEI, ou pequena empresa familiar |

#### Perfil de Atuação
- **Equipamentos**: Trator + plantadeira, colheitadeira, pulverizador tratorizado ou autopropelido
- **Raio de atuação**: 50–200km da base
- **Safras**: Alta ocupação de outubro a março (soja/milho); vazio de abril a setembro
- **Serviços**: Plantio, colheita, pulverização, aração, subsolagem, aplicação de fertilizantes

#### Jobs To Be Done
1. **Ocupar a máquina** no vazio sazonal entre safras
2. **Descobrir quem precisa de serviço** na região sem ficar ligando
3. **Garantir o pagamento** antes de se deslocar longas distâncias
4. **Construir reputação** para conseguir mais clientes sem depender de indicação

#### Dores e Frustrações
- Máquina parada representa prejuízo com financiamento e manutenção
- Fica sabendo das demandas tarde demais (já fecharam com outro)
- Clientes que não pagam ou atrasam — especialmente os desconhecidos
- Sem registro formal das horas trabalhadas e distâncias percorridas
- Dificuldade de precificar: nunca sabe se está cobrando certo
- Depende muito de um ou dois clientes grandes (concentração de risco)

#### Motivações e Objetivos
- Maximizar utilização da máquina ao longo do ano
- Diversificar a carteira de clientes para reduzir dependência
- Formalizar a operação (MEI → Simples Nacional) à medida que cresce
- Ampliar frota quando tiver fluxo de caixa mais estável
- Ser reconhecido como prestador de qualidade na região

#### Como Chega ao AgroCore
- Grupo de WhatsApp de produtores da região que fala sobre o app
- Indicação de colega que já consegue trabalho pela plataforma
- Post no Instagram ou Facebook Marketplace agro
- Notícia em site de agronegócio regional

#### O que Busca na Plataforma
- Receber notificações quando surgir serviço próximo
- Controle do próprio raio de atuação
- Histórico de serviços e avaliações acumuladas
- Pagamento garantido via plataforma (escrow)
- Sugestão de preço justo baseado no mercado local

#### Objeções / Barreiras
- *"5% de comissão é muito"* → Comparar com custo de buscar cliente ativamente
- *"E se o cliente cancelar depois que eu já me deslocar?"* → Política de cancelamento protege o prestador
- *"Não sei usar app"* → Onboarding por WhatsApp ou vídeo

#### Canais Preferidos
- WhatsApp Business
- YouTube (conteúdo de máquinas e agro)
- Facebook (grupos regionais de máquinas agrícolas)
- Rádio AM local

#### Score de Fit por Plataforma
| AgroCore (como prestador) | SmartAgroOS | AgroRate |
|--------------------------|-------------|----------|
| ★★★★★ | ★☆☆☆☆ | ★★★☆☆ |

---

### P5 · Agrônomo / Técnico Autônomo

> *"Estudei 5 anos para isso. Quero atender mais fazendas sem precisar de carteira assinada."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 24–45 anos |
| **Gênero** | Masculino (65%), feminino (35%) — profissão mais diversa |
| **Escolaridade** | Superior completo (Agronomia, Eng. Florestal, Veterinária, Técnico Agrícola) |
| **Localização** | Cidades polo regionais com área de influência rural |
| **Renda mensal** | R$ 5.000–18.000 (variável por consultas) |
| **Regime** | Autônomo com CREA/CFMV, MEI ou pessoa física |

#### Perfil de Atuação
- **Serviços**: Análise de solo, consultoria agronômica, prescrição de adubação, manejo integrado de pragas, laudos técnicos, receituário agronômico
- **Número de clientes**: 5–30 fazendas atendidas regularmente
- **Modelo de cobrança**: Visita técnica (R$ 300–800), plano mensal por fazenda, ou por hectare

#### Jobs To Be Done
1. **Encontrar novos clientes** fora da rede pessoal (especialmente recém-formados)
2. **Organizar agenda de visitas** por região para otimizar deslocamento
3. **Emitir laudos e receituários** de forma rápida e com validade legal
4. **Demonstrar credenciais** (CREA, especializações) para clientes que não o conhecem

#### Dores e Frustrações
- Dificuldade de prospecção: depende 100% de indicações
- Clientes que não entendem o valor do serviço técnico e pechinchão
- Sem garantia de pagamento para novos clientes (sem histórico)
- Deslocamento excessivo quando clientes estão espalhados sem rota otimizada
- Concorrência desleal de técnicos sem formação cobrando menos

#### Motivações e Objetivos
- Construir carteira de clientes recorrentes e estável
- Ser reconhecido como referência técnica na região
- Escalar atendimento contratando outros técnicos (virar escritório de consultoria)
- Usar IA agronômica como apoio de decisão (diferenciar-se dos concorrentes)

#### Como Chega ao AgroCore
- LinkedIn (conteúdo técnico agronômico)
- CREA newsletter ou grupo de profissionais
- Indicação de colega de faculdade
- Evento técnico (Congresso de Agronomia, DIA de Campo)

#### O que Busca na Plataforma
- Validação de credenciais profissionais (CREA visível no perfil)
- Portfólio de atendimentos com avaliações
- Ferramenta para organizar visitas por região
- Sugestão de preço por tipo de consultoria

#### Objeções / Barreiras
- *"Minha reputação já está estabelecida, não preciso"* → Casos de uso para ampliar geográfico
- *"Prefiro manter relacionamento direto com cliente"* → Plataforma não impede contato direto após match

#### Score de Fit por Plataforma
| AgroCore (como prestador) | SmartAgroOS | AgroRate |
|--------------------------|-------------|----------|
| ★★★★★ | ★★☆☆☆ | ★★★☆☆ |

---

### P6 · Piloto de Drone Agrícola

> *"Meu drone custa R$ 80 mil. Cada hora parado é desperdício de dinheiro."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 22–40 anos |
| **Gênero** | 90% masculino |
| **Escolaridade** | Superior em andamento/completo (Agronomia, TI, Aviação) + certificação ANAC |
| **Localização** | Itinerante — base em cidade polo, atua em raio de até 400km |
| **Renda mensal** | R$ 8.000–35.000 (altamente sazonal no pico de pulverização) |
| **Regime** | MEI a Simples Nacional com 1–3 drones |

#### Perfil de Atuação
- **Equipamentos**: DJI Agras T40/T50, Horus, Volare — 1 a 5 drones
- **Serviços**: Pulverização aérea, mapeamento (fotogrametria), NDVI, aplicação de fungicidas/herbicidas
- **Certificações**: ANAC RPAS obrigatório
- **Diferencial**: Acesso a áreas de difícil mecanização, menor compactação do solo

#### Jobs To Be Done
1. **Ocupar agenda** com demandas de pulverização especialmente entre dezembro e fevereiro
2. **Encontrar clientes de mapeamento e NDVI** durante entressafra (receita complementar)
3. **Ser descoberto** por produtores que ainda não conhecem drone para aplicação
4. **Demonstrar ROI** do drone vs. pulverização terrestre convencional

#### Dores e Frustrações
- Mercado ainda pouco maduro: muitos produtores desconfiam de pulverização por drone
- Precificação complexa: ha voado, tipo de produto, topografia, ventos
- Concorrência de pilotos sem certificação cobrando preço irreal
- Alta demanda concentrada em 3 meses do ano; ociosidade nos outros 9
- Regulatório da ANAC constantemente mudando

#### Motivações e Objetivos
- Ser o drone reference da microrregião
- Ampliar frota para atender mais área simultaneamente
- Diversificar serviços (mapeamento, topografia, rastreabilidade visual)
- Integrar com plataformas de IA para análise de imagens (NDVI, identificação de pragas)

#### Como Chega ao AgroCore
- Comunidades de pilotos no YouTube e Discord
- Eventos de tecnologia agrícola (Agrishow, Agro Tech)
- Post técnico no Instagram com demo de voo
- Indicação de distribuidor DJI ou revendedor de drones agro

#### O que Busca na Plataforma
- Categoria específica para tecnologia/drone no marketplace
- Possibilidade de subir certificação ANAC e seguro do equipamento
- Clientes que já entenderam o serviço (sem precisar educar do zero)
- Raio de atuação expansível conforme logística

#### Score de Fit por Plataforma
| AgroCore (como prestador) | SmartAgroOS | AgroRate |
|--------------------------|-------------|----------|
| ★★★★★ | ★☆☆☆☆ | ★★☆☆☆ |

---

### P7 · Veterinário Rural / Inseminador

> *"Tem muito animal pra pouco veterinário aqui na região. Mas os produtores não me encontram."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 26–50 anos |
| **Gênero** | Equilíbrio (50/50) — medicina veterinária tem alta feminização |
| **Escolaridade** | Superior completo em Medicina Veterinária (CFMV obrigatório) |
| **Localização** | Cidades de pecuária consolidada (GO, MT, MS, MG, RS, PR) |
| **Renda mensal** | R$ 6.000–22.000 |
| **Regime** | Autônomo ou clínica veterinária rural |

#### Perfil de Atuação
- **Serviços**: Sanidade animal, inseminação artificial, manejo reprodutivo, diagnóstico de doenças, vacinação
- **Regime de trabalho**: Plantões de emergência + visitas programadas
- **Mobilidade**: Carro adaptado como clínica móvel rural

#### Jobs To Be Done
1. **Ampliar carteira de clientes** além dos já conhecidos
2. **Ser chamado em emergências** por produtores que não têm veterinário fixo
3. **Oferecer pacotes** de sanidade preventiva de forma recorrente
4. **Registrar prontuários** dos animais atendidos

#### Dores e Frustrações
- Produtores chamam veterinário só em emergência (cultura de prevenção baixa)
- Deslocamentos longos sem garantia de pagamento adiantado
- Concorrência de "paraveterinários" ou inseminadores sem formação
- Dificuldade de cobrar emergências no final de semana

#### Motivações e Objetivos
- Construir contratos recorrentes de sanidade (melhor do que visitas avulsas)
- Ser a referência técnica da região para pecuária de corte/leite
- Usar tecnologia de diagnóstico remoto quando possível

#### Score de Fit por Plataforma
| AgroCore (como prestador) | SmartAgroOS | AgroRate |
|--------------------------|-------------|----------|
| ★★★★☆ | ★★☆☆☆ | ★★☆☆☆ |

---

## SmartAgroOS — Usuários do Sistema de Gestão {#smartagroos}

---

### P8 · Fazendeiro Gestor Moderno

> *"Quero saber o que está acontecendo na fazenda sem precisar estar lá o tempo todo."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 35–55 anos |
| **Gênero** | 78% masculino |
| **Escolaridade** | Superior (Agronomia, Administração, Eng. Agrícola) ou filhos que estudaram |
| **Localização** | Pode estar na cidade; fazenda em MT, GO, PR, SP, MG |
| **Faturamento** | R$ 200.000–5.000.000/safra |
| **Regime** | PF com NIRF ou empresa rural CNPJ |

#### Perfil da Propriedade
- **Área**: 300–5.000 hectares
- **Culturas**: Soja + milho safrinha (rotação clássica), eventualmente aquicultura ou pecuária
- **Time**: 5–50 funcionários, gerente de fazenda, operadores de máquinas
- **Tecnologia já usada**: GPS de máquina (John Deere Operations Center, AFS), algum app de clima, WhatsApp para gestão informal

#### Jobs To Be Done
1. **Monitorar operações remotamente** sem precisar ir à fazenda diariamente
2. **Registrar e rastrear todas as atividades** (operações, insumos, custos por talhão)
3. **Integrar dados** de diferentes fontes (clima, solo, máquinas, financeiro)
4. **Gerenciar equipe** atribuindo tarefas e acompanhando execução
5. **Ter dados para decisões** de planejamento da próxima safra
6. **Solicitar serviços externos** (AgroCore) diretamente pela plataforma
7. **Planejar crédito** integrado com dados reais de produção (AgroRate)

#### Dores e Frustrações
- Gestão é feita por WhatsApp, planilha Excel e caderno — perda de informação
- Sem visão integrada de custo por talhão por hectare
- Difícil saber o que a equipe fez quando não estava presente
- Tomada de decisão sobre insumos baseada em intuição, não dados
- IA agronomia que existe hoje é genérica, não conhece a fazenda específica
- Muitas ferramentas que "prometem muito" e são abandonadas em 2 semanas pela complexidade

#### Motivações e Objetivos
- Ter uma "sala de controle" da fazenda no celular
- Reduzir dependência de uma única pessoa de confiança na fazenda
- Aumentar produtividade por hectare com base em dados históricos
- Profissionalizar a operação para eventualmente atrair investidor ou sócio
- Preparar a fazenda para certificações de rastreabilidade (exportação premium)

#### Módulos que mais usa
1. **Dashboard financeiro** (fluxo de caixa, DRE)
2. **Mapa da fazenda** (talhões, GPS de atividades)
3. **Operações** (registro de atividades com custo)
4. **AgroGPT** (perguntas agronômicas rápidas)
5. **Alertas** (clima, pragas, vencimentos)
6. **AgroNav** (navegação de campo para plantio)
7. **Imagens de satélite** (NDVI, vigor de lavoura)
8. **AgroCore** (solicitar serviços terceirizados)

#### Como Chega ao SmartAgroOS
- Indicação de outro fazendeiro ou cooperativa
- Conteúdo técnico no YouTube (Canal do Produtor, Canal Rural)
- Post de especialista agronômico no LinkedIn
- Feiras: Agrishow, Tecnoshow Comigo, Agro Norte
- Anúncio patrocinado com foco em produtividade agro

#### O que Busca na Plataforma
- Centralização: tudo em um só lugar
- Simplicidade: não quer aprender 50 telas
- Mobile first: usa no campo com internet 4G
- IA útil: que realmente conheça os dados da fazenda
- Integração com o que já usa (John Deere, Climate FieldView)

#### Objeções / Barreiras
- *"Já tentei 3 sistemas e abandonei"* → Onboarding guiado, sucesso do cliente
- *"Minha equipe não vai usar"* → App mobile simples para operadores
- *"Tenho medo de perder meus dados"* → Supabase com backup, exportação CSV
- *"É caro demais"* → Mostrar ROI: R$ 5/ha economizados em 300ha = R$ 1.500/mês

#### Canais Preferidos
- YouTube (referência técnica)
- WhatsApp (comunicação)
- LinkedIn (networking agro)
- Podcast agro (Campo Verde, AgCast)

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★★☆ | ★★★★★ | ★★★★★ |

---

### P9 · Gerente / Engenheiro Agrônomo de Fazenda

> *"O dono quer relatório todo dia. Preciso de uma ferramenta que me ajude a entregar isso."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 26–42 anos |
| **Gênero** | 60% masculino, 40% feminino (perfil mais jovem e diverso) |
| **Escolaridade** | Superior em Agronomia, Eng. Agrícola ou Zootecnia — muitas vezes especialização |
| **Localização** | Mora perto da fazenda ou vai semanalmente |
| **Renda mensal** | R$ 4.500–12.000 (CLT ou prestador PJ da fazenda) |

#### Perfil de Atuação
- **Responsabilidade**: Planejamento de safra, gestão de equipe de campo, prescrição técnica
- **Pressão diária**: Relatórios para o proprietário, tomada de decisão rápida
- **Tecnologia**: Usuário avançado de apps — ArcGIS, FieldView, Excel, R (alguns)

#### Jobs To Be Done
1. **Registrar atividades** da equipe em tempo real
2. **Gerar relatórios** de produção, custo, eficiência para o proprietário
3. **Prescrever** insumos com base em análise de solo e histórico
4. **Monitorar saúde da lavoura** por imagens de satélite
5. **Planejar safra** com dados históricos de produtividade por talhão

#### Dores e Frustrações
- Perde horas compilando dados que estão em sistemas diferentes
- Proprietário cobra resultados mas não fornece ferramentas adequadas
- Difícil justificar decisões técnicas sem dados históricos registrados
- IA agronômica que sugere coisas genéricas sem conhecer o talhão específico

#### Motivações e Objetivos
- Ser reconhecido como um profissional técnico de alta performance
- Ter dados que respaldem suas recomendações
- Automatizar relatórios para focar no que é estratégico
- Usar IA como copiloto agronômico, não como substituto

#### Módulos que mais usa
1. **Operações** (lançamento e acompanhamento de atividades)
2. **Safra / Talhões** (segmentação por talhão)
3. **Solo** (histórico de análise de solo)
4. **Imagens satélite** (NDVI semanal)
5. **AgroGPT** (segunda opinião rápida)
6. **Relatórios financeiros** para enviar ao dono
7. **AgroNav** (navegação e prescrição de aplicação)

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★☆☆ | ★★★★★ | ★★☆☆☆ |

---

### P10 · Visitante Curioso do Site

> *"Vi no Instagram. Quero entender o que é antes de criar conta."*

Este é o perfil do usuário que encontra um dos produtos do ecossistema mas **ainda não converteu em usuário ativo**. É o público de topo de funil — crucial para crescimento.

#### Subperfis dentro dos Curiosos

#### 10A — Produtor em Fase de Pesquisa
- Está insatisfeito com planilha e WhatsApp, mas com medo de adotar outra ferramenta que vai abandonar
- Pesquisou "sistema de gestão fazenda", "app produtor rural", "gestão agrícola celular" no Google
- Visita o site, lê a landing page, pode assistir a um vídeo demo
- **Gatilho de conversão**: Depoimento de fazendeiro parecido com ele + trial grátis sem cartão

#### 10B — Filho/Filha do Produtor Pesquisando para o Pai
- 22–35 anos, formado ou cursando Agronomia/Admin/TI
- Quer modernizar a fazenda da família
- Pesquisa ferramentas digitais para apresentar ao pai como proposta
- **Gatilho de conversão**: Caso de uso claro + facilidade de onboarding + preço acessível

#### 10C — Técnico Agro ou Cooperativa Avaliando para Indicar a Clientes
- Agrônomo, técnico EMATER, consultor de cooperativa
- Está avaliando o produto para recomendar a produtores que atende
- Quer conhecer profundidade técnica e integração com ferramentas que já usa
- **Gatilho de conversão**: Documentação técnica + programa de parceiros

#### 10D — Estudante de Agronomia ou Startups Agro
- Pesquisando concorrência ou referência de mercado
- Pode virar cliente em 2–3 anos
- Pode divulgar organicamente se gostar do produto
- **Gatilho de conversão**: Plano gratuito ou estudantil

#### 10E — Jornalista / Investidor / Parceiro em Due Diligence
- Avalia o produto como referência de inovação no agro
- Quer entender modelo de negócio, tração, diferencial
- **Gatilho de conversão**: Página de imprensa, contato direto com time

#### Comportamento no Site (todos os curiosos)
- Tempo médio de permanência: 45s–3min
- Taxa de bounce alta se landing page não for clara nos primeiros 5 segundos
- Scrollam até o meio da página antes de sair
- Poucos convertem na primeira visita (precisa de retargeting)
- Muito do tráfego vem mobile (farm owners usam celular)

#### O que o Site Precisa Comunicar
1. **Para quem é**: "Para produtor rural que quer gestão moderna" — sem jargão tech
2. **O que faz**: Demo visual ou vídeo de 60s do produto real
3. **Prova social**: Depoimento de produtor com foto e hectares gerenciados
4. **Preço ou trial**: Plano grátis para começar sem risco
5. **Suporte**: WhatsApp visível — produtor prefere falar com pessoa

---

## AgroRate — Produtores que Buscam Crédito {#agrorate}

---

### P11 · Produtor em Busca de Custeio Agrícola

> *"Preciso de crédito agora para comprar insumo. O banco pede documentação que demora semanas."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 30–60 anos |
| **Gênero** | 80% masculino |
| **Escolaridade** | Ensino médio a superior |
| **Localização** | Todo o Brasil rural — maior concentração em Centro-Oeste, Sul e Sudeste rural |
| **Área** | 50–2.000 hectares |
| **Programa de crédito buscado** | PRONAF, Pronamp, Custeio Agrícola convencional |

#### Contexto de Crédito
- Precisa de crédito **cíclico e recorrente** (toda safra)
- Já teve crédito antes, mas processo de renovação é burocrático
- Pode estar usando crédito informal (barter com revendas de insumo — custo altíssimo)
- Tem relacionamento com banco mas processo demora mais do que a janela de plantio permite

#### Jobs To Be Done
1. **Saber o próprio score** antes de ir ao banco (evitar surpresa negativa)
2. **Organizar documentação** que o banco vai pedir de forma antecipada
3. **Simular diferentes cenários** de prazo e valor antes de assinar
4. **Apresentar relatório de crédito profissional** para aumentar credibilidade junto ao banco
5. **Entender por que foi negado** e o que pode melhorar para a próxima tentativa

#### Dores e Frustrações
- Vai ao banco sem saber o próprio score e é surpreendido com negativa
- Não entende quais fatores pesaram negativamente na análise
- Documentação espalhada (DAP, CAR, matrícula do imóvel, ITR) — difícil de organizar
- Barter (compra de insumo com entrega futura de grão) é muito caro mas é o único acesso que tem
- Desconfia de bureaus de crédito — acha que informação foi colocada sem saber
- Prazo bancário não casa com janela de plantio

#### Motivações e Objetivos
- Ter independência de bureau de crédito desconhecido
- Entender sua "nota" e trabalhar para melhorá-la
- Acessar crédito com taxa menor do que o barter
- Ter relatório profissional para apresentar ao banco ou cooperativa
- Antecipar eventuais problemas antes da próxima safra

#### Módulos mais relevantes
1. **Score AgroRate** — ver a própria nota e fatores
2. **Fatores** — entender o que afeta positiva/negativamente
3. **Documentos** — upload e organização da documentação
4. **Certidões negativas** — obter automaticamente
5. **Simulações** — calcular parcelas e viabilidade
6. **Calculadora PRONAF** — simular o programa específico
7. **Planner de Crédito** — planejar para a próxima safra
8. **Parceiros** — ver quais instituições financeiras usam o score

#### Como Chega ao AgroRate
- Negativa de crédito no banco + pesquisa no Google sobre como melhorar score rural
- Indicação de agrônomo ou técnico de extensão rural
- Cooperativa que usa AgroRate como ferramenta de pré-análise
- Conteúdo sobre PRONAF e crédito rural no YouTube/Instagram

#### Objeções / Barreiras
- *"Meu CPF vai ficar exposto?"* → Explicar criptografia e LGPD compliance
- *"O banco vai ver o que eu coloquei aqui?"* → Consentimento explícito: o produtor escolhe com quem compartilha
- *"Score vai cair se eu pesquisar?"* → Consulta interna não afeta score (hard inquiry vs. soft)
- *"Já tenho o banco há 20 anos, não preciso disso"* → Para quem quer segunda opção ou taxa melhor

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★★☆ | ★★★☆☆ | ★★★★★ |

---

### P12 · Produtor em Expansão de Área ou Equipamentos

> *"Surgiu uma área pra arrendar / preciso trocar a colheitadeira. Quanto posso tomar de crédito?"*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 32–55 anos |
| **Gênero** | 82% masculino |
| **Escolaridade** | Médio a superior |
| **Área atual** | 200–3.000 hectares (em crescimento) |
| **Programa buscado** | Moderfrota, BNDES Agro, PCA, FINAME Agrícola |

#### Contexto de Crédito
- Quer crédito de **longo prazo** (5–15 anos) para equipamento ou terra
- Tem histórico de crédito de custeio mas nunca fez crédito de investimento
- Sente que o banco "não acredita no potencial" da fazenda
- Quer apresentar uma proposta sólida, não apenas um cadastro

#### Jobs To Be Done
1. **Montar dossiê financeiro** da fazenda para apresentar ao banco
2. **Simular capacidade de pagamento** considerando receita da safra
3. **Organizar garantias** (imóvel rural, penhor de máquinas, CPR)
4. **Entender qual linha de crédito** é mais adequada para o objetivo
5. **Ter score alto** para conseguir taxa prefixada melhor

#### Dores e Frustrações
- Sente que precisa de relação pessoal com gerente para conseguir crédito
- Incerteza sobre quanto de garantia precisa oferecer
- Projeções de receita que fez no caderno não têm credibilidade para o banco
- Processo de análise demora 30–90 dias — oportunidade pode passar

#### Motivações e Objetivos
- Crescer a operação aproveitando janela de mercado (preço da soja alto)
- Profissionalizar a fazenda para acessar mercado premium de exportação
- Ter equipamento moderno para reduzir custo operacional
- Garantir sucessão familiar com propriedade maior e estruturada

#### Módulos mais relevantes
1. **Garantias** — cadastrar imóvel rural, máquinas como garantia
2. **Score + Relatório** — relatório completo para apresentar ao banco
3. **Fluxo de caixa** — projetar capacidade de pagamento
4. **Contratos** — assinar digitalmente via ClickSign
5. **Parceiros** — identificar qual banco trabalha com a linha desejada
6. **Planner de Crédito** — estruturar o pedido

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★☆☆ | ★★★★☆ | ★★★★★ |

---

### P13 · Produtor com Histórico de Crédito Comprometido

> *"Tive uma safra ruim há 3 anos, fiz renegociação. Agora estou de pé, mas o banco ainda não confia."*

#### Dados Demográficos
| Campo | Detalhe |
|-------|---------|
| **Faixa etária** | 35–65 anos |
| **Gênero** | 85% masculino |
| **Escolaridade** | Fundamental a médio |
| **Área atual** | 30–500 hectares |
| **Situação atual** | Em dia (saiu do cadastro negativo), mas score baixo |

#### Contexto de Crédito
- Passou por renegociação, prorrogação ou refinanciamento nos últimos 3–5 anos
- Safra ruim (seca, baixa de preço, pragas) causou inadimplência temporária
- Atualmente regularizado mas com score que não reflete a situação atual
- Bancos formais negam sem análise individual

#### Jobs To Be Done
1. **Entender exatamente o que está pesando negativamente no score**
2. **Comprovar que a situação atual é diferente** da época da inadimplência
3. **Encontrar alternativas de crédito** além dos bancos tradicionais (cooperativas, fintechs agro)
4. **Ter um plano de recuperação de score** com etapas concretas
5. **Renegociar dívidas residuais** com melhores condições

#### Dores e Frustrações
- Sente que "pagou" pela crise mas ainda é tratado como mau pagador
- Bureaus de crédito tradicionais (Serasa, SPC) não refletem a realidade do agro sazonal
- Não consegue nem linha de custeio básica — usa barter com custo proibitivo
- Vergonha de falar de histórico de crédito ruim
- Não sabe como provar que mudou para uma instituição que não o conhece

#### Motivações e Objetivos
- Reabilitar o nome e o acesso a crédito formal
- Retomar o crescimento da fazenda que ficou estagnado
- Ter um score específico para o agro que entenda sazonalidade e riscos climáticos
- Encontrar crédito de reconstrução (pós-crise)

#### Módulos mais relevantes
1. **Score + Fatores** — entender o peso de cada fator
2. **Histórico** — linha do tempo de crédito com contexto
3. **Certidões negativas** — comprovar situação atual regularizada
4. **Renegociação** — ferramentas para organizar dívidas residuais
5. **Equipe IA / Agente Financeiro** — aconselhamento personalizado
6. **ORYON Legal** — apoio jurídico para renegociação
7. **Acelerar** — fast-track para análise humanizada

#### Como Chega ao AgroRate
- Pesquisa desesperada: "como melhorar score rural", "fui negativado banco qual alternativa"
- Indicação de advogado rural ou contador
- Programa de recuperação de cooperativa
- Sindicato rural da região

#### Objeções / Barreiras
- *"Tenho vergonha do meu histórico"* → Abordagem empática, dados nunca compartilhados sem consentimento
- *"Não vai adiantar"* → Mostrar casos reais de recuperação de score
- *"Tenho medo de colocar meus dados"* → LGPD + criptografia + explicação clara

#### Score de Fit por Plataforma
| AgroCore | SmartAgroOS | AgroRate |
|----------|-------------|----------|
| ★★★☆☆ | ★★☆☆☆ | ★★★★★ |

---

## Mapa de Sobreposição entre Plataformas {#mapa-de-sobreposição}

```
                    AgroCore    SmartAgroOS    AgroRate
                    ─────────   ───────────    ────────
P1 · Médio Grãos       ●●●●●       ●●●○○        ●●●●○
P2 · Pequeno Familiar  ●●●●○       ●●○○○        ●●●●●
P3 · Grande Produtor   ●●●○○       ●●●●●        ●●●○○
P4 · Op. Máquinas      ●●●●●       ●○○○○        ●●●○○
P5 · Agrônomo Auto.    ●●●●●       ●●○○○        ●●●○○
P6 · Piloto Drone      ●●●●●       ●○○○○        ●●○○○
P7 · Veterinário       ●●●●○       ●●○○○        ●●○○○
P8 · Fazendeiro Gestor ●●●●○       ●●●●●        ●●●●●
P9 · Gerente/Agrônomo  ●●●○○       ●●●●●        ●●○○○
P10 · Curioso Site     ○○○○○       ●○○○○        ○○○○○
P11 · Custeio          ●●●●○       ●●●○○        ●●●●●
P12 · Expansão         ●●●○○       ●●●●○        ●●●●●
P13 · Score Baixo      ●●●○○       ●●○○○        ●●●●●
```

### Clientes com maior potencial de ser usuário dos 3 produtos simultaneamente:
- **P1 (Médio Grãos)** — AgroCore + SmartAgroOS + AgroRate: produtores de 100–500ha são o sweet spot total
- **P8 (Fazendeiro Gestor)** — SmartAgroOS é o hub; puxa AgroCore para serviços e AgroRate para crédito
- **P11 (Custeio)** — começa no AgroRate, mas dados de safra do SmartAgroOS fortalecem o score

---

## Canais e Mensagens por Perfil {#canais-e-mensagens}

### AgroCore
| Perfil | Canal Principal | Mensagem Chave |
|--------|----------------|----------------|
| P1 Médio Grãos | Facebook + WhatsApp Groups | "Publique o serviço e receba propostas em minutos" |
| P2 Pequeno Familiar | EMATER + Cooperativa + Rádio local | "Acesse os mesmos serviços que os grandes produtores usam" |
| P3 Grande Produtor | LinkedIn + Evento + Outbound | "Gestão unificada de fornecedores com rastreabilidade e compliance" |
| P4 Operador Máquinas | Facebook Groups + YouTube Agro | "Sua máquina trabalhando o ano todo, não só na safra" |
| P5 Agrônomo | LinkedIn + CREA Eventos | "Amplie sua carteira de clientes além do seu círculo" |
| P6 Drone | YouTube + Discord Pilotos | "Encontre quem precisa de drone, sem precisar buscar" |
| P7 Veterinário | CFMV + Instagram Rural | "Seja encontrado em emergências na sua região" |

### SmartAgroOS
| Perfil | Canal Principal | Mensagem Chave |
|--------|----------------|----------------|
| P8 Fazendeiro Gestor | YouTube + Agrishow + LinkedIn | "A sala de controle da sua fazenda no celular" |
| P9 Gerente/Agrônomo | LinkedIn + Eventos Técnicos | "Relatórios automáticos, mais tempo para o que importa" |
| P10A Curioso Produtor | Google + Retargeting | "Teste grátis, sem cartão de crédito" |
| P10B Filho do Produtor | Instagram + TikTok | "Modernize a fazenda do seu pai com uma ferramenta simples" |
| P10C Técnico/Cooperativa | LinkedIn + EMATER | "Indique para seus clientes: programa de parceiros disponível" |

### AgroRate
| Perfil | Canal Principal | Mensagem Chave |
|--------|----------------|----------------|
| P11 Custeio | Google (busca ativa) + Cooperativa | "Saiba seu score antes de ir ao banco" |
| P12 Expansão | Banco/Cooperativa + LinkedIn | "Monte seu dossiê de crédito com relatório profissional" |
| P13 Score Baixo | Google (busca desespero) + ORYON Legal | "Entenda o que está pesando e construa um plano de recuperação" |

---

## Notas para Uso Deste Documento

1. **Este documento é vivo** — revisar após cada 500 usuários ativos ou ciclo de safra
2. **Jobs to be done** são a base para priorização de features — se um JTBD aparece em múltiplos perfis, é candidato a sprint
3. **Objeções documentadas** alimentam diretamente o roteiro de copywriting de landing pages e onboarding
4. **Sobreposição de perfis** indica oportunidade de cross-sell entre os produtos do ecossistema
5. **P10 (Visitantes Curiosos)** é o único perfil que depende 100% da landing page — investir em UX de conversão

---

*Documento criado com base em análise dos módulos, APIs e fluxos de usuário dos três produtos do ecossistema Agro.*
