---
title: "From CSS Wireframe to Canvas Retroglobe"
date: 2026-03-04
coverImage: "/assets/retroglobe-canvas-migration/thumb.webp"
---

![CSS vs Canvas Retroglobe](/assets/retroglobe-canvas-migration/css-vs-canvas.webp)
*Left: legacy CSS globe (production baseline). Right: new canvas renderer (localhost).*

## 0. TL;DR

The old globe was a DOM and CSS-keyframe construction: many layered elements rotated with multiple synchronized animations. The new globe keeps the same visual language, but moves rendering into one canvas with a requestAnimationFrame loop and explicit 3D math in TypeScript.

This migration reduces globe-specific DOM complexity, centralizes rendering behavior in code, and makes future visual changes easier to reason about and test.

---

## 1. Baseline: Legacy CSS Globe

The legacy version was a strong pure-CSS build. It used nested layers like:

- `.globe-sphere`
- `.x-rotation-layer`
- `.z-rotation-layer`
- `.tilt-layer`
- `.wireframe-sphere`
- many `.latitude-ring` and `.meridian-line` elements

Motion was distributed across keyframes (`globe-rotate`, `globe-rotate-x`, `globe-rotate-z`, `globe-wobble`) and then mixed with user drag transforms.

![Legacy CSS Globe](/assets/retroglobe-canvas-migration/old-css-globe.webp)
*Legacy globe structure and controls.*

What worked well:

- Zero canvas drawing code.
- Easy to inspect each ring/line in DevTools.
- Strong retro style with mostly declarative CSS.

What became limiting:

- Visual behavior spread across many selectors and keyframes.
- Renderer logic split between React state and CSS animation timing.
- Harder to evolve rendering effects as a coherent pipeline.

---

## 2. New Canvas Renderer Architecture

The canvas implementation keeps React in charge of controls and interaction, but moves frame rendering into a dedicated render module.

![Canvas Retroglobe](/assets/retroglobe-canvas-migration/new-canvas-globe.webp)
*Canvas renderer with the updated matrix control surface.*

### 2.1 React Shell Responsibilities (`src/app/RetroGlobe.tsx`)

`RetroGlobe.tsx` now behaves as a control and orchestration layer:

1. Stores user-facing control state (`lineWidth`, `lineDensity`, axis speeds, wobble, band speed, pause state).
2. Maintains mutable runtime state refs (`rotX`, `rotY`, `rotZ`, `wobble`, `bandPhase`) for per-frame updates.
3. Handles pointer drag interactions and maps them to user rotation offsets.
4. Uses `ResizeObserver` + device pixel ratio to keep canvas backing resolution sharp.
5. Drives rendering via `requestAnimationFrame`, calling `renderRetroGlobeFrame(...)` every tick.

This separation is important: React state drives intent, and the canvas renderer executes deterministic draw steps.

### 2.2 Render Core Responsibilities (`src/lib/retroGlobeCanvas.ts`)

The draw pipeline is now explicit and inspectable in one place:

1. Rotate points in 3D (`rotateX`, `rotateY`, `rotateZ`).
2. Perspective-project points to screen space.
3. Draw segmented latitude and longitude curves across multiple shells (`DEFAULT_SHELLS`).
4. Draw gated rotating light bands (core + glow pass).
5. Apply vignette and palette selection (amber default, red flash mode).

The renderer exposes control-facing conversion helpers:

- `speedLevelToAngularVelocity`
- `wobbleLevelToAngularVelocity`
- `bandLevelToAngularVelocity`

This keeps UI controls and physics-like motion mapping consistent and centralized.

### 2.3 Practical Benefits of This Split

- Rendering math is versionable as code, not spread over animation declarations.
- The globe can be treated as one render target, simplifying structural complexity.
- New effects can be added by extending draw stages, not adding more DOM layers.

---

## 3. Git Migration Timeline

The transition happened in focused steps on **March 4, 2026**:

| Commit | Change | Evidence |
| --- | --- | --- |
| `f2ee864` | Introduced canvas renderer + control integration | `src/lib/retroGlobeCanvas.ts` added (`+565`), `src/app/RetroGlobe.tsx` reshaped (`+330/-158`), `src/styles/06-3d-globe.css` updated (`+52/-3`) |
| `344f18f` | Removed legacy CSS globe path | `src/styles/05-animations.css` (`0/+130 removed`), `src/styles/06-3d-globe.css` (`+12/-302`) |
| `dc708ca` | Refined control layout/behavior after canvas-only direction | `src/app/RetroGlobe.tsx` (`+39/-81`), `src/styles/06-3d-globe.css` (`+54/-28`) |

The net effect: old DOM-keyframe globe selectors/animations were removed, and the canvas path became the primary rendering system.

---

## 4. Runtime Comparison (Lightweight Metrics)

These values were captured with Chrome DevTools MCP inspection on **March 4, 2026**.

| Metric | Legacy CSS Baseline (`https://james-ralph.com/`) | New Canvas (`http://localhost:3000/`) |
| --- | --- | --- |
| Globe primitive | DOM + CSS transforms | Single `<canvas>` render target |
| Globe subtree node count | `27` | `3` |
| Globe classes present | `.globe-sphere: 1`, `.latitude-ring: 9`, `.meridian-line: 12` | `.globe-canvas: 1`, no legacy ring/sphere classes |
| Active globe CSS animations | `4` (`globe-rotate`, `globe-rotate-x`, `globe-rotate-z`, `globe-wobble`) | `0` |
| Canvas backing behavior | N/A | CSS `280x280`, backing `560x560` at DPR 2 |
| Long-task probe (short sample) | `0` observed | `0` observed |

Notes:

- This is a structural/runtime inspection, not a full performance benchmark.
- Background-tab timing can throttle animation callbacks, so direct FPS comparisons were intentionally excluded.

---

## 5. Why Canvas Won Here

The key win is control over the render pipeline.

In the CSS version, behavior was visually good but mechanically fragmented across many layers and animation declarations. In the canvas version, the same globe concept is encoded as one deterministic frame function with explicit stages and compositing.

That gives better leverage for:

- adding new shell/band styles,
- tuning motion curves and projection behavior,
- keeping interaction logic and render logic cleanly separated.

Tradeoff:

- You now own custom rendering code and math, which is more implementation-heavy than pure CSS.

For this component, that trade was worth it.

---

## 6. Closing

The migration was not about replacing CSS for its own sake. It was about moving a complex visual system from distributed animation layers into a single renderer with clearer control surfaces.

The resulting globe is easier to evolve, easier to reason about, and still matches the retro terminal aesthetic of the rest of the site.
