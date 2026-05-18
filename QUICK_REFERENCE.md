# Quick Reference: Stack Premium Design

## 🎯 TL;DR - 1 Minuto

**Escolha sua stack:**

```
┌─ QUICK START (Spline + GSAP + Rive)
│  └─ Ideal para: Landing pages premium, sem conhecimento 3D
│  └─ Tempo: 2-3 semanas
│  └─ Instalar: npm install spline gsap @rive-app/react-canvas motion
│
├─ ADVANCED (Three.js + GSAP + Motion)
│  └─ Ideal para: Controle total, app interativa
│  └─ Tempo: 4-6 semanas
│  └─ Instalar: npm install three @react-three/fiber gsap motion
│
└─ HYBRID (Spline para hero, Three.js para showcase)
   └─ Ideal para: Best of both worlds
   └─ Tempo: 5-7 semanas
   └─ Instalar: Tudo acima
```

---

## 📦 PACKAGES A INSTALAR

```bash
# Core (obrigatório)
npm install gsap motion

# Escolha UM:
# Opção 1: Spline (visual, sem código 3D)
npm install @splinetool/react-spline

# Opção 2: Three.js (controle total)
npm install three @react-three/fiber @react-three/drei

# Complementar (recomendado)
npm install @rive-app/react-canvas
```

---

## 🎬 ANIMAÇÕES: CHEAT SHEET

### GSAP (scroll-driven)
```typescript
// Animar ao scroll
gsap.to('.element', {
  scrollTrigger: {
    trigger: '.container',
    start: 'top center',
    scrub: 1, // smooth
  },
  y: 100,
  opacity: 1,
});
```

### Motion (gesture-driven)
```typescript
<motion.div
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  layout
>
  Content
</motion.div>
```

### Rive (state-machine)
```typescript
const { rive, RiveComponent } = useRive({
  src: 'animation.riv',
  stateMachines: 'Machine',
});
const input = useStateMachineInput(rive, 'Machine', 'hover');
return <RiveComponent onMouseEnter={() => input.value = true} />;
```

---

## 🎨 CASOS DE USO RÁPIDOS

| Efeito | Tecnologia | Complexidade | Tempo |
|--------|-----------|-------------|-------|
| Hover button | Motion | ⭐ | 5min |
| Scroll parallax | GSAP | ⭐⭐ | 15min |
| 3D rotação | Spline | ⭐⭐ | 30min |
| 3D custom | Three.js | ⭐⭐⭐⭐ | 2h |
| Icon animado | Rive | ⭐⭐ | 30min |
| Timeline sequencial | GSAP | ⭐⭐⭐ | 1h |

---

## ⚡ PERFORMANCE: GOLDEN RULES

1. **GSAP: sempre use `useGSAP` hook**
   ```typescript
   const { contextSafe } = useGSAP();
   ```

2. **Rive: lazy load canvas**
   ```typescript
   <Suspense fallback={<Spinner />}>
     <RiveComponent />
   </Suspense>
   ```

3. **Three.js: cull meshes fora de viewport**
   ```typescript
   <OrbitControls enablePan={true} />
   ```

4. **GSAP ScrollTrigger: kill triggers on unmount**
   ```typescript
   return () => trigger.kill();
   ```

5. **Bundle: tree-shake plugins não usados**
   ```typescript
   // ❌ Evitar
   import gsap from 'gsap';
   
   // ✅ Preferir
   import gsap from 'gsap';
   import ScrollTrigger from 'gsap/ScrollTrigger';
   ```

---

## 📱 RESPONSIVE: BREAKPOINTS

```typescript
// Usar Tailwind
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Ajustar GSAP conforme tela
const scrub = isMobile ? 0 : 1;
const duration = isMobile ? 0.5 : 2;
```

---

## 🚀 DEPLOYMENT CHECKLIST

```bash
# Antes de fazer push main:
npm run build          # Build sem errors
npm run lint           # Sem warnings
npx lighthouse         # Score > 80
npm run test           # Testes passam

# Depois de push (Vercel auto-deploy):
✅ Analytics funcionando
✅ 3D renderiza em mobile
✅ Animações 60 FPS em todos devices
✅ Nenhum console error
```

---

## 🎭 ANIMATION PATTERNS PRONTOS

### Pattern 1: Fade in on scroll
```typescript
gsap.fromTo(el, { opacity: 0 }, {
  opacity: 1,
  scrollTrigger: { trigger: el, start: 'top 80%' },
});
```

### Pattern 2: Hover scale + shadow
```typescript
<motion.div
  whileHover={{ scale: 1.05, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
/>
```

### Pattern 3: Stagger children
```typescript
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ delay: i * 0.1 }}
    />
  ))}
</motion.div>
```

