# Stack de Design/Animação/3D para Site Premium

## 📊 Resumo Executivo

Esta é uma análise comparativa de **9 tecnologias** para criar experiências web premium e interativas. Cada uma especializa em um aspecto diferente: 3D, animações avançadas, prototipagem, integração com IA.

**Recomendação Principal**: Usar uma **combinação orquestrada** entre:
- **Spline** ou **Three.js** para 3D (exportado)
- **GSAP** para animações scroll-driven e interativas
- **Rive** para ícones/UI animados com estado
- **Motion** para layout e gestos em React
- **Webflow MCP** para automação de conteúdo (opcional)

---

## 1. SPLINE 3D

### O que faz
Plataforma web para design 3D colaborativo. Cria cenas interativas 3D direto no browser, exportáveis para web, iOS e Android.

### Integração com Next.js
- **React Component**: Importa cena exportada como componente React
- **Export Modes**: Vanilla JS, Three.js, React, Next.js, react-three-fiber
- **WASM + Runtime**: Requer build process quando auto-hospedado
- **API Variables**: Controlar variáveis da cena via código JS

```typescript
// Exemplo: Importar cena Spline em Next.js
import Spline from '@splinetool/react-spline';

export default function HeroSection() {
  return (
    <Spline 
      scene="https://prod.spline.design/YOUR-SCENE-ID/scene.splinejs"
      onLoad={(spline) => {
        // Acessar objetos, animar via eventos
        spline.getFrameAttribute('objeto', 'position')
      }}
    />
  );
}
```

### Casos de uso para site premium
- **Hero 3D**: Landing page com modelo 3D interativo (produtores, máquinas)
- **Product Showcase**: Visualizar produtos em 3D (equipamentos agrícolas)
- **Experience Scroll**: Animar cenas ao scroll (veja Spline como guia de scroll)

### Nível de dificuldade
- **Design**: ⭐⭐ (interface visual, drag-and-drop)
- **Integração**: ⭐⭐⭐ (requer configuração WASM, assets)

### Tipo
- **Plataforma + Exportação**: Design na cloud, exporta código/componente
- **Instalação**: `npm install @splinetool/react-spline`
- **Licensing**: Free (comunidade), Pro/Teams (comercial)

### Pros
✅ Interface visual para design 3D (não precisa codificar 3D)  
✅ Animações baked-in na cena  
✅ Suporte nativo a eventos e interatividade  
✅ Exporta como componente React pronto  

### Cons
❌ Dependência de plataforma Spline (cloud-first)  
❌ Performance: WASM carrega ~2-3MB extra  
❌ Customização limitada pós-export  

---

## 2. THREE.JS

### O que faz
Biblioteca JavaScript 3D de baixo nível. Controle total sobre renderização WebGL, câmeras, iluminação, geometrias e shaders.

### Integração com Next.js
- **React Wrapper**: `react-three-fiber` (abstração excelente)
- **SSR**: Requer `useEffect` para renderizar (canvas é client-only)
- **Performance**: Otimizar com frustum culling, LOD, WebGPU (novo)

```typescript
// Exemplo: Three.js com react-three-fiber
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

export default function Scene3D() {
  return (
    <Canvas>
      <PerspectiveCamera position={[0, 0, 5]} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </Canvas>
  );
}
```

### Casos de uso para site premium
- **3D Model Viewer**: Mostrar máquinas, produtos em rotação
- **Dados Geoespaciais**: Visualizar mapas 3D (propriedades)
- **Particle Effects**: Background 3D animado, efeitos visuais
- **Realtime Collaboration**: Cenas 3D com múltiplos usuários (Websockets)

### Nível de dificuldade
- **Conceitos**: ⭐⭐⭐⭐ (câmeras, luz, shaders requerem compreensão 3D)
- **Setup**: ⭐⭐ (com `react-three-fiber`, é realmente fácil)
- **Performance**: ⭐⭐⭐⭐ (otimizar é desafiador)

