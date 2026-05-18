# Roadmap de Implementação: Stack Premium Design

## 📅 Timeline Recomendada: 4-6 Semanas

---

## FASE 1: SETUP & FUNDAMENTAÇÃO (Semana 1)

### 1.1 Instalar dependências core
**Tarefas:**
- [ ] `npm install gsap motion @rive-app/react-canvas`
- [ ] `npm install @react-three/fiber @react-three/drei three`
- [ ] `npm install @splinetool/react-spline`
- [ ] Verificar bundle size: `npm run build && npx webpack-bundle-analyzer`

**Comando:**
```bash
npm install \
  gsap \
  motion \
  @rive-app/react-canvas \
  @react-three/fiber \
  @react-three/drei \
  three \
  @splinetool/react-spline

npm run build
```

**Entregável:** Build sem warnings, bundle < 500kb

### 1.2 Criar estrutura de componentes
**Tarefas:**
- [ ] Criar `/src/components` com subpastas:
  - `3d/` (Three.js, Spline)
  - `animations/` (GSAP, Motion)
  - `rive/` (Rive components)
  - `sections/` (Hero, Features, etc)
  - `ui/` (botões, cards base)
- [ ] Criar `/public/animations/` para arquivos `.riv`
- [ ] Criar `/public/models/` para arquivos `.glb`, `.gltf`
- [ ] Criar `/src/hooks/` para custom hooks

**Estrutura final:**
```
src/
├── components/
│   ├── 3d/
│   │   ├── Three3DViewer.tsx
│   │   ├── HeroSpline.tsx
│   │   └── ModelLoader.tsx
│   ├── animations/
│   │   ├── ScrollTimeline.tsx
│   │   ├── AnimatedCard.tsx
│   │   └── GSAPBackground.tsx
│   ├── rive/
│   │   ├── RiveIconButton.tsx
│   │   ├── RiveLoadingSpinner.tsx
│   │   └── RiveStateMachine.tsx
│   └── sections/
│       ├── HeroSection.tsx
│       ├── FeaturesSection.tsx
│       └── CTASection.tsx
├── hooks/
│   ├── useScrollAnimation.ts
│   ├── useRiveAnimation.ts
│   └── useGSAPTimeline.ts
└── context/
    └── RiveAnimationContext.tsx
```

**Entregável:** Estrutura criada, sem erros de imports

### 1.3 Configurar Next.js para 3D/WASM
**Tarefas:**
- [ ] Editar `next.config.js` para suportar:
  - Arquivos `.wasm` (Spline)
  - Arquivos `.glb`, `.gltf` (modelos 3D)
  - Otimizações de bundle
- [ ] Adicionar `tsconfig.json` paths para imports limpos

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    });
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};
module.exports = nextConfig;
```

**Entregável:** Build bem-sucedido, no console errors

---

## FASE 2: PROTÓTIPOS INTERATIVOS (Semana 2)

### 2.1 Hero Section com Spline 3D
**Tarefas:**
- [ ] Criar cena no Spline (https://spline.design)
  - Design de máquina agrícola ou produto
  - Adicionar interatividade básica (click, hover)
  - Exportar para React
- [ ] Implementar `HeroSpline.tsx` com:
  - Componente Spline integrado
  - GSAP ScrollTrigger (parallax)
  - Título animado com Motion
- [ ] Adicionar fallback para SSR

**Checklist Spline:**
- [ ] Criar projeto em spline.design
- [ ] Design básico completado (não precisa perfeito)
- [ ] Exportar como React component
- [ ] Testar em dev local

**Componente esperado:**
```typescript
<HeroSpline
  sceneUrl="..."
  title="Agroos Premium"
  subtitle="Tecnologia Agrícola"
