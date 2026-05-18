# Exemplos Práticos: Integrando Tecnologias Premium

Este documento contém exemplos code-ready para implementar o stack de design premium em Agroos.

---

## 1. HERO SECTION COM SPLINE 3D + GSAP SCROLL

### Arquivo: `src/components/HeroSpline.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSpline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      // Animar título ao entrar na viewport
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 1,
          },
        }
      );

      // Parallax effect no scroll
      gsap.to('.spline-container', {
        y: -100,
        opacity: 0.8,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
          pin: true, // Fix na viewport enquanto anima
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSplineLoad = (spline: any) => {
    // Acessar objetos da cena Spline
    console.log('Cena Spline carregada', spline);
    
    // Exemplo: Animar objeto quando houver scroll
    if (spline.getFrameAttribute) {
      spline.addEventListener('mouseDown', () => {
        console.log('Clicou na cena 3D');
      });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
      {/* Container Spline 3D */}
      <div className="spline-container absolute inset-0">
        <Spline
          scene="https://prod.spline.design/YOUR-SCENE-ID/scene.splinejs"
          onLoad={handleSplineLoad}
        />
      </div>

      {/* Texto sobre 3D */}
      <div
        ref={titleRef}
        className="absolute inset-0 flex items-center justify-center text-center z-10"
      >
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold text-white mb-4">
            Tecnologia Agrícola Premium
          </h1>
          <p className="text-lg text-gray-200">
            Transforme sua propriedade com Agroos
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Uso em página:
```typescript
// pages/index.tsx
import HeroSpline from '@/components/HeroSpline';

export default function Home() {
  return (
    <main>
      <HeroSpline />
      {/* Resto do conteúdo */}
    </main>
  );
}
```

---

## 2. CARDS ANIMADOS COM MOTION + RIVE ICONS

### Arquivo: `src/components/AnimatedFeatureCard.tsx`

```typescript
'use client';

import { motion } from 'motion/react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useState } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  riveAnimation: string;
  stateMachine: string;
  icon: string;
}

export default function AnimatedFeatureCard({
  title,
  description,
  riveAnimation,
  stateMachine,
  icon,
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { rive, RiveComponent } = useRive({
    src: riveAnimation,
    stateMachines: stateMachine,
    autoplay: true,
  });

  // Controlar estado do ícone Rive ao hover
  const hoverInput = useStateMachineInput(rive, stateMachine, 'isHovered', false);

  const handleHoverStart = () => {
    setIsHovered(true);
    if (hoverInput) {
      hoverInput.value = true;
    }
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
    if (hoverInput) {
      hoverInput.value = false;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-8 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
    >
      {/* Ícone animado Rive */}
      <div className="w-16 h-16 mb-4">
        <RiveComponent style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Título animado */}
      <motion.h3
        className="text-xl font-semibold text-gray-900 mb-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.h3>

      {/* Descrição */}
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

      {/* Underline animada no hover */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
        initial={{ width: 0 }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
```

### Uso em componente de features:
```typescript
// components/FeaturesSection.tsx
import AnimatedFeatureCard from './AnimatedFeatureCard';

const features = [
  {
    title: 'Análise de Solo',
    description: 'IA avançada para análise completa do solo',
    riveAnimation: '/animations/soil-analysis.riv',
    stateMachine: 'AnalysisMachine',
    icon: 'soil',
  },
  {
    title: 'Monitoramento 24h',
    description: 'Sensores IoT em tempo real',
    riveAnimation: '/animations/monitoring.riv',
    stateMachine: 'MonitorMachine',
    icon: 'monitor',
  },
  // ... mais features
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-10">
      <h2 className="text-4xl font-bold mb-12 text-center">Recursos Premium</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <AnimatedFeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
```

---

## 3. SCROLL TIMELINE COM GSAP + SVG MORPHING

### Arquivo: `src/components/ScrollTimeline.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const timeline = [
  { step: 1, title: 'Análise', description: 'Coleta de dados do solo' },
  { step: 2, title: 'Processamento', description: 'IA processa informações' },
  { step: 3, title: 'Recomendação', description: 'Sistema gera insights' },
  { step: 4, title: 'Implementação', description: 'Ações na fazenda' },
];

export default function ScrollTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray('.timeline-step') as HTMLElement[];

      // Animar cada passo ao scroll
      steps.forEach((step, index) => {
        gsap.fromTo(
          step,
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            scrollTrigger: {
              trigger: step,
              start: 'top 80%',
              end: 'top 50%',
              scrub: 1,
            },
          }
        );

        // Animar números
        const number = step.querySelector('.step-number');
        if (number) {
          gsap.fromTo(
            number,
            { textContent: '0' },
            {
              textContent: index + 1,
              duration: 0.5,
              snap: { textContent: 1 },
              scrollTrigger: {
                trigger: step,
                start: 'top 80%',
                end: 'top 50%',
                scrub: 1,
              },
            }
          );
        }
      });

      // Animar linha conectora SVG
      const path = svgRef.current?.querySelector('path');
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 2,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top center',
            end: 'bottom center',
            scrub: 1,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="py-32 px-10 bg-gradient-to-b from-white to-gray-50"
    >
      <h2 className="text-4xl font-bold mb-20 text-center">Como Funciona</h2>

      <div className="relative max-w-4xl mx-auto">
        {/* SVG linha conectora */}
        <svg
          ref={svgRef}
          className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-1 pointer-events-none"
          viewBox="0 0 2 1000"
          preserveAspectRatio="none"
        >
          <path
            d="M 1 0 Q 1 500 1 1000"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Steps */}
        <div className="space-y-32">
          {timeline.map((item, index) => (
            <div
              key={item.step}
              className="timeline-step flex gap-8 items-start"
            >
              {/* Círculo indicador */}
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold relative z-10">
                <span className="step-number">0</span>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>

              {/* Alternância lado */}
              {index % 2 === 0 && (
                <div className="flex-shrink-0 w-32 h-32 bg-gray-200 rounded-lg" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 4. THREE.JS 3D INTERACTIVE COM R3F

### Arquivo: `src/components/Three3DViewer.tsx`

```typescript
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';

// Componente para carregar modelo GLTF
function ModelViewer({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  const [isRotating, setIsRotating] = useState(false);

  return (
    <primitive object={scene} scale={1.5} onClick={() => setIsRotating(!isRotating)} />
  );
}

export default function Three3DViewer() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full h-screen bg-gradient-to-br from-gray-900 to-gray-950 relative overflow-hidden"
    >
      {/* Título overlay */}
      <div className="absolute top-10 left-10 z-10">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white"
        >
          Visualizador 3D
        </motion.h2>
        <p className="text-gray-400 mt-2">Arraste para rotacionar, scroll para zoom</p>
      </div>

      {/* Canvas Three.js */}
      <Suspense fallback={<div className="text-white text-center pt-20">Carregando...</div>}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          onCreated={() => setIsLoaded(true)}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, 10]} color="cyan" intensity={0.3} />

          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />

          {/* Modelo */}
          <ModelViewer modelPath="/models/tractor.glb" />

          {/* Controles */}
          <OrbitControls
            autoRotate
            autoRotateSpeed={4}
            enableZoom
            enablePan
            maxDistance={15}
            minDistance={2}
          />
        </Canvas>
      </Suspense>

      {/* Botões de controle overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
        >
          Reset Câmera
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
        >
          Download Modelo
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
```

### Uso:
```typescript
// pages/visualizer.tsx
import Three3DViewer from '@/components/Three3DViewer';

export default function VisualizerPage() {
  return <Three3DViewer />;
}
```

---

## 5. GSAP SCROLLTRIGGER COM CALLBACK EVENTS

### Arquivo: `src/hooks/useScrollAnimation.ts`

```typescript
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationConfig {
  trigger: string;
  start?: string;
  end?: string;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
  markers?: boolean;
}

export function useScrollAnimation(config: ScrollAnimationConfig) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: config.trigger || elementRef.current,
      start: config.start || 'top center',
      end: config.end || 'bottom center',
      markers: config.markers || false,
      onEnter: config.onEnter,
      onLeave: config.onLeave,
      onEnterBack: config.onEnterBack,
      onLeaveBack: config.onLeaveBack,
    });

    return () => trigger.kill();
  }, [config]);

  return elementRef;
}
```

### Uso em componente:
```typescript
'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useState } from 'react';

export default function ScrollAnalyticsComponent() {
  const [viewCount, setViewCount] = useState(0);

  const ref = useScrollAnimation({
    trigger: '.analytics-section',
    start: 'top center',
    onEnter: () => {
      console.log('Seção entrou em viewport');
      setViewCount((v) => v + 1);
      // Dispara evento de analytics
      window.gtag?.('event', 'scroll_analytics_viewed', { view_count: viewCount });
    },
  });

  return (
    <div ref={ref} className="analytics-section py-20">
      <h2>Analytics Premium</h2>
      <p>Views: {viewCount}</p>
    </div>
  );
}
```

---

## 6. RIVE STATE MACHINE COM REACT CONTEXT

### Arquivo: `src/context/RiveAnimationContext.tsx`

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

interface RiveAnimationContextType {
  rive: any;
  RiveComponent: React.ComponentType;
  triggerAnimation: (name: string) => void;
  setInputValue: (name: string, value: any) => void;
}

const RiveAnimationContext = createContext<RiveAnimationContextType | undefined>(
  undefined
);

export function RiveAnimationProvider({
  src,
  stateMachines,
  children,
}: {
  src: string;
  stateMachines: string;
  children: ReactNode;
}) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines,
    autoplay: true,
  });

  const triggerAnimation = (name: string) => {
    const trigger = useStateMachineInput(rive, stateMachines, name);
    if (trigger) {
      trigger.fire?.();
    }
  };

  const setInputValue = (name: string, value: any) => {
    const input = useStateMachineInput(rive, stateMachines, name);
    if (input) {
      input.value = value;
    }
  };

  return (
    <RiveAnimationContext.Provider
      value={{ rive, RiveComponent, triggerAnimation, setInputValue }}
    >
      {children}
    </RiveAnimationContext.Provider>
  );
}

export function useRiveAnimation() {
  const context = useContext(RiveAnimationContext);
  if (!context) {
    throw new Error('useRiveAnimation deve ser usado dentro de RiveAnimationProvider');
  }
  return context;
}
```

---

## 7. PERFORMANCE OPTIMIZATION: LAZY LOADING 3D

### Arquivo: `src/components/LazyCanvas.tsx`

```typescript
'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';

const Three3DViewer = lazy(() => import('./Three3DViewer'));
const SplineScene = lazy(() => import('./HeroSpline'));

export default function LazyCanvas({
  type = '3d',
}: {
  type: '3d' | 'spline';
}) {
  return (
    <div className="relative w-full h-screen bg-gray-100">
      <Suspense
        fallback={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-semibold">Carregando cena...</p>
            </div>
          </motion.div>
        }
      >
        {type === '3d' ? <Three3DViewer /> : <SplineScene />}
      </Suspense>
    </div>
  );
}
```

---

## 8. PACKAGE.JSON RECOMENDADO

```json
{
  "name": "agroos-premium",
  "version": "1.0.0",
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.3.0",
    "gsap": "^3.12.2",
    "motion": "^10.15.0",
    "@rive-app/react-canvas": "^4.8.0",
    "@react-three/fiber": "^8.14.0",
    "@react-three/drei": "^9.92.0",
    "three": "^r156.0.0",
    "@splinetool/react-spline": "^3.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 9. NEXT.CONFIG.JS OTIMIZADO

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações de produção
  swcMinify: true,
  poweredByHeader: false,

  // Webpack customization para GLTF/GLB
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/models/[hash][ext][query]',
      },
    });

    // Para Spline WASM
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

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.spline.design',
      },
      {
        protocol: 'https',
        hostname: 'rive.app',
      },
    ],
  },

  // Headers para performance
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

---

## 10. CHECKLIST DE IMPLEMENTAÇÃO

```bash
# 1. Instalar dependências
npm install gsap motion @rive-app/react-canvas @react-three/fiber @react-three/drei three @splinetool/react-spline

# 2. Criar estrutura de pastas
mkdir -p src/components src/hooks src/scenes public/animations public/models

# 3. Testar build
npm run build

# 4. Testar performance
npm run dev -- --profile

# 5. Deploy
npm run build && npm start
```

---

**Status**: Pronto para copiar e colar em seu projeto  
**Nível**: Intermediário-Avançado  
**Tempo de implementação**: 2-4 semanas para site premium completo