### Tipo
- **Biblioteca open-source**: Instalada localmente
- **Instalação**: `npm install three react-three-fiber @react-three/drei`
- **Licensing**: MIT (free)

### Pros
✅ Controle total, comunidade enorme (13.5k+ snippets)  
✅ WebGL + WebGPU suporte  
✅ Integrável com GSAP para timeline 3D  
✅ Modelos 3D (GLTF, OBJ) carregáveis  

### Cons
❌ Curva de aprendizado (conceitos 3D necessários)  
❌ Performance: requer otimização (é pesado por padrão)  
❌ SSR complexo (canvas é client-side)  

---

## 3. GSAP (GREENOCK ANIMATION PLATFORM)

### O que faz
Biblioteca **profissional de animações** para web. Anima CSS, SVG, canvas, WebGL, qualquer propriedade numérica. Scroll-triggers, timelines avançadas.

### Integração com Next.js
- **React Hooks**: `useGSAP` (novo, official)
- **ScrollTrigger**: Animar ao scroll (sem scroll libraries)
- **Timelines**: Sequenciar múltiplas animações
- **Performance**: 60 FPS mesmo com 1000+ elementos

```typescript
// Exemplo: GSAP com React Hooks
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimation() {
  const containerRef = useRef(null);
  
  useGSAP(() => {
    gsap.to('.element', {
      scrollTrigger: {
        trigger: '.container',
        start: 'top center',
        end: 'bottom center',
        scrub: 1, // smooth scroll linking
        markers: true,
      },
      duration: 2,
      y: 100,
      rotation: 360,
      opacity: 1,
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>{/* content */}</div>;
}
```

### Casos de uso para site premium
- **Scroll Animations**: Hero → seção de valores → features (parallax, reveal)
- **Interactive Cards**: Hover efeitos suaves, transformações
- **Timeline Storytelling**: Narrativa visual com sequências
- **Morphing SVG**: Logos animados, ícones que mudam

### Nível de dificuldade
- **Básico**: ⭐⭐ (drag, tween é trivial)
- **Avançado**: ⭐⭐⭐ (timelines, triggers com callbacks)

### Tipo
- **Biblioteca npm**: Instalada localmente
- **Instalação**: `npm install gsap` (ou com plugins: `gsap/ScrollTrigger`)
- **Licensing**: Free (core) / Club (premium plugins: Flip, Observer)

### Pros
✅ Smooth 60 FPS sempre (otimização interna)  
✅ ScrollTrigger integrado (sem dependências externas)  
✅ Timeline sequencing poderoso  
✅ Suporta Three.js + Rive + SVG (agnóstico)  
✅ Documentação excelente + community large  

### Cons
❌ Club subscription para features avançadas (~$99/ano)  
❌ Tamanho: ~60kb minificado (não é tiny)  

---

## 4. RIVE

### O que faz
Plataforma para design e deploy de **animações vetoriais interativas**. Editor WYSIWYG + runtime JS. State machines para lógica interativa.

### Integração com Next.js
- **React Component**: `<Rive>` (drop-in)
- **Hooks**: `useRive`, `useStateMachineInput` (controlar interatividade)
- **Renderers**: canvas-lite, canvas, webgl2 (escolher conforme performance)
- **Event Binding**: Click, hover, scroll → state machine inputs

```typescript
// Exemplo: Rive com state machine interativo
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

export default function AnimatedButton() {
  const { rive, RiveComponent } = useRive({
    src: 'button.riv',
    stateMachines: 'ButtonMachine',
    autoplay: true,
  });

  const isHovered = useStateMachineInput(rive, 'ButtonMachine', 'isHovered');
  const clickTrigger = useStateMachineInput(rive, 'ButtonMachine', 'onClick');

  return (
    <div
      onMouseEnter={() => isHovered && (isHovered.value = true)}
      onMouseLeave={() => isHovered && (isHovered.value = false)}
      onClick={() => clickTrigger?.fire()}
    >
      <RiveComponent style={{ width: 200, height: 100 }} />
    </div>
  );
}
```