### Pattern 4: Scroll-driven SVG
```typescript
const path = svgRef.current.querySelector('path');
const length = path.getTotalLength();
gsap.set(path, { strokeDasharray: length });
gsap.to(path, {
  strokeDashoffset: 0,
  scrollTrigger: { trigger: el, scrub: 1 },
});
```

---

## 🔧 TROUBLESHOOTING RÁPIDO

| Problema | Solução |
|----------|---------|
| Animação descontinua | Usar `useGSAP()` hook, não `useEffect` |
| Rive lag em mobile | Trocar canvas → canvas-lite renderer |
| Three.js baixa FPS | Ativar `antialias: false`, reduzir geometria |
| ScrollTrigger não funciona | Registrar: `gsap.registerPlugin(ScrollTrigger)` |
| Spline WASM erro | Verificar `next.config.js` webpack config |
| Memory leak | Kill ScrollTriggers em `useEffect return` |
| Layout shift | Usar `Suspense` com fallback de tamanho fixo |

---

## 💡 DICAS PRO

1. **Usar GSAP `.to()` para animações**, Motion para gestos
2. **Rive para anything < 100kb**, Three.js para anything maior
3. **Spline = design visual**, Three.js = controle programático
4. **Sempre testar mobile** — animações comem mais battery
5. **ScrollTrigger.refresh()** após mudanças DOM
6. **useCallback** em event handlers GSAP
7. **Suspense + lazy()** para componentes 3D
8. **Lighthouse** rodado em CI/CD pipeline

---

## 📊 DECISÃO RÁPIDA: QUAL TECH?

```
Você precisa de...

❓ HERO 3D animada?
  └─ Spline (rápido) ou Three.js (controle)

❓ Cards com hover suave?
  └─ Motion + GSAP

❓ Icons animados com estado?
  └─ Rive

❓ Timeline sequencial ao scroll?
  └─ GSAP ScrollTrigger

❓ 3D model interativo (zoom, rotate)?
  └─ Three.js + OrbitControls

❓ Loader/spinner animado?
  └─ Rive

❓ Scroll parallax background?
  └─ GSAP

❓ Transição página suave?
  └─ Motion (layout prop)
```

---

## 🎓 RECURSOS 10 MIN

1. **GSAP Basics**: https://youtu.be/E-ALY8Lj-yg (10min)
2. **React Three Fiber**: https://youtu.be/7Qlwjd4-6Gw (25min)
3. **Rive State Machines**: https://youtu.be/kZ3qyMzfNJg (15min)
4. **Motion Gestures**: https://youtu.be/QSBnwXhJYLs (10min)

---

## 📞 ERRO? COPY-PASTE ISSO

### GSAP não funciona:
```typescript
// ✅ Correto
'use client';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function Component() {
  useGSAP(() => {
    gsap.to('.el', { duration: 1, y: 100 });
  });
}
```

### Rive lag:
```typescript
// ✅ Trocar renderer
<Rive
  src="animation.riv"
  useOffscreenRenderer={true} // ← isso reduz lag
/>
```

### Three.js preto:
```typescript
// ✅ Adicionar luz
<ambientLight intensity={0.5} />
<directionalLight position={[10, 10, 10]} />
<pointLight position={[-10, -10, 10]} />
```

---

## 🏆 STACK VENCEDOR (RECOMENDADO)

```
┌─────────────────────────────┐
│ Next.js + Tailwind (base)   │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    v             v
 GSAP       Motion/Framer
(scroll)    (gestures)
    │             │
    └──────┬──────┘
           │
    ┌──────┴──────────┐
    │                 │
    v                 v
Spline          Rive Icons
(3D hero)       (UI animate)
    │                 │
    └─────────┬───────┘
              │
         (OPTIONAL)
              │
    ┌─────────┴─────────┐
    │                   │
    v                   v
Three.js         Webflow MCP
(advanced)       (content)
```

**Setup time:** 1 dia  
**Performance:** 90+ Lighthouse  
**Bundle:** ~400kb  
**Mobile:** 60 FPS  
**Maintenance:** Low (stable libraries)

---

## ✅ DEPLOY FINAL

```bash
# 1. Teste local
npm run build && npm start

# 2. Verificar
✅ Lighthouse > 85
✅ Mobile 60 FPS
✅ No console errors
✅ Analytics track

# 3. Push
git commit -m "feat: premium design stack"
git push origin main

# 4. Vercel auto-deploy

# 5. Verificar production
curl https://seu-site.com  # Check 200
```

---

**Última atualização**: 2025-05-14  
**Status**: Pronto para usar  
**Tempo para implementação completa**: 4-6 semanas

Dúvidas? Abra um PR ou ping em `#design-stack` Discord.
