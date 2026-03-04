# Codex Next Session Brief (Globe Canvas-Only)

## Context
This repo uses a canvas-based projected-3D globe renderer for the profile panel. The legacy CSS/DOM globe has been removed.

Reference layout currently shown on page:
- Custom globe: `src/app/RetroGlobe.tsx`
- Reference gif (for matching style): `/public/nerv.gif`, rendered in `src/app/page.tsx`

Current static preview flow:
- `npm run build && npm run serve`
- App served at `http://localhost:3000`

## Hard Constraints (carry forward)
- No full-frame sprites
- No three.js / WebGL / WebGPU
- Native canvas is allowed
- CSS is allowed

## Current Globe Architecture (Canvas-Only)
- Renderer module: `src/lib/retroGlobeCanvas.ts`
  - 3 concentric shells (grid lines)
  - Pulse bands only on outer shell
  - Gated pulse logic: 24 gates, 12 on / 12 off
  - Adjacent band parity offset to avoid adjacent ONs between neighboring rings
  - Persistent "track" lines under pulse segments
- UI/component: `src/app/RetroGlobe.tsx`
  - Canvas + RAF render loop
  - Controls now include:
    - `SCAN` (line width)
    - `DENS` (line density)
    - `SPIN` (X/Y/Z levels)
    - `OSC` (wobble)
    - `BAND` (band speed, 0..5)
- Styles: `src/styles/06-3d-globe.css` (canvas/control styles only)

## New Work Requested for Next Session
1. Add auxiliary graphs like the original gif (NERV-style instrumentation).
2. Update controls (exact control UX/details to be finalized during implementation).

## Suggested Implementation Direction for Auxiliary Graphs
Goal: mimic NERV-like ancillary instrumentation around the globe without breaking constraints.

Recommended approach:
- Add an overlay canvas layer in `RetroGlobe` (same stage, absolutely positioned).
- Keep renderer separation:
  - `retroGlobeCanvas.ts` for globe/shell/pulse rendering
  - new module (suggested): `src/lib/retroGlobeOverlay.ts` for graphs/instrumentation
- Draw procedural elements (no sprite sheets):
  - horizontal/vertical traces
  - scanning bars / ticks
  - compact waveform windows
  - numeric telemetry blocks
  - orbit/path guides around the globe frame
- Drive overlay animation from shared time/runtime state so it feels synchronized with globe motion.

Acceptance criteria suggestion:
- Overlay clearly visible and stylistically close to `nerv.gif`
- Overlay remains performant at normal viewport size
- Overlay does not interfere with drag behavior or existing controls

## Suggested Control Update Strategy
If adding/adjusting controls:
- Keep control model in `RetroGlobe.tsx` state + `controlsRef`
- Extend `GlobeControlState` in `retroGlobeCanvas.ts` only when renderer needs new values
- Use existing boombox control style patterns for consistency

## Useful File Map
- `src/app/page.tsx` (sidebar composition + `nerv.gif`)
- `src/app/RetroGlobe.tsx` (interaction + controls + RAF)
- `src/lib/retroGlobeCanvas.ts` (math + globe renderer)
- `src/styles/06-3d-globe.css` (control/layout styles)
- `AGENTS.md` (repo-specific agent workflow, including static build/serve notes)

## Notes for Agent Startup
- Do not run `npm run dev`.
- Prefer static workflow (`build` + `serve`) for visual iteration.
- If background `serve` is needed, do it only when explicitly asked by user (policy already documented in `AGENTS.md`).
