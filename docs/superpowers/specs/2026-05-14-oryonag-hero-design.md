# OryonAG Hero Section — Design Spec

**Data:** 2026-05-14  
**Projeto:** Landing Page Pública — OryonAG Ecossistema  
**Objetivo:** Criar Hero section cinematográfico com 3D interativo que maximize impacto visual e conversão  
**Status:** Design Approved, Ready for Implementation Planning

---

## 1. VISÃO GERAL

O Hero section é a primeira experiência do visitante. Deve comunicar em 3-5 segundos:
- **O que é:** Inteligência que conecta o agro ao futuro
- **Como:** Marketplace + ERP + Crédito integrados
- **Por quê:** Brasil merece tecnologia de ponta

**Abordagem escolhida:** Split Dinâmica + elementos de Imersiva Tech
- Layout dual: vídeo esquerda (60%) + 3D interativo direita (40%)
- Textos em centro para máxima legibilidade
- 3D reativo ao mouse, bandeiras dinâmicas
- Vídeo multi-cena com transição suave

---

## 2. LAYOUT & ESTRUTURA

### Desktop (1024px+)

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│  🎥 VÍDEO LEFT      │  3D MAP RIGHT       │
│  (60%)              │  (40%)              │
│                     │                     │
│  • Amanhecer        │  • Mapa Brasil      │
│  • Drone aéreo      │  • 6 Bandeiras      │
│  • Colheita         │  • Pontos acesos    │
│                     │                     │
│  ┌───────────────┐  │  🌍 Interactive    │
│  │ CENTER TEXT   │  │  • Rotação contínua│
│  │ Oryon AG      │  │  • Glow on hover   │
│  │ Inteligência  │  │  • Follow mouse    │
│  │ ...           │  │  • Bandeiras pulse │
│  │               │  │                     │
│  │ [CTA 1][CTA2] │  │                     │
│  └───────────────┘  │                     │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

### Mobile (<1024px)

Stack vertical:
1. Vídeo full width
2. 3D map pequeno (canto inferior direito)
3. Texto centered
4. CTAs

---

## 3. COMPONENTES

### 3.1 — Vídeo Background (Esquerda)

**Especificações:**
- **Duração:** 12 segundos (loop)
- **Cenas (com transição fade 0.5s):**
  1. Amanhecer em campo (0-4s) — golden hour, produtor cuidando de plantação
  2. Drone sobrevoando (4-8s) — vista aérea, plantação verde
  3. Colheita/máquina (8-12s) — ação, tecnologia
- **Codecs:** MP4 H.264 (fallback WebM VP9)
- **Resolução:** 1920x1080 mínimo
- **File size:** <10MB (otimizado)
- **Overlay:**
  - Gradient radial: rgba(2,12,5, 0.4) no centro
  - Gradient linear: rgba(2,12,5, 0.6) topo a baixo

**Animações:**
- Fade in: 1s ease-out ao carregar
- Parallax sutil: -5% y transform ao scroll (cria profundidade)
- Play automático, muted, loop

---

### 3.2 — Mapa 3D Interativo (Direita)

**Tecnologia:**
- Usar **Three.js** (render customizado) OU **Babylon.js** (mais leve)
- Fallback: Canvas 2D com bandeiras e partículas

**Elementos 3D:**

#### **Mapa Brasil**
- Geometria: Projeção Mercator ou custom mesh do Brasil
- Cor: `#022c14` (verde escuro com brilho)
- Glow effect: `#4ade80` 0.3 opacity (shader)
- Rotação: eixo Y, 45s/volta (0.08°/frame)

#### **Pontos de Fazenda (Nodes)**
- Quantidade: 15-25 pontos distribuídos pelo Brasil
- Cor base: `#22c55e`
- Animação: Pulsing glow
  ```
  box-shadow: 0 0 0 0 rgba(34,197,94,0.6)
  animation: pulse 2.5s infinite
  ```
- Hover: size +50%, glow intensity 2x
- Click: mostra tooltip "Fazenda em [região]"

#### **Bandeiras (6 países)**
- **Ordem e Posição:**
  1. 🇧🇷 Brasil — topo (destaque maior, 40px)
  2. 🇮🇱 Israel — superior esquerdo
  3. 🇮🇳 Índia — superior direito
  4. 🇨🇳 China — inferior esquerdo
  5. 🇺🇸 EUA — inferior direito
  6. 🇪🇺 Europa (porta-bandeira) — direita (Portugal/Holanda/Alemanha/França rotativo)