### Casos de uso para site premium
- **UI Animations**: Botões, toggles, menus animados com estado
- **Loading States**: Loaders sofisticados (não GIFs estáticos)
- **Icon Animations**: Ícones que mudam ao interagir
- **Onboarding**: Mascote/guia animado que reage ao progresso

### Nível de dificuldade
- **Design**: ⭐⭐⭐ (state machines requerem lógica visual)
- **Integração**: ⭐⭐ (React hooks simples)

### Tipo
- **Plataforma + Exportação**: Design na cloud, exporta `.riv` + runtime
- **Instalação**: `npm install @rive-app/react-canvas`
- **Licensing**: Free (comunidade), Team (colaboração)

### Pros
✅ State machines para lógica interativa (não é "dumb animation")  
✅ Vetor = escalável, pequeno tamanho (~50-200kb)  
✅ Hooks React simples para controlar animações  
✅ Suporta web, iOS, Android (code reuse)  

### Cons
❌ Curva aprendizado de state machines  
❌ Ecosistema menor que GSAP/Three.js  

---

## 5. MOTION (FRAMER MOTION 2.0+)

### O que faz
Biblioteca de animações **moderna para React**. Layout animations, gesture recognition, drag-to-reorder, spring physics.

### Integração com Next.js
- **React Components**: `<motion.div>`, `<motion.button>` (drop-in)
- **Layout Prop**: Animar mudanças de layout automaticamente
- **Gestures**: `whileHover`, `whileTap`, `whileDrag` built-in
- **Variants**: Sistema de estado para composição

```typescript
// Exemplo: Motion com gesture animations
import { motion } from 'motion/react';

export default function InteractiveCard() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <h2>Interactive Card</h2>
    </motion.div>
  );
}
```

### Casos de uso para site premium
- **Layout Reflow Animations**: Grids que reorganizam suave
- **Gesture Interactions**: Swipe, drag para navegar
- **Micro-interactions**: Buttons que pulam, cards que flip
- **Shared Layout**: Elementi que "morpham" entre páginas

### Nível de dificuldade
- **Básico**: ⭐ (props declarativas)
- **Avançado**: ⭐⭐⭐ (custom timings, physics)

### Tipo
- **Biblioteca npm**: Instalada localmente
- **Instalação**: `npm install motion`
- **Licensing**: MIT (free)

### Pros
✅ Feito para React (hooks, component API integrada)  
✅ Layout animations automáticas (não precisa codificar)  
✅ Spring physics realista  
✅ Zero runtime cost (otimizações internas)  
✅ Melhor alternativa a Framer Motion  

### Cons
❌ Menos poderoso que GSAP para timelines complexas  
❌ Sem ScrollTrigger built-in (integrar com Scroll)  

---

## 6. RIVE + GSAP (INTEGRAÇÃO)

### Como funcionam juntos
```typescript
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollDrivenRive() {
  const { rive, RiveComponent } = useRive({
    src: 'animation.riv',
    stateMachines: 'ScrollMachine',
    autoplay: false, // Controlar via GSAP
  });

  const progress = useStateMachineInput(rive, 'ScrollMachine', 'progress', 0);

  useEffect(() => {
    gsap.to(progress, {
      scrollTrigger: {
        trigger: '.section',
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
      },
      value: 100,
      duration: 1,
    });
  }, [progress]);

  return <RiveComponent />;
}
```

**Caso de Uso**: Ícone de progresso que avança ao scroll, com animação fluida via GSAP.

---

## 7. WEBFLOW MCP

### O que faz
Servidor Model Context Protocol que conecta Claude/IA diretamente a projetos Webflow. Gerencia conteúdo, cria componentes, audita sites via prompts naturais.

