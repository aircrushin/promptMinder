---
name: Prompt Minder
description: Monochrome prompt workbench for confident, precise AI workflow control
colors:
  near-black-ink: "#1a1c23"
  pure-paper: "#ffffff"
  cool-paper: "#f4f4f6"
  cool-muted: "#eeeff1"
  cool-border: "#dddfe4"
  ink-secondary: "#303441"
  ink-muted: "#606676"
  sidebar-paper: "#f6f7f8"
  signal-red: "#db2424"
  chart-ink-1: "#1f1f1f"
  chart-ink-2: "#424242"
  chart-ink-3: "#6b6b6b"
  chart-ink-4: "#949494"
  chart-ink-5: "#bdbdbd"
typography:
  display:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.near-black-ink}"
    textColor: "{colors.pure-paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#17191f"
    textColor: "{colors.pure-paper}"
  button-outline:
    backgroundColor: "{colors.pure-paper}"
    textColor: "{colors.near-black-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.cool-paper}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.near-black-ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  badge-default:
    backgroundColor: "{colors.near-black-ink}"
    textColor: "{colors.pure-paper}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  badge-secondary:
    backgroundColor: "{colors.cool-paper}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  card-default:
    backgroundColor: "{colors.pure-paper}"
    textColor: "{colors.near-black-ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Prompt Minder

## 1. Overview

**Creative North Star: "The Monochrome Workbench"**

Prompt Minder is a light-mode-first product UI for solo prompt power users. The surface should feel like a clean black-and-white workbench: sharp, minimal, and professional, with Vercel-level restraint as the visual reference. Contrast and whitespace do the talking; decoration does not.

The system reinforces confidence, precision, and control. Density stays disciplined enough for scanning libraries and editing prompts, never sparse for marketing theater and never noisy for consumer novelty. Motion exists only to orient and confirm state.

This system explicitly rejects generic "AI-style" visuals: neon gradients, glowing effects, sci-fi motifs, and overly futuristic marketing aesthetics.

**Key Characteristics:**
- Monochrome foundation (Near-Black Ink on Cool Paper Neutrals)
- Single sans stack (Inter) across all roles
- Border-led hierarchy over shadow theater
- Restrained, refined components with intentional contrast
- Workflow clarity before spectacle

## 2. Colors

A restrained monochrome palette: Near-Black Ink carries action and emphasis; Cool Paper Neutrals carry structure; Signal Red is reserved for destructive truth.

### Primary
- **Near-Black Ink** (`#1a1c23` / `hsl(225 15% 12%)`): Primary fills, key text, focus rings, and selected/inverted controls. The default voice of authority on every product screen.

### Neutral
- **Pure Paper** (`#ffffff`): Default page, card, dialog, and input canvas.
- **Cool Paper** (`#f4f4f6`): Secondary surfaces and quiet fills.
- **Cool Muted** (`#eeeff1`): Muted tracks (tabs list, soft grouping).
- **Cool Border** (`#dddfe4`): Default strokes for inputs, cards, and dividers.
- **Ink Secondary** (`#303441`): Secondary body emphasis on light fills.
- **Ink Muted** (`#606676`): Supporting copy, hints, meta labels.
- **Sidebar Paper** (`#f6f7f8`): Sidebar and chrome background distinct from content paper.

### Tertiary
- **Signal Red** (`#db2424`): Destructive actions and error only. Never decorative.

### Named Rules
**The One Ink Rule.** Near-Black Ink is the only accent of weight. Colored decoration (purple, emerald, neon) is forbidden on product surfaces.

**The Cool Paper Rule.** Backgrounds stay in the cool paper family. Warm cream, purple-tinted whites, and gradient washes are prohibited.

## 3. Typography

**Display Font:** Inter (with SF Pro Display / system sans fallbacks)
**Body Font:** Inter (same stack)
**Label/Mono Font:** Inter for UI labels; monospaced only when showing code or prompt payloads

**Character:** One technical humanist sans carries the whole product. Hierarchy comes from size, weight, and tracking, never from display-font theatrics.

### Hierarchy
- **Display** (600, 1.75rem, 1.2, tight tracking): Dialog and page titles that open a task.
- **Headline** (600, 1.25rem, 1.3): Section headers inside dense product views.
- **Title** (600, 1rem, 1.4): Card titles, list item names, compact headings.
- **Body** (400, 0.875rem, 1.6): Primary reading and form copy; keep prose near 65–75ch when continuous.
- **Label** (500, 0.75rem, letter-spacing ~0.08em, often uppercase): Eyebrows, meta, quiet status.

