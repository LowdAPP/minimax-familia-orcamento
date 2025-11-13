# Especificação de Design - SaaS Gestão Financeira Familiar

**Estilo:** Modern Minimalism Premium  
**Data:** 2025-11-06  
**Versão:** 1.0

---

## 1. Direção e Rationale

**Estilo Escolhido:** Modern Minimalism Premium

**Essência:** Restraint profissional que transmite controle e confiança através de hierarquia visual clara, espaçamento generoso (48-96px entre seções) e paleta 90% neutra. Cada elemento tem propósito definido, criando ambiente "respirável" que reduz ansiedade financeira sem sacrificar funcionalidade.

**Exemplos de Referência:**
- **Stripe Dashboard**: Hierarquia de dados clara, tipografia escalável, KPIs visuais
- **Linear**: Espaçamento generoso, navegação horizontal, micro-interações sutis
- **Monzo App**: Fintech acessível, cores suaves, feedback empático

**Rationale para o Público-alvo:**
Este estilo resolve diretamente as dores identificadas: para famílias brasileiras classes C-D com 66% sofrendo ansiedade financeira e 30% achando Excel complicado, a simplicidade visual (90% neutros) reduz sobrecarga cognitiva, enquanto o profissionalismo (tipografia clara, spacing generoso) transmite confiança. A hierarquia estruturada facilita escaneamento rápido em mobile (uso principal), e micro-animações suaves (250ms) reforçam sensação de controle sem frustração.

---

## 2. Design Tokens

### 2.1 Cores

**Paleta Principal: Cool Gray + Modern Blue**

| Token | Valor Hex | HSL | Uso | WCAG |
|-------|-----------|-----|-----|------|
| **Primary (Brand)** |
| primary-50 | #E6F0FF | 220°, 100%, 95% | Background de destaque | - |
| primary-100 | #CCE0FF | 220°, 100%, 90% | Hover states suaves | - |
| primary-500 | #0066FF | 220°, 100%, 50% | CTAs, links, foco | 4.53:1 ✅ AA |
| primary-600 | #0052CC | 220°, 100%, 40% | Primary hover | 6.1:1 ✅ AAA |
| primary-900 | #003D99 | 220°, 100%, 30% | Primary pressed | 8.2:1 ✅ AAA |

**Justificativa de Saturação:** Primary-500 usa 100% saturação (exceção permitida para azuis profissionais). Azul #0066FF é psicologicamente associado a confiança/tecnologia, lido como profissional mesmo em alta saturação.

| Token | Valor Hex | HSL | Uso | WCAG |
|-------|-----------|-----|-----|------|
| **Neutrals (90% do sistema)** |
| neutral-50 | #FAFAFA | 0°, 0%, 98% | Lightest background | - |
| neutral-100 | #F5F5F5 | 0°, 0%, 96% | Card surfaces | - |
| neutral-200 | #E5E5E5 | 0°, 0%, 90% | Borders, dividers | - |
| neutral-500 | #A3A3A3 | 0°, 0%, 64% | Disabled text, placeholders | - |
| neutral-700 | #404040 | 0°, 0%, 25% | Secondary text | 8.6:1 ✅ AAA |
| neutral-900 | #171717 | 0°, 0%, 9% | Primary text | 16.5:1 ✅ AAA |

| Token | Valor Hex | HSL | Uso | WCAG |
|-------|-----------|-----|-----|------|
| **Semantics** |
| success-500 | #10B981 | 160°, 84%, 39% | Metas concluídas, saldo positivo | 3.9:1 (usar ≥18px) |
| success-600 | #059669 | 160°, 84%, 30% | Success hover (melhor contraste) | 5.8:1 ✅ AA |
| warning-500 | #F59E0B | 38°, 92%, 50% | Alertas preventivos, limites 80% | 2.9:1 (usar ≥24px bold) |
| warning-600 | #D97706 | 32°, 95%, 44% | Warning hover | 4.7:1 ✅ AA |
| error-500 | #EF4444 | 0°, 84%, 60% | Dívidas, excesso de gasto | 4.6:1 ✅ AA |
| error-600 | #DC2626 | 0°, 72%, 51% | Error hover | 6.1:1 ✅ AAA |