### Integração com Next.js
- **Não integra diretamente**: Webflow é plataforma concorrente (no-code builder)
- **Hybrid Approach**: Webflow para páginas estáticas/conteúdo, Next.js para app logic
- **Headless CMS**: Usar Webflow como CMS, servir conteúdo via API
- **MCP Bridge**: Claude Code pode gerenciar Webflow enquanto você desenvolve Next.js

```bash
# Usar Webflow MCP para auditar/gerar conteúdo
# Claude faz isso automaticamente se configurado
webflow-mcp create-hero-section "Premium Agriculture Platform"
webflow-mcp audit-links
webflow-mcp add-collection "Producers"
```

### Casos de uso para site premium
- **Landing Pages**: Criar heroes, seções, CTAs (sem código)
- **Content Audit**: Verificar links quebrados, SEO, alt text
- **CMS Automation**: Popular coleções com dados (IA gera conteúdo)
- **Component Library**: Webflow como design system

### Nível de dificuldade
- **Setup**: ⭐⭐ (OAuth, 5 minutos)
- **Uso**: ⭐ (prompts naturais)

### Tipo
- **MCP Server**: Não é instalação local, é API/serviço
- **Tipo**: Cloud-based, integra com Claude Desktop/Code
- **Licensing**: Webflow standard (~$12-36/mês) + MCP Bridge (free)

### Pros
✅ Zero código para criar páginas bonitas  
✅ IA gerencia conteúdo e estrutura  
✅ Integração perfeita com Claude  
✅ Colaboração em tempo real  

### Cons
❌ Locked-in Webflow (difícil exportar/customizar)  
❌ Performance: Webflow é lento vs Next.js  
❌ Limites de customização avançada  

---

## 8. BLENDER MCP

### O que faz
Servidor MCP que conecta Claude ao Blender (software 3D). Criar, editar, animar modelos 3D via prompts naturais.

### Integração com Next.js
- **Workflow Offline**: Blender → Export GLTF → Three.js ou Spline
- **Asset Generation**: Claude gerando modelos 3D proceduralmente
- **Animation Baking**: Exportar animações pre-renderizadas para web

```python
# Exemplo: Blender Python API (via MCP)
import bpy

# Criar cubo
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object

# Animar
cube.keyframe_insert(data_path="location", index=0, frame=1)
cube.location.x = 10
cube.keyframe_insert(data_path="location", index=0, frame=120)

# Exportar como GLTF
bpy.ops.export_scene.gltf(filepath="scene.gltf", use_animations=True)
```

### Casos de uso para site premium
- **Asset Generation**: Claude gera modelos 3D (máquinas, plantas)
- **Batch Rendering**: Exportar múltiplos ângulos para galeria
- **Animation Baking**: Pre-renderizar animações complexas como vídeo
- **Procedural Content**: Gerar variações de modelos

### Nível de dificuldade
- **Blender Knowledge**: ⭐⭐⭐⭐ (requer expertise 3D)
- **MCP Integration**: ⭐⭐ (configuração simples)

### Tipo
- **MCP Server**: Não é npm package, é integração com Blender desktop
- **Instalação**: Blender 4.0+ + MCP server bridge
- **Licensing**: Blender é open-source (free)

### Pros
✅ Professional 3D capabilities  
✅ Automação via IA  
✅ Exportação para web-friendly formats  

### Cons
❌ Requer Blender desktop rodando (não serverless)  
❌ Workflow offline (não integra real-time com web)  
❌ Curva aprendizado 3D muito alta  

---

## 9. STITCH AI MCP

### O que faz
Servidor MCP para gerenciar **memória distribuída de AI agents**. Permite que Claude (e outros agents) armazenem e recuperem contexto entre sessões.

### Integração com Next.js
- **Não integra diretamente com Next.js**: É para agent memory
- **Use Case**: Claude mantém contexto sobre seu projeto entre sessões
- **Exemplo**: "Lembrar que o usuário quer X para o site"

