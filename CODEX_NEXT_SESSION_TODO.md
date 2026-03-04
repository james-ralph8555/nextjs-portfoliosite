# Next Session TODO (Globe)

## Priority Tasks
- [ ] Add PROFILE-header globe mode controls first:
  - [ ] Add two buttons at the right side of PROFILE header.
  - [ ] Switch between `V1` (legacy CSS globe) and `V2` (current canvas globe).
  - [ ] Keep behavior stable for drag, pause, and control panel interactions.
- [ ] Add auxiliary procedural graphs around/over the globe (NERV-style instrumentation).
- [ ] Update controls to support auxiliary graph tuning and final UX tweaks.

## Must Preserve
- [ ] Keep canvas/CSS-only approach (no WebGL/three.js).
- [ ] Keep both globe implementations available during this phase (`V1` CSS + `V2` canvas).
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

## Optional Cleanup
- [ ] Defer any legacy CSS globe cleanup until after mode toggle is complete and accepted.
