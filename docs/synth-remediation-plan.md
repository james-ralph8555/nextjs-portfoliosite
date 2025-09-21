# Synthesizer Remediation and Wiring Plan

Author: Coding Agent

Goal: Make the HybridSynth functional and predictable by wiring existing UI to the audio graph, fixing critical bugs, trimming or gating non‑implemented features, and documenting a clear backlog for future improvements.

## Objectives
- Wire up core controls so changing UI produces audible results.
- Fix signal‑flow bugs (volume at 0 still audible via delay).
- Patch correctness issues (cleanup, voice stealing, envelope wiring).
- Optional: gate/disable clearly non‑implemented features to reduce confusion.
- Provide a concise manual test plan and acceptance criteria.

## Current State Summary (from audit)
- LFO created and updated, but not connected to any targets (pitch/cutoff/amp). Depth and targets have no effect.
- Delay wet path bypasses the master gain; audio is heard even with master volume at 0 when delay mix > 0.
- Filter envelope uses a GainNode that never receives a source signal; envelope amount is tracked in state but unused.
- “OSC/Mix” value is stored but unused.
- Chorus controls are present; no chorus node/graph is wired.
- Macros stored; unused by audio engine.
- Cleanup bug: code references `voice.oscillator` though Voice has `oscillators: OscillatorNode[]`.
- Voice stealing mismatch: `getVoiceToSteal` returns a voiceId, but `releaseNote` expects a note string; stealing doesn’t work.
- Polyphony exists conceptually; due to stealing mismatch, the cap is ineffective. (Manual testing should verify multi‑key chords render more than one voice.)

## Out‑of‑Scope (for this pass)
- Designing a full modulation matrix with per‑target depths and curves.
- Implementing a true chorus effect (multi‑tap modulated delay).
- Adding a second oscillator/sub oscillator (to give “Mix” a proper meaning) — this is proposed as future work.

---

## Implementation Plan (Phased)

### Phase 0 — Bug fixes and graph safety
1) Fix cleanup property
- Files: `src/components/synth/hooks/useSynthEngine.ts`
- Replace incorrect `voice.oscillator.stop()/disconnect()` with iteration over `voice.oscillators`.
- Acceptance: No runtime errors on teardown; no dangling connections.

2) Fix voice stealing
- Files: `useSynthEngine.ts`
- Approach: Implement `stealVoice(voiceId: string)` that applies a short release and disposes that specific voice. In `playNote`, when `getVoiceToSteal()` returns a voiceId, call `stealVoice` (do not call `releaseNote` which expects a note name).
- Acceptance: When `maxPolyphony=1`, pressing a second key steals the first voice audibly and predictably.

3) Route delay through master
- Files: `useSynthEngine.ts`
- Change: Reconfigure graph to put wet under master (post‑filter send):
  - Voices → Global filter (filterRef) → Master (masterGainRef) → Destination.
  - Global filter → Delay (delayRef → delayFeedback → delayGainRef) → Master (not destination).
  - Remove direct voice → delay connection.
- Acceptance: With master gain = 0, no sound is heard (including delay tails).

### Phase 1 — Filter envelope wiring
4) Make filter envelope functional with ConstantSource
- Files: `useSynthEngine.ts`
- For each voice:
  - Create `filterEnvSource = audioContext.createConstantSource()`.
  - Create `filterEnvAmount = audioContext.createGain()`.
  - Connect: `filterEnvSource → filterEnvAmount → voice.filter.frequency`.
  - Set `filterEnvAmount.gain.value = audioState.filter.envelopeAmount * envelopeRangeHz` (choose initial `envelopeRangeHz`, e.g., 2000 Hz; clamp resultant frequency 20–20000 in scheduling).
  - Schedule ADSR on `filterEnvSource.offset` (0 → 1 on attack, then to sustain, release to 0 on `releaseNote`).
  - `filterEnvSource.start(now)`; stop after release cleanup.
- Acceptance: With ENV > 0, audible filter sweeps follow ADSR on note on/off.

Notes:
- Keep the current per‑voice filter (modulated by envelope) and leave the UI global filter (filterRef) for overall tone shaping.
- Consider exponential mapping when summing to `filter.frequency` (optional follow‑up).

### Phase 2 — LFO wiring to targets
5) Create per‑target LFO gain nodes
- Files: `useSynthEngine.ts`
- On init, create:
  - `lfoRef` (Oscillator): running.
  - `lfoPitchGainRef`, `lfoCutoffGainRef`, `lfoAmpGainRef` (GainNode): start with `gain.value = 0`.
  - Connect: `lfoRef → each target gain`.