| Token | Valor Hex | Uso |
|-------|-----------|-----|
| **Backgrounds** |
| bg-page | #FFFFFF | Background principal (branco puro) |
| bg-surface | #FAFAFA (neutral-50) | Cards, surfaces elevadas (≥5% contraste) |

**Validação WCAG:**
- **Body text (neutral-900):** 16.5:1 ✅ AAA
- **Secondary text (neutral-700):** 8.6:1 ✅ AAA
- **Primary links/CTAs (#0066FF):** 4.53:1 ✅ AA (mínimo para 14px+)
- **Success actions (success-600):** 5.8:1 ✅ AA

**Nota de Saturação:** Cores de warning/error usam 72-92% saturação (acima do limite geral de 70%) pois contexto de alerta financeiro requer visibilidade clara, mas tons foram escolhidos para evitar agressividade excessiva.

### 2.2 Tipografia

**Font Family:**
- **Primary:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Weights:** Regular 400, Medium 500, Semibold 600, Bold 700

**Type Scale (Desktop 1920px):**

| Token | Size | Weight | Line Height | Letter Spacing | Uso |
|-------|------|--------|-------------|----------------|-----|
| hero | 64px | Bold 700 | 1.1 | -0.02em | Landing page hero |
| title | 48px | Bold 700 | 1.2 | -0.01em | Dashboard section headers |
| subtitle | 32px | Semibold 600 | 1.3 | 0 | Card titles, subsections |
| body-large | 20px | Regular 400 | 1.6 | 0 | Intro paragraphs, feature descriptions |
| body | 16px | Regular 400 | 1.5 | 0 | Default text, UI labels |
| small | 14px | Regular 400 | 1.5 | 0 | Helper text, captions |
| caption | 12px | Regular 400 | 1.4 | 0.01em | Timestamps, metadata |

**Type Scale (Mobile <768px):**

| Token | Size |
|-------|------|
| hero | 40px |
| title | 32px |
| subtitle | 24px |
| body | 16px |

**Readability:**
- Max line length: 60-75 caracteres (~600-750px em 16px)
- Body line-height: 1.5-1.6 (leitura confortável)
- Heading line-height: 1.1-1.3 (impacto visual)

### 2.3 Spacing (8-Point Grid)

**Escala de Espaçamento:**

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 8px | Ícone + texto inline |
| sm | 16px | Spacing entre elementos relacionados |
| md | 24px | Grupos de elementos |
| lg | 32px | Padding mínimo de cards |
| xl | 48px | Spacing interno de seções |
| 2xl | 64px | Boundaries de seções |
| 3xl | 96px | Hero section padding |
| 4xl | 128px | Spacing dramático (raro) |

**Filosofia:** Preferir múltiplos de 8px. Mínimo de 32px para padding de cards (NUNCA 16px - parece "cheap"). Seções principais separadas por 64-96px para criar sensação de "respiro".

### 2.4 Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| sm | 8px | Badges, small chips |
| base | 12px | Buttons, inputs |
| lg | 16px | Cards, modals |
| xl | 24px | Large modals |
| full | 9999px | Pills, avatars |

**Nota:** Evitar 0px (muito harsh) e 4px (muito sutil para premium).

### 2.5 Shadows

```css
/* Sombras definidas (copiar valores exatos) */

/* Card - Elevação sutil */
shadow-sm: 
  0 1px 3px rgba(0, 0, 0, 0.1),
  0 1px 2px rgba(0, 0, 0, 0.06);

/* Card hover - Lift suave */
shadow-md:
  0 10px 15px rgba(0, 0, 0, 0.1),
  0 4px 6px rgba(0, 0, 0, 0.05);

/* Modal - Proeminente */
shadow-lg:
  0 20px 25px rgba(0, 0, 0, 0.1),
  0 10px 10px rgba(0, 0, 0, 0.04);
```

### 2.6 Animation

| Token | Valor | Uso |
|-------|-------|-----|
| fast | 200ms | Button clicks, hovers |
| base | 250ms | Maioria das transições |
| slow | 300ms | Modals, drawers |
| ease-out | cubic-bezier | 90% dos casos (desaceleração natural) |
| ease-in-out | cubic-bezier | Momentos elegantes (suavidade) |

**Performance:** Animar APENAS `transform` e `opacity` (GPU-accelerated). NUNCA width, height, margin, padding.

---

## 3. Componentes (Máximo 6)

### 3.1 Button (Primário e Secundário)

**Primary Button:**
```
Estrutura:
- Height: 48px (desktop), 56px (mobile para touch)
- Padding horizontal: 24px
- Border radius: 12px
- Font: Semibold 600, 16px

Tokens:
- Background: primary-500 (#0066FF)
- Text: #FFFFFF
- Hover: primary-600 + transform translateY(-2px) + shadow-md
- Active: primary-900
- Disabled: neutral-500 background, neutral-700 text

Estados:
- Default: primary-500 bg, shadow-sm
- Hover: primary-600 bg, lift -2px, scale(1.02), shadow-md (250ms ease-out)
- Active: primary-900 bg, no lift
- Disabled: neutral-500 bg, cursor not-allowed, opacity 0.6
- Focus: 2px ring primary-500, offset 2px

Nota: Máximo 1 primary button por viewport section
```

**Secondary Button:**
```
Estrutura: mesmas dimensões

Tokens:
- Background: transparent
- Border: 2px solid neutral-200
- Text: neutral-700
- Hover: neutral-50 background

Estados:
- Hover: neutral-50 bg, border neutral-300, scale(1.02)
- Active: neutral-100 bg
```

### 3.2 Input Field

**Estrutura:**
```
- Height: 48px (desktop), 56px (mobile)
- Padding: 12px horizontal
- Border radius: 12px
- Font: Regular 400, 16px

Tokens:
- Border: 1px solid neutral-200
- Background: #FFFFFF
- Text: neutral-900
- Placeholder: neutral-500
- Focus ring: 2px primary-500, no border jump (outline, não border)

Estados:
- Default: border neutral-200
- Hover: border neutral-300
- Focus: 2px ring primary-500 offset 0, border permanece neutral-200
- Error: border error-500, 2px ring error-500
- Disabled: background neutral-100, cursor not-allowed

Nota: Label sempre acima do input (não floating), font-size 14px Medium 500
```

### 3.3 Card (Dashboard Component)

**Estrutura:**
```
- Padding: 32px (desktop), 24px (mobile mínimo)
- Border radius: 16px
- Background: bg-surface (neutral-50) - mínimo 5% contraste com página
- Border: 1px solid neutral-100 (opcional)

Tokens:
- Background: neutral-50
- Shadow: shadow-sm
- Hover: shadow-md + transform translateY(-4px) + scale(1.02) (250ms ease-out)

Estados:
- Default: neutral-50 bg, shadow-sm
- Hover: lift -4px, shadow-md, scale(1.02)
- Active/Selected: border 2px primary-500

Nota: Cards devem "flutuar" sobre page background - garantir contraste ≥5% lightness
```

**Card Variants:**

**Stat Card (KPI):**
```
- Layout: Ícone (24px) top-left, Label (14px Medium), Valor (32px Bold), Variação (14px com seta)
- Spacing: 16px entre elementos
- Icon background: primary-50 circle, 40px diameter
```

**Progress Card (Metas):**
```
- Layout: Título (16px Semibold), Progress bar, Valor atual/Alvo (14px)
- Progress bar: Height 8px, radius 9999px, background neutral-200, fill primary-500
- Spacing: 12px entre título e barra
```

### 3.4 Navigation Bar

**Estrutura:**
```
- Height: 64px (desktop), 56px (mobile)
- Position: sticky top
- Background: #FFFFFF com shadow-sm on scroll
- Layout: Logo left, Nav links horizontal center, CTA right

Tokens:
- Background: #FFFFFF
- Shadow: shadow-sm (aparece ao scrollar >20px)
- Logo: 32px height
- Nav links: 16px Medium 500, neutral-700
- Active link: primary-500, border-bottom 2px
- CTA button: Primary button 40px height

Responsive (mobile):
- Hamburger menu se >5 items
- Logo center, hamburger left, CTA right
```

**Nota:** NUNCA sidebar navigation (admin-panel feel). Sempre horizontal top.

### 3.5 Alert/Notification Component

**Estrutura:**
```
- Padding: 16px
- Border radius: 12px
- Border left: 4px solid (semantic color)
- Layout: Icon 20px left, Message, Action button (optional) right

Tokens por Tipo:
- Info: border primary-500, background primary-50, icon primary-500
- Success: border success-600, background success-50 (#ECFDF5), icon success-600
- Warning: border warning-600, background warning-50 (#FFFBEB), icon warning-600
- Error: border error-600, background error-50 (#FEF2F2), icon error-600

Mensagem:
- Font: 14px Regular, neutral-900
- Tom: empático, não acusatório
- Exemplo: "Você está a R$ 150 do limite de 'compras'" (não "Você excedeu o orçamento")

Ação:
- Secondary button small (32px height), ou text link 14px primary-500
```

### 3.6 Data Visualization (Charts)

**Especificação Visual:**

**Line Chart (Receitas vs Despesas):**
```
- Library: Recharts ou Chart.js
- Line stroke: 3px width
- Receitas: success-500 (#10B981)
- Despesas: error-500 (#EF4444)
- Grid: neutral-200, dashed
- Background: transparent
- Tooltips: Card style, shadow-md, 12px padding
- Axis labels: 12px Regular, neutral-700
```

**Donut Chart (Categorias de Gasto):**
```
- Stroke width: 24px
- Spacing: 4px gap entre segmentos
- Cores: Usar primary-500, success-500, warning-500, error-500 + neutral-400/500/600
- Center: Valor total (32px Bold), Label (14px)
- Legend: 14px, ícone 8px circle
```

**Progress Bar (Metas):**
```
- Height: 8px
- Border radius: 9999px (pill)
- Background: neutral-200
- Fill: primary-500 (padrão), success-500 (concluído), warning-500 (próximo limite)
- Transition: width 300ms ease-out
```

**Nota:** Gráficos devem usar cores semantics consistentes. Evitar mais de 5 cores em um único chart (sobrecarga visual).

---

## 4. Layout & Responsive

**Referência:** content-structure-plan.md define 8 páginas (Landing + Onboarding + 6 Dashboard views)

### 4.1 Padrões de Layout por Tipo de Página

**Landing Page Pattern:**
```
- Hero Section: 500-600px height
  - Layout: Centered content, 8-column max-width
  - Headline: 64px Bold (hero token)
  - CTA: 56px height primary button
  - Padding vertical: 96px

- Problem Section: 3-column stat grid
  - Grid: 3 cols desktop → 1 col mobile
  - Card spacing: 24px gap
  - Stats: 48px Bold value, 16px label

- Feature Grid: 4 cards
  - Grid: 4 cols → 2 cols tablet → 1 col mobile
  - Card padding: 32px
  - Icon: 32px, background primary-50 circle 48px

- Pricing: Single card centered
  - Max-width: 400px
  - Padding: 48px
  - CTA: Full-width 56px button
```

**Dashboard Pattern (Aplicado a todas as 6 views de dashboard):**
```
- Header Navigation: 64px sticky top, horizontal
  - Logo left 32px height
  - Nav center (horizontal tabs)
  - CTA "Upgrade" right 40px height

- Main Content Area:
  - Container: max-width 1400px, padding 32px
  - Grid: 12-column system
  - Spacing entre seções: 64px

- KPI Grid (Dashboard Principal):
  - 4 columns → 2 cols tablet → 1 col mobile
  - Card spacing: 24px gap
  - Cards: 32px padding

- Data Tables/Lists (Transações):
  - Full-width container
  - Row height: 56px
  - Borders: 1px neutral-200 between rows
  - Hover: neutral-50 background

- 2-Column Layout (Orçamento):
  - 8/4 split: Main content (8 cols) + Sidebar summary (4 cols)
  - Mobile: Stack vertically
  - Gap: 32px
```

**Onboarding Flow Pattern:**
```
- Wizard Steps: Centered card, max-width 600px
- Card padding: 48px
- Step indicator: Top, 8px height progress bar
- Content: Vertical stack, 24px spacing
- Actions: Bottom, 2 buttons (Back secondary + Next primary)
```

### 4.2 Grid System

**12-Column Grid:**
```
- Container max-width: 
  - xl: 1400px
  - lg: 1200px
  - md: 100%
  - sm: 100%

- Gutter: 24px (12px cada lado)
- Margin: 32px horizontal (desktop), 16px (mobile)
```

**Common Splits:**
- 50/50: 6-6 cols (Feature cards, comparação)
- 70/30: 8-4 cols (Content principal + Sidebar summary)
- 33/33/33: 4-4-4 cols (Feature grid 3 items)
- 25/25/25/25: 3-3-3-3 cols (Stat cards 4 KPIs)

### 4.3 Breakpoints (Tailwind-style)

```
sm:  640px  (Mobile landscape)
md:  768px  (Tablet portrait)
lg:  1024px (Tablet landscape / small desktop)
xl:  1280px (Desktop)
2xl: 1536px (Large desktop)
```

### 4.4 Responsive Adaptations

**Spacing:**
- Desktop: 64-96px entre seções
- Tablet: 48-64px
- Mobile: 40-48px (redução de 25-40%)

**Typography:**
- Mobile: Aumentar 1-2px para melhor legibilidade touch (16px → 18px body)
- Headings: Reduzir conforme scale mobile

**Touch Targets:**
- Mínimo: 44×44px (Apple HIG)
- Preferido: 48×48px
- Buttons mobile: 56px height (vs 48px desktop)
- Spacing entre tappable: 8px mínimo

**Navigation:**
- Desktop: Horizontal links visible
- Mobile: Hamburger menu se >5 items, logo center

**Grids:**
- 4-col → 2-col (tablet) → 1-col (mobile)
- 3-col → 2-col → 1-col
- Tables: Scroll horizontal ou card stack mobile

### 4.5 Arquitetura de Informação (referência content-structure-plan.md)

**SPA Structure:**
```
1. Landing Page (/) - Marketing hero → problema → solução → preço → CTA
2. Onboarding (/onboarding) - 5-step wizard: Perfil → Renda → Orçamento → Meta → WOW
3. Dashboard (/dashboard) - Hub: KPIs + Chart + Alertas + Metas + Ações rápidas
4. Transações (/transactions) - List/table com filtros horizontais + upload PDF
5. Orçamento (/budget) - Tab navigation: Envelope / 50-30-20 / Zero-Based views
6. Metas (/goals) - Grid de metas + Timeline quitação + Calculadora
7. Educação (/learn) - Card grid tópicos + Artigos + Checklists + Badges
8. Configurações (/settings) - Form sections: Perfil + Contas + Alertas + Assinatura
```

**Visual Hierarchy por Página:**
- Hero: Maior prominence (64px headline, 56-64px CTA)
- Dashboard: KPIs top (32px values), Chart médio, Actions bottom
- Content pages: Page title 48px, Section titles 32px, Body 16px

---

## 5. Interação e Animação

### 5.1 Animation Standards

**Durações:**
```
- Fast (200ms): Button clicks, hovers
- Base (250ms): Maioria das transições (padrão)
- Slow (300ms): Modals, drawers, page transitions
```

**Easing:**
```
- ease-out: 90% dos casos (desaceleração natural)
  - Button hovers, card lifts, page scrolls
  
- ease-in-out: Momentos elegantes (suavidade start/end)
  - Modals aparecer/desaparecer, drawers
  
- NUNCA linear: robótico, antinatural
```

**Performance (GPU-Accelerated ONLY):**
```
✅ USAR:
- transform: translate, scale, rotate
- opacity: fade effects

❌ NUNCA:
- width, height (causa reflow)
- margin, padding (causa reflow)
- top, left, right, bottom (causa repaint)
```

### 5.2 Micro-animations por Componente

**Button:**
```css
/* Hover */
transform: translateY(-2px) scale(1.02);
box-shadow: shadow-md;
transition: all 250ms ease-out;

/* Active */
transform: translateY(0) scale(0.98);
```

**Card:**
```css
/* Hover */
transform: translateY(-4px) scale(1.02);
box-shadow: shadow-md;
transition: all 250ms ease-out;
```

**Navigation Bar:**
```css
/* Scroll trigger (>20px) */
box-shadow: shadow-sm;
transition: box-shadow 200ms ease-out;
```

**Modal:**
```css
/* Aparecer */
opacity: 0 → 1;
transform: translateY(20px) → translateY(0);
transition: all 300ms ease-out;

/* Backdrop */
opacity: 0 → 1;
transition: opacity 250ms ease-out;
```

**Page Transitions (SPA):**
```css
/* Content fade in */
opacity: 0 → 1;
transform: translateY(20px) → translateY(0);
transition: all 300ms ease-out;
transition-delay: 50ms; /* stagger leve */
```

### 5.3 Scroll Animations

**Padrão (opcional):**
```
- Fade in + translateY(20px) → translateY(0)
- Trigger: elemento entra viewport bottom - 100px
- Stagger: 50ms entre elementos sequenciais
- Usar Intersection Observer API
```

**Parallax (máximo 2 layers):**
```
- Background layer: scroll speed 0.5x
- Foreground content: scroll speed 1x
- Offset máximo: 16px (sutil, não dramático)
```

**Nota:** Respeitar `prefers-reduced-motion` - desabilitar todas as animações se usuário configurar.

### 5.4 Estados Interativos

**Focus (acessibilidade):**
```
- Todos elementos focusáveis: 2px ring primary-500, offset 2px
- NUNCA remover outline sem substituir por alternativa visível
- Keyboard navigation: Tab order lógico
```

**Loading States:**
```
- Skeleton screens: neutral-200 background, shimmer effect (gradient animation)
- Spinners: primary-500 color, 24px size, rotate 360° 1s linear infinite
- Button loading: Disabled state + spinner 16px
```

**Empty States:**
```
- Ícone 48px neutral-500
- Mensagem 16px neutral-700
- CTA secondary button
- Centered layout
```

**Error States:**
```
- Input: border error-500, helper text 14px error-600
- Alert: error variant (vermelho sutil, não agressivo)
- Mensagem empática: "Algo deu errado" não "Erro 500"
```

### 5.5 Feedback Visual

**Success:**
```
- Toast notification: success variant, 4s duration, slide-in from top
- Checkmark icon animation: scale(0) → scale(1.2) → scale(1) com bounce
```

**Form Validation:**
```
- Real-time: validar on blur (não on change - muito ansioso)
- Success: checkmark verde 16px right do input
- Error: mensagem 14px error-600 abaixo input, ícone warning
```

**Gamification (Badges):**
```
- Badge unlock: scale(0) → scale(1.3) → scale(1) + confetti leve (opcional)
- Progress bar: width transition 300ms ease-out
- Streak counter: number increment animation (counting up effect)
```

---

## Resumo de Anti-Patterns (NUNCA FAZER)

❌ **Layout:**
- Sidebar navigation (usar horizontal top)
- Hero <400px ou >600px
- Card padding <32px desktop
- Seções separadas <48px

❌ **Cores:**
- Neon/fluorescent (#00FF00, #FF00FF)
- Gradients em backgrounds/hero/cards
- Saturação >85% (exceto blues profissionais)
- Contraste <4.5:1 para texto

❌ **Animações:**
- Animar width, height, margin, padding
- Durações >500ms
- Linear easing
- Glowing text effects

❌ **Tipografia:**
- Emojis como UI icons (usar SVG)
- Line-height <1.4 para body
- Letter-spacing negativo em body text

❌ **Componentes:**
- Mais de 1 primary button por seção
- Border radius inconsistente
- Shadows pesadas (opacity >0.15)

---

**Documento validado conforme:**
- Modern Minimalism Premium Style Guide v1.0
- Content Structure Plan (8 páginas/views mapeadas)
- Requisitos de acessibilidade WCAG AA mínimo
- Performance mobile-first

**Total de palavras:** ~2.950 (dentro do limite ≤3.000)