/>
```

**Entregável:** Hero renderizado, scroll parallax funcionando

### 2.2 Feature Cards com Rive Icons
**Tarefas:**
- [ ] Criar 3 animações Rive (https://rive.app):
  - Ícone de análise (com state machine)
  - Ícone de monitoramento (com state machine)
  - Ícone de recomendação (com state machine)
- [ ] Implementar `AnimatedFeatureCard.tsx`:
  - Card Motion com layout animation
  - Rive icon com state machine input
  - Hover triggers animation
  - GSAP tween no click
- [ ] Grid de cards com scroll stagger

**Rive State Machine Básico:**
- isHovered: boolean
- onClick: trigger
- progress: number (0-100)

**Entregável:** 3 cards com ícones animados, hover/click funcionando

### 2.3 Scroll Timeline com GSAP
**Tarefas:**
- [ ] Implementar `ScrollTimeline.tsx`:
  - SVG path conectando steps
  - GSAP stroke animation ao scroll
  - Numbers incrementando
  - Parallax em alternância
- [ ] Usar `useScrollAnimation` hook
- [ ] Adicionar callbacks para analytics

**Entregável:** Timeline renderizando, animações sincronizadas com scroll

---

## FASE 3: 3D AVANÇADO (Semana 3)

### 3.1 Three.js Scene com R3F
**Tarefas:**
- [ ] Criar cena 3D simples:
  - Carregar modelo `.glb` (trator, máquina)
  - Lighting básico (ambient + directional)
  - OrbitControls para interação
- [ ] Implementar `Three3DViewer.tsx`:
  - Canvas com suspense
  - Modelo 3D carregando
  - Botões de controle (reset, download)
  - Responsive no mobile

**Modelo 3D:**
- [ ] Baixar/criar modelo em Sketchfab ou Blender
- [ ] Converter para `.glb` (Babylon exporter)
- [ ] Testar carregamento local
- [ ] Otimizar tamanho (~2-5MB máximo)

**Entregável:** Scene 3D renderizando, interação com mouse funcionando

### 3.2 Integração Three.js + GSAP
**Tarefas:**
- [ ] Adicionar timeline GSAP ao Three.js:
  - Rotação automática ao scroll
  - Zoom baseado em scroll trigger
  - Material morphing (cor ao passar seção)
- [ ] Criar hook `useGSAPTimeline`:
  - Sincronizar scroll → objeto 3D

**Exemplo:**
```typescript
useEffect(() => {
  gsap.to(meshRef.current.rotation, {
    scrollTrigger: {
      trigger: '.section',
      scrub: 1,
    },
    z: Math.PI * 2,
  });
}, []);
```

**Entregável:** 3D sincronizado com scroll, sem frame drops

### 3.3 Performance Optimization
**Tarefas:**
- [ ] Benchmarking:
  - [ ] `npm run build && npm start`
  - [ ] Lighthouse score (target: > 80)
  - [ ] WebGL stats (frame rate > 60fps)
- [ ] Lazy loading:
  - [ ] Canvas 3D só renderiza ao entrar viewport
  - [ ] Rive animations carregam on-demand
  - [ ] GSAP plugins carregam conforme necessário
- [ ] Code splitting:
  - [ ] Separar componentes 3D em chunks
  - [ ] Importar dinâmico de heavy libraries

**Entregável:** Lighthouse > 80, FPS estável em 60

---

## FASE 4: SEÇÕES COMPLETAS (Semana 4)

### 4.1 Hero Section Premium
**Tarefas:**
- [ ] Combinar:
  - Spline 3D (background)
  - GSAP ScrollTrigger (parallax)
  - Motion (title animation)
  - CTA button (Rive state machine)
- [ ] Adicionar:
  - Navigation bar sticky
  - Scroll indicator (Rive)
  - Breadcrumb

**Componente:**
```typescript
<HeroSection
  splineScene="..."
  title="Agroos Premium"
  cta={{ text: "Começar", href: "/signup" }}