```typescript
// Claude pode usar Stitch Memory para lembrar contexto
// Quando você volta numa próxima sessão, Claude recupera:
// "Memo: User wants premium animations for AgroOS landing page"
// → Automático, não precisa reexplicar
```

### Casos de uso para site premium
- **Development Context**: Manter histórico de decisões (why we chose GSAP)
- **Brand Guidelines**: Memória de cores, fonts, tone
- **Feature Backlog**: Claude lembra do que falta fazer

### Nível de dificuldade
- **Setup**: ⭐ (configuração JSON)
- **Uso**: ⭐ (automático, Claude usa transparente)

### Tipo
- **MCP Server**: Cloud service, integra com Claude Desktop
- **Instalação**: Configuração em `.claude/config.json`
- **Licensing**: Free (Stitch open-source)

### Pros
✅ Continuidade entre sessões  
✅ Zero overhead (Claude usa transparente)  
✅ Open-source e descentralizado  

### Cons
❌ Não melhora site diretamente (é meta)  
❌ Requer confiança em armazenar dados  

---

## PROTOPIE (não recomendado para Next.js)

ProtoPie é **prototipagem mobile-first** (interações iOS/Android). Não tem documentação clara para web/React. Uso limitado em sites premium. **Skip para este stack.**

---

# 🗺️ MAPA ARQUITETURAL: COMO TUDO FUNCIONA JUNTO

```
┌─────────────────────────────────────────────────────────┐
│          NEXT.JS APP ROUTER (Produção)                  │
│        TypeScript, Tailwind, App Router                 │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        v                v                v
   ┌─────────┐      ┌──────────┐    ┌──────────┐
   │ SPLINE  │      │THREE.JS  │    │  MOTION  │
   │  (3D)   │      │(Advanced)│    │(Gestures)│
   │  Hero   │      │ Scene    │    │ Layout   │
   │         │      │          │    │          │
   └────┬────┘      └──────────┘    └──────────┘
        │
        │  Export → React Component
        │
   ┌─────────────────────────────────────────┐
   │   GSAP (Orchestrator) - 60 FPS          │
   │   ScrollTrigger + Timeline Control      │
   │   └─ Animar tudo acima em sequência    │
   └──────────┬──────────────────────────────┘
              │
        ┌─────┴─────┬───────────┬──────────┐
        │           │           │          │
        v           v           v          v
    ┌────────┐  ┌──────┐  ┌──────────┐  ┌──────┐
    │  RIVE  │  │ SVG  │  │CSS/DOM   │  │Canvas│
    │ Icons  │  │      │  │ Elements │  │      │
    │ States │  │      │  │          │  │      │
    └────────┘  └──────┘  └──────────┘  └──────┘
        │
        └─ (State Machines) ← React onHover/onClick


┌──────────────────────────────────────┐
│   UTILITIES & SUPPORT                │
├──────────────────────────────────────┤
│ WEBFLOW MCP: Gerencia conteúdo CMS   │
│ STITCH AI: Memória do projeto (meta) │
│ BLENDER MCP: Gera assets offline      │
└──────────────────────────────────────┘
```

---

# 📋 RECOMENDAÇÃO PARA SITE PREMIUM (AGROOS)

## Stack Recomendado

### Core (Obrigatório)
1. **Next.js App Router** (base)
2. **GSAP** (maestro de animações)
3. **Rive** (UI componentes animados)
4. **Motion** (gestos + layout)

### 3D (Escolha uma)
- **Spline**: Se quiser designer visual, menos controle
- **Three.js**: Se quiser máximo controle, sem designer visual

### Plus (Opcional)
- **Webflow MCP**: Automação de landing pages (marketing)
- **Blender MCP**: Geração de assets 3D proceduralmente

---

## Estrutura de Pasta