- Update logic: When `audioState.lfo.depth` or `targets` change, set each target gain:
  - Pitch: `lfoPitchGainRef.gain.value = depthInCents` (map 0..1 → 0..1200 cents, configurable).
  - Cutoff: `lfoCutoffGainRef.gain.value = depthInHz` (e.g., `depth * 0.5 * currentCutoff`, clamped to sensible range).
  - Amp: `lfoAmpGainRef.gain.value = depth * 0.5` (for bipolar → unipolar transform).
- Acceptance: Changing Depth and toggling a target changes respective gains (enable/disable by setting gain to 0 when target disabled).

6) Connect LFO targets to voice/global params
- Pitch vibrato: On voice creation, connect `lfoPitchGainRef` to each `osc.detune` of the voice if `targets.pitch` is true; disconnect on release.
- Filter wobble: Connect `lfoCutoffGainRef` to the global filter’s `filterRef.current.frequency` or to per‑voice filter frequency; choose global for simplicity in this pass.
- Tremolo (amp): Implement unipolar LFO on amplitude:
  - Create `ampDCRef = audioContext.createConstantSource()` with `offset = 1 - (depth*0.5)`.
  - Connect both `ampDCRef` and `lfoAmpGainRef` to each voice’s `envelopeGain.gain` when `targets.amp` is enabled; otherwise disconnect LFO and set `ampDCRef.offset = 1`.
  - Start/stop `ampDCRef` in lifecycle (or start once globally and share; sharing is acceptable since depth is global).
- Acceptance: With pitch target on, hear vibrato; with cutoff target on, hear filter sweep; with amp target on, hear tremolo.

Notes:
- Depth is global; if later per‑target depths are desired, see backlog.
- Ensure connects/disconnects are guarded by null checks and voice lifetimes.

### Phase 3 — OSC/Mix control
7) Minimal viable behavior for Mix
- Files: `useSynthEngine.ts`, `HybridSynth.tsx` (no prop changes required).
- Option A (simple, immediate): Treat `oscillator.mix` as per‑voice pre‑filter level.
  - On voice creation, set `gainNode.gain.value = oscillator.mix` (and still scale by velocity via envelopeGain).
  - Update active voices’ `gainNode.gain` when mix changes.
- Option B (future‑ready): Keep UI but mark as “disabled” until a second oscillator/sub is implemented to truly “mix” oscillators. See backlog below.
- Acceptance (if Option A): Turning Mix changes loudness of the oscillator pre‑FX; audible even at constant master.

### Phase 4 — UI trim or gating of non‑implemented features
8) Chorus section
- Files: `HybridSynth.tsx` (usage), `useSynthEngine.ts` (state & refs), `components/ChorusSection.tsx`.
- Option A: Hide the section behind a `const ENABLE_CHORUS = false` feature flag; keep code for later.
- Option B: Leave UI visible but add a “(disabled)” label; engine ignores controls.
- Acceptance: No user confusion; either the UI is not shown or clearly labeled as disabled.

9) Macros section
- Files: `HybridSynth.tsx`, `components/MacroSection.tsx`, `useSynthEngine.ts`.
- Option A: Hide by feature flag (preferred now).
- Option B: Keep visible with a “(unassigned)” subtitle.
- Acceptance: No error logs; no misleading UI implying functional routing.

### Phase 5 — QA and performance
10) Manual test plan (see below) + parameter smoothing where needed
- Add gentle parameter smoothing for abrupt changes (optional): `setTargetAtTime` / small ramps for master gain, filter cutoff.
- Ensure no parameter scheduling conflicts (cancel before set & ramp).
- Acceptance: No zipper noise; controls feel responsive and stable.

---

## Code Touchpoints
- `src/components/synth/hooks/useSynthEngine.ts`
  - Graph routing, lifecycle, and state → node mapping.
  - Add: `stealVoice`, per‑target LFO gains, amp DC source, filter envelope source/amount nodes.
  - Fix: cleanup bug, delay routing, voice stealing call site.
  - Use: `oscillator.mix` to scale per‑voice gain (Option A).
- `src/components/synth/HybridSynth.tsx`
  - Optionally gate Chorus/Macros; otherwise leave unchanged.
- `src/components/synth/components/*`
  - Optional: annotate disabled sections (Chorus/Macros) via labels.

---

## Acceptance Criteria (per issue)
- Volume at 0%: No audible sound, including delay tails.
- LFO/MOD: 
  - Pitch target produces audible vibrato; rate/depth change its character.
  - Cutoff target produces audible filter wobble.
  - Amp target produces audible tremolo with correct unipolar behavior.