- **Animação:**
  - Aparecem em cascade: 100ms apart
  - Posição: orbitando ao redor do mapa (raio 280px)
  - Velocidade: 60s/volta (mais lento que mapa)
  - Hover: zoom 1.3x, glow `#4ade80`
  - Click: abre link para insights daquele país

**Partículas Constellation (orbitando mapa):**
- 12-16 pequenos nós
- Cor: `rgba(74,222,128, 0.4)`
- Tamanho: 2-4px
- Órbita: raio 320px, 70s/volta
- Linhas de conexão: aparecem/desaparecem dinamicamente

**Interatividade:**
- **Mouse hover:** Mapa rotação acaba, 3D aponta para cursor (lerp 0.1s)
- **Mouse move:** Mapa segue curso suavemente
- **Mouse out:** Retorna à rotação automática em 0.5s
- **Toque (mobile):** Tilt device muda ângulo view

---

### 3.3 — Textos (Center)

**Posicionamento:**
- Absolutamente centrado (center-left para desktop, full-center mobile)
- Z-index: acima do vídeo + 3D
- Backdrop: blur 8px (opcional, para legibilidade)

**Elementos:**

#### **Label (Eyebrow)**
```
Status: "ORYON AG — Agtech Brasileiro"
Style: DM Mono, 11px, #4ade80
Icon: Pulsing dot (2px, #4ade80)
Animation: Fade in + slide up 0.3s ease
```

#### **Título (H1)**
```
"Inteligência que
conecta o agro
ao futuro."

Font: Fraunces, 96px (clamp 48-96)
Weight: 900
Color: #f0fdf4 (main) + gradient em "conecta"
Line-height: 1.0
Letter-spacing: -0.03em
Animation: Fade up + scale 0.95→1 (0.7s ease, delay 0.12s)

Gradient em "conecta":
background: linear-gradient(90deg, #22c55e, #4ade80, #86efac, #22c55e)
background-size: 300% auto
animation: shimmer 6s linear infinite
```

#### **Subtítulo**
```
"Marketplace agrícola, sistema operacional de fazenda
e crédito rural inteligente — três plataformas integradas
em um único ecossistema."

Font: DM Sans, 18px (clamp 16-20)
Weight: 300
Color: #4a7c5c
Line-height: 1.65
Max-width: 560px
Animation: Fade up + slide up (0.7s ease, delay 0.28s)
```

#### **CTAs (2 botões)**
```
Button 1: "Criar conta grátis"
- Background: #22c55e
- Color: #020c05
- Padding: 14px 32px
- Border-radius: 11px
- Font: DM Sans 14px 600
- Icon: arrow-right
- Shadow: 0 8px 32px rgba(34,197,94,0.25)
- Hover: bg #16a34a, shadow +50%, translateY -2px

Button 2: "Ver demonstração"
- Background: transparent
- Border: 1px solid rgba(74,222,128,0.22)
- Color: #4a7c5c
- Padding: 14px 32px
- Border-radius: 11px
- Hover: border #4ade80, color #4ade80

Layout: flex row, gap 12px, flex-wrap
Animation: Fade up (0.7s ease, delay 0.4s)
```

---

### 3.4 — Elementos de Background

**Constellation Canvas (subtle overlay)**
- 48 nós conectados
- Velocidade: lenta (0.22px/frame)
- Cor: rgba(74,222,128, 0.16)
- Linhas: aparecem quando distância < 160px
- Opacity total: 0.65
- Z-index: abaixo do 3D

**Gradient Radial Glow**
- Centro: 35% top, 50% left
- Size: 700x500px
- Color: rgba(34,197,94, 0.06)
- Fade: 65% transparência

---

## 4. ANIMAÇÕES — TIMELINE DETALHADO

