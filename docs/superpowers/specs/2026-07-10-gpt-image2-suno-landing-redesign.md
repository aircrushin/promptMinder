# GPT Image2 + Suno Landing Section Redesign

**Date:** 2026-07-10  
**Status:** Approved for planning  
**Surface:** Landing page · `components/landing/gpt-image2-section.jsx`  
**Register:** Brand (marketing landing)

## Goal

Restyle the GPT Image2 + Suno prompt collections section so its color, density, and motion language match the rest of the landing page (CLI, features, CTA), while adding restrained interactive 3D tilt on the preview panels.

## Decisions Locked

| Topic | Choice |
|---|---|
| Layout | Keep current split: copy left, overlapping stacked previews right |
| Palette | Align with sibling modules: `slate-50/50`, indigo accents, white panels, slate borders |
| Suno panel | Light panel (same family as GPT Image2), not dark/teal |
| 3D treatment | Interactive mouse tilt on the two preview panels only |
| Approach | Restyle in place + small tilt wrapper; no layout rewrite |

## Current Problems

1. Section background uses warm cream (`#fbfaf7`) and amber/teal radial washes that clash with the indigo/slate language used elsewhere.
2. Suno preview is a near-black card with teal accents, so the dual-panel stage reads as a different product.
3. Overlapping panels have depth via shadows only; no interactive 3D, despite the rest of the landing using Framer Motion for presence.

## Design

### Visual system

Reuse the established landing section chrome:

- Section shell: `bg-slate-50/50`, 32px grid overlay, soft indigo/blue ambient blurs
- Badge: indigo pill (`border-indigo-200`, `bg-indigo-50`, `text-indigo-600`) matching CLI section
- Heading: slate-900 / extrabold tracking, same scale family as CLI/feature titles
- Body: slate-600
- Category chips and collection links: white surfaces, slate borders, hover to `slate-50`
- Remove cream background, amber wash, and teal accents from this section

### Composition

Keep the existing two-column structure:

1. **Left column**
   - Badge, title, description
   - Category chips
   - Two collection links (`/gpt-image2`, `/suno`)
2. **Right column (stage)**
   - GPT Image2 preview panel (upper-left, light)
   - Suno preview panel (lower-right, light)
   - Optional small import note chip if it still fits without clutter; drop it if it fights the tilt stage

No change to content sources (`gptImage2Prompts`, `sunoPrompts`) or routes.

### Preview panels

**GPT Image2 panel**

- White card, slate border, soft elevated shadow
- Header row: icon + title + prompt count
- Thumbnail grid of curated sample images (existing preview IDs)

**Suno panel**

- Same light card language as GPT Image2
- Header row: icon + title + template count
- Indigo waveform bars (replace teal)
- Light list rows for sample templates (title, category chip, truncated prompt)

### Interaction & motion

**Tilt**

- Apply only to the two stacked preview panels
- Pointer-driven `rotateX` / `rotateY` within a perspective container
- Soft spring return on pointer leave
- Cap tilt roughly 8–12° so it stays product-grade, not novelty
- Opposing base rotations keep the stacked depth even at rest
- Hover: slight shadow lift + scale ~1.02

**Entrance**

- Keep Framer Motion stagger / fade-up consistent with other landing sections

**Accessibility / device**

- `prefers-reduced-motion: reduce` → disable tilt; keep flat hover border/shadow only
- Touch / coarse pointer → skip continuous tracking
- Collection links remain normal keyboard-focusable anchors

### Implementation shape

Primary file: `components/landing/gpt-image2-section.jsx`

- Restyle section shell and panels to match sibling modules
- Add a small local `TiltCard` helper (or extract to a tiny landing util if the file gets noisy)
- No new npm dependencies
- No i18n key changes required unless copy tweaks are needed for layout fit
- Out of scope: gallery pages (`/gpt-image2`, `/suno`), data files, API, other landing sections

### Success criteria

1. Section reads as part of the same landing system at a glance (no cream/teal island).
2. Both preview panels are light and indigo-aligned.
3. Desktop pointer tilt works on both panels and feels subtle.
4. Reduced-motion and touch paths remain usable without tilt.
5. Existing CTAs and preview content still work.

## Non-goals

- Redesigning the full landing page
- Adding new prompt collections or changing gallery UX
- Heavy WebGL / Three.js 3D
- Dark-mode-first treatment for this section