```
/apps/agroos
├── /src
│   ├── /components
│   │   ├── HeroSection.tsx (Spline ou Three.js)
│   │   ├── AnimatedCard.tsx (Motion + GSAP)
│   │   ├── IconButton.tsx (Rive state machine)
│   │   └── ScrollTimeline.tsx (GSAP ScrollTrigger)
│   ├── /scenes (Three.js R3F scenes)
│   ├── /public/animations
│   │   ├── /*.riv (Rive files)
│   │   ├── /*.glb (3D models)
│   │   └── /*.splinejs (Spline exports)
│   └── /pages
├── next.config.js
└── package.json
```

---

## Instalação Recomendada

```bash
npm install \
  gsap \
  motion \
  @rive-app/react-canvas \
  @react-three/fiber @react-three/drei three \
  @splinetool/react-spline

# Opcional
npm install @gsap/react
```

---

## Exemplo: Home Premium com Tudo Integrado

```typescript
// apps/agroos/src/pages/index.tsx
import { Canvas } from '@react-three/fiber';
import { motion } from 'motion/react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import Spline from '@splinetool/react-spline';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const scrollRef = useRef(null);
  const { rive, RiveComponent } = useRive({
    src: '/animations/hero-state.riv',
    stateMachines: 'interaction',
    autoplay: true,
  });

  const isHovered = useStateMachineInput(rive, 'interaction', 'isHovered');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-title', {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top center',
          end: 'center center',
          scrub: 1,
        },
        y: -100,
        opacity: 1,
        duration: 2,
      });

      gsap.to('.features-grid', {
        scrollTrigger: {
          trigger: '.features',
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
        },
        y: -50,
        duration: 1,
      });
    }, scrollRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={scrollRef} className="overflow-x-hidden">
      {/* Hero com Spline 3D */}
      <section className="hero relative h-screen">
        <Spline scene="https://prod.spline.design/SCENE-ID/scene.splinejs" />
        <motion.h1
          className="hero-title absolute bottom-20 left-10"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Agroos Premium
        </motion.h1>
      </section>

      {/* Features com Motion + Rive */}
      <section className="features-grid py-20 px-10">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className="feature-card p-6 rounded-lg border"
            onMouseEnter={() => isHovered && (isHovered.value = true)}
            onMouseLeave={() => isHovered && (isHovered.value = false)}
          >
            <RiveComponent style={{ width: 50, height: 50 }} />
            <h3>Feature {i}</h3>
          </motion.div>
        ))}
      </section>

      {/* 3D Interactive com Three.js */}
      <section className="h-screen">
        <Canvas>
          {/* 3D geometry aqui */}
        </Canvas>
      </section>
    </div>
  );
}
```

---

# ✅ CHECKLIST DE IMPLEMENTAÇÃO

Para um site premium com Agroos:

- [ ] Instalar stack core (GSAP, Motion, Rive)
- [ ] Escolher 3D (Spline vs Three.js)
- [ ] Criar hero section com 3D + animação scroll
- [ ] Implementar botões/ícones com Rive state machines
- [ ] Adicionar scroll timelines (GSAP ScrollTrigger)
- [ ] Gesture interactions em cards (Motion whileTap)
- [ ] Testar performance (60 FPS target)
- [ ] Otimizar bundle size (GSAP é ~60kb, Rive ~100kb)
- [ ] SEO: Toda animação deve ser fallback friendly
- [ ] A11y: Respeitar `prefers-reduced-motion`

---

# 🔗 REFERÊNCIAS & DOCUMENTAÇÃO

| Tech | Doc | MCP? |
|------|-----|------|
| Spline | https://docs.spline.design | ❌ |
| Three.js | https://threejs.org/docs | ❌ |
| GSAP | https://gsap.com/docs | ❌ |
| Rive | https://rive.app/docs | ❌ |
| Motion | https://motion.dev/docs | ❌ |
| Webflow | https://developers.webflow.com/mcp | ✅ |
| Blender | https://docs.blender.org | ✅ |
| Stitch AI | https://github.com/StitchAI | ✅ |

---

**Última atualização**: 2025-05-14  
**Status**: Pronto para implementação