```
Page Load (t=0)
├─ t=0.0s    : Vídeo fade in 1s
├─ t=0.3s    : Status label fade in + slide up 0.3s
├─ t=0.5s    : Mapa 3D scale 0→1 (elastic, 1.2s)
├─ t=0.7s    : Título fade up + scale 0.7s
├─ t=0.8s    : Subtitle fade up 0.7s
├─ t=0.9s    : CTAs fade up 0.7s
├─ t=1.0s    : Constellation partículas começam órbita
├─ t=1.2s    : Bandeiras aparecem em cascade (100ms apart)
└─ t=2.0s    : Tudo estabilizado

Loop contínuo (após page load)
├─ Mapa: rotação 45s/volta
├─ Bandeiras: órbita 60s/volta
├─ Pontos: pulsing 2.5s
├─ Shimmer text: 6s
├─ Partículas: órbita 70s/volta
└─ Vídeo: fade cenas 12s loop

Interações
├─ Mouse move: Mapa segue cursor (lerp 0.1s)
├─ Hover 3D: Bandeiras glow, pontos +50%
├─ Hover CTA: bg escuro 0.2s, shadow +50%, y -2px
├─ Scroll: Vídeo parallax -5%, fade opacity
└─ Mobile: Tilt device muda perspectiva 3D
```

---

## 5. RESPONSIVIDADE

### Desktop (1024px+)
- Split 60/40 lado a lado
- Texto centered between
- 3D tamanho 280px²
- Video resolution full

### Tablet (768px-1023px)
- Stack: video 100%, 3D canto inf-dir 20% size
- Texto centered, font scale 0.85x
- 2 columns CTAs

### Mobile (< 768px)
- Video full 100%
- 3D mini (120px²) canto inf-dir
- Texto 100% width, centered
- Font sizes reduced 20%
- CTAs stack vertical
- Bandeiras: não aparecem (apenas no desktop)

---

## 6. PERFORMANCE

**Otimizações críticas:**
- Vídeo lazy-load com intersection observer
- 3D render apenas se WebGL suportado
- Fallback 2D se GPU ruim
- Partículas requestAnimationFrame (60fps target)
- Throttle mouse follow (16ms max)
- Disable animations on `prefers-reduced-motion`

**Budget:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Vídeo: < 10MB
- 3D assets: < 500KB
- Total Hero JS: < 150KB

---

## 7. CORES & TYPOGRAPHY (REFERÊNCIA)

**Paleta OryonAG:**
- Dark bg: `#020c05`
- Primary green: `#22c55e`
- Neon green: `#4ade80`
- Light green: `#86efac`
- Text light: `#f0fdf4`
- Text muted: `#4a7c5c`

**Fontes:**
- Display (h1): **Fraunces** 900
- Body: **DM Sans** 300-600
- Mono: **DM Mono** 400-500

---

## 8. ARQUIVOS & RECURSOS NECESSÁRIOS

**Vídeo:**
- `/public/hero-video-1-amanhecer.mp4` (4s, golden hour)
- `/public/hero-video-2-drone.mp4` (4s, aerial)
- `/public/hero-video-3-colheita.mp4` (4s, harvest)

**3D Assets:**
- `components/Hero3DMap.tsx` — Mapa Brasil com Three.js
- `components/FlagOrbiter.tsx` — Bandeiras orbitando
- `lib/3d-utils.ts` — Helpers (mouse follow, lerp, etc)

**Componentes:**
- `components/HeroSection.tsx` — Layout principal
- `components/ConstellationOverlay.tsx` — Partículas (reusar do código atual)
- `components/HeroVideo.tsx` — Vídeo com transições

---

## 9. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Procurar/gravar 3 vídeos agrícolas (4s cada)
- [ ] Codificar vídeos (MP4 H.264 + WebM VP9)
- [ ] Modelar/importar mapa Brasil 3D
- [ ] Criar 6 flag SVGs (Brasil, Israel, Índia, China, EUA, EU)
- [ ] Implementar Three.js scene com rotação + glow
- [ ] Implementar mouse follow com lerp
- [ ] Implementar pulsing animation pontos
- [ ] Implementar flag orbit com cascade entrance
- [ ] Integrar vídeo com fade transitions
- [ ] Testes responsividade (mobile, tablet, desktop)
- [ ] Testes performance (Lighthouse, DevTools)
- [ ] Testes acessibilidade (alt text, keyboard nav)
- [ ] Suporte dark/light mode (já em dark)

---

## 10. PRÓXIMOS PASSOS

1. ✅ Spec aprovada pelo usuário
2. → Invocar writing-plans para plano de implementação
3. → Implementar em `app/ecosistema/page.tsx`
4. → Testar performance e UX
5. → Deploy e monitoramento

---

**Autor:** Claude AI  
**Revisado:** 2026-05-14  
**Status:** Ready for Implementation Planning