### Named Rules
**The Single Family Rule.** Do not introduce a second display face in product UI. Inter (or its system fallbacks) is the only UI typeface.

## 4. Elevation

Depth is border-led. Surfaces stay flat; hierarchy comes from Pure Paper vs Cool Paper/Muted fills, Cool Border strokes, and ink contrast. Shadows from the component primitives may exist as faint structural defaults, but new work should prefer borders and tonal steps over lift.

### Shadow Vocabulary
- **Rest / default:** Prefer `border: 1px solid {cool-border}` with no shadow.
- **Structural (legacy card primitive):** A very light `box-shadow` may appear on shared Card primitives; do not amplify it or stack multiple shadows.
- **Focus:** `ring-1` / `ring` using Near-Black Ink, not colored glow.

### Named Rules
**The Border-Led Rule.** If a surface needs separation, draw a full 1px Cool Border or shift to a Cool Paper/Muted fill. Do not invent ambient glow, multi-layer shadows, or glass blur to fake depth.

## 5. Components

Components feel refined and restrained: sharp contrast, quiet motion (color transitions ~150–200ms), no bounce.

### Buttons
- **Shape:** Gently rounded (6px / `rounded-md`)
- **Primary:** Near-Black Ink fill, Pure Paper text, height 36px, horizontal padding 16px
- **Hover / Focus:** Slightly deeper ink on hover; focus-visible uses a 1px Near-Black Ink ring
- **Outline:** Pure Paper fill, Cool Border/input stroke; hover may invert toward ink on high-intent product flows
- **Secondary:** Cool Paper fill, Ink Secondary text
- **Ghost:** Transparent, Ink Muted text; hover darkens text, not a loud wash

### Chips / Badges
- **Style:** Compact rounded-md pills; default is Near-Black Ink on Pure Paper text; secondary is Cool Paper on Ink Secondary
- **State:** Selected filters invert to ink; unselected stay outline or secondary. Success green is allowed only for true status, never as brand accent.

### Cards / Containers
- **Corner Style:** Softly rounded (12px / `rounded-xl` for cards; dialogs ~8–12px)
- **Background:** Pure Paper
- **Shadow Strategy:** Border-led; keep any primitive shadow minimal
- **Border:** 1px Cool Border
- **Internal Padding:** 16–24px; avoid nested cards

### Inputs / Fields
- **Style:** Transparent/paper fill, Cool Border stroke, 6px radius, 36px height
- **Focus:** Near-Black Ink ring (1px), no colored glow
- **Error / Disabled:** Signal Red for error text/borders; disabled at 50% opacity

### Navigation
- Top/app chrome on Pure Paper or Sidebar Paper; active states use ink weight or inverted chips, not colored underlines thicker than 1px full borders.
- Mobile: collapse to familiar patterns; keep the same monochrome vocabulary.

### Dialog / Onboarding Surface
- Pure Paper canvas, Cool Border frame, hairline section dividers.
- Segmented controls may invert (ink fill on active) for decisive selection.
- No gradient washes, blur orbs, or multi-hue decorative fills.

## 6. Do's and Don'ts

### Do:
- **Do** design for confidence first: every screen should feel reliable, clear, and deliberate.
- **Do** keep the visual language minimal: disciplined spacing, typography, and hierarchy over decorative excess.
- **Do** use monochrome as the default: black, white, and slate neutrals carry most of the interface.
- **Do** prioritize workflow clarity over spectacle: fast scanning, efficient actions, strong readability.
- **Do** keep motion subtle and functional: orientation and feedback only.
- **Do** separate surfaces with Cool Border and Cool Paper tonal steps.
- **Do** use Near-Black Ink for primary actions and focus.

### Don't:
- **Don't** use generic "AI-style" visuals such as neon gradients, glowing effects, sci-fi motifs, or overly futuristic marketing aesthetics.
- **Don't** introduce purple-on-white, purple-to-indigo gradients, or emerald/neon accent decoration on product surfaces.
- **Don't** rely on glassmorphism, blur orbs, or multi-layer shadows to create hierarchy.
- **Don't** use side-stripe borders (`border-left` / `border-right` > 1px) as colored accents.
- **Don't** use gradient text or display-font theatrics in product UI.
- **Don't** nest cards inside cards or wrap every block in a shadowed container.
- **Don't** make playfulness or novelty the emotional goal; trust, competence, and control come first.