/>
```

**Entregável:** Hero section pixel-perfect, todas animações sincronizadas

### 4.2 Features Section
**Tarefas:**
- [ ] Grid 2x2 ou 3x1 de feature cards
- [ ] Cada card com:
  - Rive icon animado
  - GSAP tween no hover
  - Motion layout animation
  - Click → leva para página de feature
- [ ] Scroll reveal com stagger

**Entregável:** Features renderizando com scroll stagger

### 4.3 Three.js Model Showcase
**Tarefas:**
- [ ] Página dedicada: `/products/viewer`
- [ ] Carregar múltiplos modelos:
  - Seletor com tabs
  - GSAP fade between models
  - Rive spinner ao carregar
- [ ] Informações ao lado do modelo

**Entregável:** Múltiplos modelos em viewer interativo

### 4.4 Testimonials/Cases com Scroll
**Tarefas:**
- [ ] Seção de casos/depoimentos
- [ ] GSAP ScrollSmoother (smooth scroll)
- [ ] Motion card stagger
- [ ] Rive rating stars (5 stars animados)

**Entregável:** Section animada, scroll suave

---

## FASE 5: OTIMIZAÇÃO & POLISH (Semana 5)

### 5.1 Acessibilidade & SSR
**Tarefas:**
- [ ] Adicionar `prefers-reduced-motion` respect:
  ```typescript
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!prefersReducedMotion.matches) {
    // Rodar animações
  }
  ```
- [ ] Fallbacks para JS desativado
- [ ] ARIA labels em componentes interativos
- [ ] Testar com screen readers (NVDA, JAWS)

**Entregável:** A11y audit sem issues críticos

### 5.2 Performance Tuning
**Tarefas:**
- [ ] Web Vitals:
  - [ ] LCP < 2.5s (Largest Contentful Paint)
  - [ ] FID < 100ms (First Input Delay)
  - [ ] CLS < 0.1 (Cumulative Layout Shift)
- [ ] Bundle analysis:
  - [ ] Remover unused GSAP plugins
  - [ ] Tree-shake Rive runtime
  - [ ] Compress modelos 3D (.glb → Draco)
- [ ] Cache strategy:
  - [ ] Service worker para assets
  - [ ] CDN para modelos

**Tools:**
```bash
npm install --save-dev webpack-bundle-analyzer
npm run build -- --analyze
```

**Entregável:** Web Vitals all green, bundle < 400kb

### 5.3 SEO & Metadata
**Tarefas:**
- [ ] Meta tags dinâmicas por página
- [ ] Open Graph images
- [ ] Canonical URLs
- [ ] Structured data (schema.org)
- [ ] Sitemap.xml
- [ ] robots.txt

**Exemplo:**
```typescript
export const metadata: Metadata = {
  title: 'Agroos Premium - Tecnologia Agrícola',
  description: 'Platform de análise agrícola com IA',
  openGraph: {
    images: ['/og-image.jpg'],
  },
};
```

**Entregável:** SEO audit sem issues, Social media previews OK

### 5.4 Testing & QA
**Tarefas:**
- [ ] Visual regression testing (Percy, Chromatic)
- [ ] E2E testing (Playwright, Cypress):
  - [ ] Hero section anima ao scroll
  - [ ] Buttons e CTAs funcionam
  - [ ] 3D viewer responde a clicks
  - [ ] Cards têm hover state correto
- [ ] Performance testing:
  - [ ] Scroll performance (60 FPS target)
  - [ ] Load time (< 3s)
  - [ ] Memory usage (< 150MB)

**Entregável:** Testes passando, nenhum bug crítico

---

## FASE 6: DEPLOY & MONITORAMENTO (Semana 6)

### 6.1 Deploy em Vercel
**Tarefas:**
- [ ] Conectar repo GitHub a Vercel
- [ ] Configurar env vars:
  - `NEXT_PUBLIC_ANALYTICS_ID`
  - `SPLINE_SCENE_ID`
  - Etc
- [ ] Preview deployment automático
- [ ] Production deployment
- [ ] Setup custom domain (se houver)

**Entregável:** Site ao vivo em production URL

### 6.2 Analytics & Monitoring
**Tarefas:**
- [ ] Google Analytics 4 setup
- [ ] Sentry para error tracking
- [ ] Web Vitals tracking (via Vercel Analytics)
- [ ] Custom events:
  - [ ] Hero section viewed
  - [ ] Feature card hovered
  - [ ] 3D model interacted
  - [ ] CTA clicked

**Exemplo:**
```typescript
import { usePageViewEvent } from '@/hooks/analytics';

