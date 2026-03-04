# Next Session TODO (Globe)

## Priority Tasks
- [ ] Add auxiliary procedural graphs around/over the globe (NERV-style instrumentation).
- [ ] Update controls to support auxiliary graph tuning and final UX tweaks.

## Must Preserve
- [ ] Keep canvas-only approach (no WebGL/three.js).
- [ ] Keep 3 concentric shell feel.
- [ ] Keep outer-shell-only gated pulse bands.
- [ ] Keep `BAND` speed 0..5 behavior:
  - 0 = stopped
  - 1..5 linear ramp to max speed at 5

## Verification Pass
- [ ] `npm run lint` (warnings in synth hooks are pre-existing)
- [ ] `npm run build && npm run serve`
- [ ] Chrome MCP visual compare vs `nerv.gif`
- [ ] Confirm controls still work with drag/pause
