# Skin — DESIGN

Visual system in production at `betofabri.com/summer/skincare/`. Updated when tokens or component shapes change.

## Theme

Dark, premium, fintech-adjacent. The body is true near-black (`#07080c`); cards sit one step lighter (`#11131a`) with subtle inset highlights for tactility. A faint aurora gradient (cyan + violet, both low-saturation) anchors the top-right and bottom-left corners — atmospheric presence, never the focal point.

Single signature accent: electric cyan `#00d4ff`. Used only for primary actions, current selection, and state indicators. Never decoratively.

## Palette (OKLCH-adjacent, hex tokens currently)

```
Background     #07080c   (bg)
Surface        #11131a   (cards)
Surface 2      #1a1d27   (subdued cells inside cards)
Surface 3      #232734   (toggles off-state)
Border         #232634
Border strong  #353a4b
Text           #f5f7fa   (primary)
Text 2         #a5a9b8   (secondary)
Text 3         #6b7080   (tertiary, labels)
Text muted     #4a4f5e   (placeholders, disabled)

Accent (cyan)
  primary         #00d4ff
  bright          #22e5ff
  dark            #00a8cc
  soft (12%)      rgba(0,212,255,0.10)
  on (paired ink) #001218   (text on accent fill)

Semantic
  success   #2ee59d  / on #002d1c
  warning   #ffa940  / on #2a1500
  danger    #ff5c7a  / on #2d0008
```

Shadows are layered: a card shadow (faint inset highlight + soft drop), a lift shadow (modal cards), and the glow shadow used only on the primary CTA and the selection fill (multi-stop cyan halo).

## Typography

Inter Variable, exclusively. ss01 / ss03 / cv11 stylistic sets enabled. Tabular numerals on dates, counters, and product indexes.

- Display (hero, modal titles): 30–40px, weight 700, tracking -0.025em.
- Section labels (eyebrows): 11px, weight 700, uppercase, tracking 0.2em.
- Body: 14–16px, weight 400–500. Use weight 600+ for selected/primary states.
- Mono: JetBrains Mono fallback, for index numbers and dates ("25/05" "01 02 03").

Numbers as content always use `font-variant-numeric: tabular-nums` so they column-align across rows.

## Layout

Single column, `max-w-md` (~28rem), centered, 24px horizontal padding. The whole app fits within one mobile viewport (with scroll for history/products screens). No multi-column responsive — this is a phone-first PWA.

Spacing follows an 8pt rhythm but is varied for emphasis: 24px between primary blocks, 40px between sections of different intent (hero ↔ data ↔ controls). Cards are generously padded (24px) so content breathes.

## Components

### Buttons

- **Primary CTA** — 60px tall, `bg-primary`, `text-primary-on` (near-black), `shadow-glow`, font weight 700, slight `tracking-tight`. Disabled state: surface-2 bg, muted text, no glow.
- **Toggle pill** — selected state has filled bg (primary or warning), unselected has `bg-surface` with a 1px border. All selections use ≥3 redundant visual signals (color + icon + shadow / fill + check + ring).
- **Icon button** — 48×48 square, surface bg, subtle card shadow.

### Cards

- `bg-surface`, 1px border, `rounded-[--radius-lg]` (24px), `shadow-card`. Internal sectioning uses a single horizontal divider (border-bottom) rather than nested cards.

### Inputs

- 48px tall, `bg-surface-2` (one step darker than cards so they stand out as input regions), 1px border, focus-border becomes primary cyan.

### Chips / Badges

- 10–11px font, uppercase, tracked, with semantic soft-color background + on-color text. Used for state ("Pós-barba", category labels).

### Modal (full-screen)

- `fixed inset-0`, opaque dark gradient backdrop. NO transparency. Closes via top-right "Fechar" button. Stacking: header sticky 56px above content, content scrolls.

## Motion

Motion conveys state; nothing decorative. The vocabulary:

- **`.press`** — 240ms spring (`cubic-bezier(0.32, 1.4, 0.5, 1)`) scale-down on every interactive.
- **`.anim-fade-up`** — 480ms ease-out-quint entrance (opacity + 14px rise). Applied to the app shell on boot and to each phase view on transition (keyed remount replays it).
- **`.anim-sheet`** — 380ms slide-up + slight scale for full-screen modals (Situações, Produtos, Histórico) and the ConfirmSheet.
- **`.anim-backdrop`** — 240ms fade for modal backdrops.
- **`.anim-pop`** — 320ms overshoot pop (`cubic-bezier(0.34, 1.56, 0.64, 1)`) on check badges the moment a selection lands, and on the success badge in the done state.
- **`.stagger`** — children enter with 45ms cascading delays (capped at 8 steps). Used on the suggestion list, situations, products, and history.
- **`glow-pulse`** (1.6s loop) — wordmark dot and loading indicators only.

`@media (prefers-reduced-motion: reduce)` disables every animation above; state changes become instant.

Native `confirm()`/`alert()` are banned — destructive actions use the glass ConfirmSheet (bottom sheet, backdrop blur, explicit destructive button with `danger-on` ink).

## Iconography

Hand-rolled SVG (1.75 stroke, rounded line caps). No library — keeps the bundle small and the line weight consistent with the typography.

## State coverage

Every interactive component has: default, hover, focus-visible, active (press), disabled, loading (where applicable), error (where applicable). Verified across the StateSelector, Suggestion, ProductsView, and main CTAs.