usePageViewEvent('hero_section', {
  scroll_depth: scrollPercentage,
  time_on_page: timeSecs,
});
```

**Entregável:** Analytics dashboard populado com dados

### 6.3 Feedback & Iteração
**Tarefas:**
- [ ] Coletar user feedback:
  - [ ] Hotjar heatmaps
  - [ ] User surveys (com Rive animation!)
  - [ ] Session recordings
- [ ] A/B test animações:
  - [ ] Variante com GSAP vs Motion
  - [ ] Variante com Spline vs Three.js
- [ ] Implementar melhorias top 3

**Entregável:** V1 live com feedback loop iniciado

---

## 📊 MATRIZ DE DECISÃO: 3D Backend

| Escolha | Timeline | Dificuldade | Performance | Flexibilidade | Manutenção |
|---------|----------|-------------|-------------|---------------|-----------|
| **Spline** | ⭐⭐ (2-3d) | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Three.js** | ⭐⭐⭐⭐ (5-7d) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Misto** | ⭐⭐⭐ (4-5d) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recomendação para Agroos:** Começar com **Spline** (rápido), evoluir para **Three.js** (controle).

---

## 🎯 CRITÉRIOS DE SUCESSO POR FASE

### Fase 1 ✅
- [ ] Build sem warnings
- [ ] Estrutura de pastas criada
- [ ] `next.config.js` configurado
- [ ] Lighthouse > 70

### Fase 2 ✅
- [ ] Hero seção renderizando
- [ ] 3 cards com ícones Rive
- [ ] Timeline scroll funcionando
- [ ] FPS > 50

### Fase 3 ✅
- [ ] 3D viewer com modelo carregado
- [ ] Scroll sincronizado com 3D
- [ ] Performance otimizada
- [ ] FPS = 60 estável

### Fase 4 ✅
- [ ] 4+ seções completas
- [ ] Todas animações sincronizadas
- [ ] Navigation fluída
- [ ] Zero layout shifts

### Fase 5 ✅
- [ ] Lighthouse = 90+
- [ ] Web Vitals todos green
- [ ] A11y sem issues críticos
- [ ] Mobile responsive

### Fase 6 ✅
- [ ] Site em produção
- [ ] Analytics funcionando
- [ ] Monitoramento ativo
- [ ] Feedback loop iniciado

---

## 🔄 CICLO DE FEEDBACK

Após cada fase:
1. **Review**: Verificar entregáveis
2. **Test**: Performance, acessibilidade, UX
3. **Feedback**: Coletar de stakeholders
4. **Iterate**: Ajustar baseado em feedback

---

## 📝 DEPENDÊNCIAS EXTERNAS

### Serviços que você precisa:
1. **Spline account** (free tier ok)
   - https://spline.design
2. **Rive account** (free tier ok)
   - https://rive.app
3. **Vercel account** (com GitHub)
   - https://vercel.com
4. **Google Analytics 4** (free)
   - https://analytics.google.com
5. **Sentry** (free tier)
   - https://sentry.io

### Modelos 3D (opcional):
- Sketchfab: https://sketchfab.com (baixar modelos gratuitos)
- TurboSquid: https://www.turbosquid.com (modelos premium)
- Blender marketplace: https://blender.org (criar proprios)

---

## 🚀 COMANDO RÁPIDO PARA START

```bash
# 1. Setup
npm install gsap motion @rive-app/react-canvas @react-three/fiber @react-three/drei three @splinetool/react-spline

# 2. Criar estrutura
mkdir -p src/components/{3d,animations,rive,sections,ui} src/hooks src/context public/{animations,models}

# 3. Scaffold componentes (copiar dos exemplos)
cp INTEGRATION_EXAMPLES.md src/components/

# 4. Build & test
npm run build
npm run dev -- --profile

# 5. Deploy preview
vercel
```

---

**Data de início recomendada:** Próxima segunda-feira  
**Sprint:** 6 semanas, 1-2 semanas buffer  
**Equipe**: 1-2 frontend engineers  
**Budget**: $0-500/mês (hosting + serviços opcionais)

---

## 📞 SUPORTE & RECURSOS

### Documentação Official:
- GSAP: https://gsap.com/docs
- Rive: https://rive.app/docs
- Three.js: https://threejs.org/docs
- Motion: https://motion.dev/docs
- Spline: https://docs.spline.design

### Communities:
- GSAP Codepen: https://codepen.io/gsap
- Three.js Discourse: https://discourse.threejs.org
- Rive Discord: https://community.rive.app

### Alternativas se travar:
- Usar Framer Motion ao invés de Motion
- Usar Babylon.js ao invés de Three.js
- Usar Webflow para landing pages (sem código)

---

**Status Final**: Pronto para execução  
**Última atualização**: 2025-05-14  
**Versão**: 1.0