- Filter Envelope: Increasing ENV produces a clear cutoff sweep according to ADSR.
- OSC/Mix: Turning the control yields an obvious loudness change (Option A).
- Voice Stealing: With `maxPolyphony=1`, chords “steal” older voice(s) predictably.
- Cleanup: No console errors on navigation/unmount; no stale voices left in the map.

---

## Manual Test Plan
- Init
  - Click INIT; play notes; confirm audio starts.
- Master volume
  - Set master to 0; play and verify silence; set delay mix high and confirm still silent.
- LFO targets
  - Pitch on: set depth ~0.3, rate ~5 Hz, hear vibrato.
  - Cutoff on: set cutoff mid, depth ~0.5, rate ~2 Hz; hear sweeping.
  - Amp on: depth ~0.5, rate ~4 Hz; hear tremolo. Toggle off → no tremolo.
- Filter envelope
  - Set ENV high (e.g., 0.8), attack 0.01, decay 0.2, sustain 0.3, release 0.4 — hear pluck‑like sweep.
- OSC/Mix (Option A)
  - Mix 0 → very quiet; Mix 1 → full.
- Polyphony & stealing
  - Set max polyphony 1: hold a key then press another; first voice should be stolen. Set polyphony 4: play chords; all notes sound, then older notes get stolen when exceeding 4.
- Teardown
  - Navigate away: no errors; re‑open synth: works.

---

## Technical Notes & Mappings
- LFO depth scaling
  - Pitch: `depth ∈ [0..1] → 0..1200 cents` mapped to `lfoPitchGain.gain`; connect to `osc.detune`.
  - Cutoff: `depth ∈ [0..1] → 0..(0.5*cutoff)` Hz; clamp final frequency 20..20000.
  - Amp: unipolar tremolo via DC offset: offset = `1 - depth/2`; `lfoAmpGain.gain = depth/2`.
- Filter envelope range
  - Start with `envelopeRangeHz = 2000` (tunable); clamp summed frequency 20..20000.
- Scheduling patterns
  - Always `cancelScheduledValues(now)` before scheduling ramps.
  - Use `linearRampToValueAtTime` for envelope shapes; optional `setTargetAtTime` for smoothing.

---

## Optional UI Adjustments (non‑blocking)
- Add small “disabled” badges on Chorus/Macros when gated.
- Add tiny numeric readouts beside knobs for troubleshooting (can reuse existing label/value display).
- Add a small “voices: N” indicator near LEDs for polyphony debugging.

---

## Backlog / Future Enhancements
- Proper Chorus effect
  - Multi‑tap modulated delay or all‑pass based design; stereo spread; pre/post options.
- Second oscillator (OSC2) + real Mix
  - Add blend between OSC1 and OSC2; per‑osc waveform; detune; hard‑sync or FM.
- Modulation Matrix
  - Per‑target LFO and Envelope depths; multiple LFOs; destination list (pitch, cutoff, Q, pan, amp, delay time/mix).
- Filter types and drive
  - LP/BP/HP; nonlinear saturation/drive stage; per‑voice vs global filter configuration.
- Per‑voice panning and stereo imaging; unison stereo spread.
- Preset system persistence
  - Save/load; JSON export; factory presets separate file.
- MPE/aftertouch support; MIDI input.
- Parameter smoothing utilities and UI rate‑limiters.
- Visual feedback
  - Simple LFO depth visualization; per‑voice envelope scopes.

---

## PR Checklist
- [ ] Fix cleanup and voice stealing; update unit comments in `Voice` interface.
- [ ] Re‑route delay under master; remove direct voice→delay path.
- [ ] Implement filter envelope with ConstantSource per voice; use ENV amount.
- [ ] Implement LFO targets with per‑target gains; connect/disconnect per voice.
- [ ] Make Mix control functional (Option A) or gate UI (Option B).
- [ ] Gate/label Chorus and Macros as disabled (or hide via flag).
- [ ] Manual test pass (matrix above) on Chrome/Firefox at least.
- [ ] Lint/build passes: `npm run lint`, `npm run build`.

---

## Rollback Plan
- All changes are confined to the synth files; can revert by backing out commits affecting `src/components/synth/**/*` and `HybridSynth.tsx`.

## Notes for the Implementer
- Keep changes minimal and focused. Avoid renaming public component props.
- Guard all node connections with null checks; disconnect in cleanups and on voice release.
- Prefer adding small helper functions for common tasks (connectLfoToVoice, scheduleFilterEnv) to keep `useSynthEngine` readable.
- Document any chosen constants (e.g., envelopeRangeHz, maxCents) at the top of the hook.

