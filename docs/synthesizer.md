# Synthesizer Component: Web Audio Guide

This document explains how the in‑app synthesizer works, with a focus on the Web Audio API nodes, signal flow, and how UI controls map to audio behavior. It is separate from the main project README.

## Locations

- UI entry: `src/app/synth/page.tsx` renders `HybridSynth`.
- Main component: `src/components/synth/HybridSynth.tsx`.
- Engine/hook: `src/components/synth/hooks/useSynthEngine.ts`.
- UI sections: `src/components/synth/components/*` (oscillator, filter, envelope, LFO, chorus, keyboard, scopes, etc.).

## High‑Level Flow

1. User clicks the power button to initialize an `AudioContext` (required by autoplay policies).
2. UI interactions update state in `useSynthEngine` (waveform, filter, envelopes, delay, etc.).
3. On note on, a polyphonic voice is created (one or more `OscillatorNode`s) and connected through per‑voice nodes, then to shared effects and the output.
4. Visual scopes read from an `AnalyserNode` to draw waveform and spectrum.

## Audio Graph Overview

Per‑voice path (created on note on):

- `OscillatorNode`(s) → per‑voice `BiquadFilterNode` → per‑voice mixer `GainNode` → per‑voice envelope `GainNode` → per‑voice `GainNode` → shared nodes

Shared/effect path (initialized once):

- Shared `BiquadFilterNode` (global filter) → `GainNode` (master) → `audioContext.destination`
- Parallel delay send: per‑voice `GainNode` → shared `DelayNode` → feedback loop via `GainNode` → `DelayNode` → `GainNode` (mix) → destination
- `AnalyserNode` is tapped from the per‑voice output prior to shared processing for visualization.

Relevant nodes created in `useSynthEngine`:

- `AudioContext`: created lazily in `HybridSynth` on user gesture.
- `OscillatorNode`: one or multiple per voice (unison). Uses `type`, `frequency`, and `detune`.
- `BiquadFilterNode`: one per voice (modulated by envelope), plus one shared “global” low‑pass filter.
- `GainNode`: many — envelopes, mixers, delay feedback/mix, master.
- `DelayNode`: tempo‑agnostic delay with a feedback loop (gain‑controlled) and wet mix gain.
- `AnalyserNode`: provides time/frequency domain data for the scopes.
- `OscillatorNode` (LFO) + `GainNode` (LFO depth): created for modulation routing (see Notes & TODOs).

## Voice Lifecycle

Note on (`playNote`):

- Frequency mapping: simple table for C4–B5 in `noteToFrequency`.
- Unison: multiple oscillators per voice; each detuned with `osc.detune.value` in cents around the base pitch.
- Glide (portamento): if enabled and legato rules match, pitch ramps from previous note using `exponentialRampToValueAtTime` on `osc.frequency`.
- Amplitude envelope: ADSR applied via `envelopeGain.gain.setValueAtTime` then `linearRampToValueAtTime` for attack/decay/sustain.
- Filter envelope: separate ADSR via `filterEnvelopeGain`; this control signal is connected to the per‑voice filter `frequency` parameter.
- Routing: oscillators → per‑voice filter → per‑voice mixer → amp envelope → per‑voice gain → shared filter → master → destination. A parallel connection also feeds the delay. The analyser taps the per‑voice output for visualization.

Note off (`releaseNote`):

- The amp and filter envelopes ramp to 0 over their release times; oscillators stop after the longest release. Nodes are disconnected and removed.

Polyphony and voice stealing:

- `performance.maxPolyphony` limits concurrent voices. If exceeded and `voiceStealing` is on, the quietest/oldest voice is released to make room.

## Controls → Audio Params

- Oscillator: `waveform`, unison `voices` and `detune`, glide `time`/`legato` adjust `OscillatorNode` properties and scheduled ramps.
- Filter: `cutoff` → `BiquadFilterNode.frequency`, `resonance` → `Q`. There is a per‑voice filter and a shared global filter. The shared filter updates live via React effects; per‑voice filters keep the value they were created with.
- Envelopes: amp and filter ADSR shape `GainNode.gain` (amp) and modulate the per‑voice filter `frequency` (filter env amount is applied in the signal path).
- Delay: `time` → `DelayNode.delayTime`, `feedback` → feedback `GainNode.gain`, `mix` → wet mix `GainNode.gain`.
- Master: `gain` → master `GainNode.gain`.
- Scopes: canvases render using `AnalyserNode.getByteTimeDomainData` and `getByteFrequencyData` at a throttled frame rate.

## Initialization & Autoplay

- `HybridSynth` creates `AudioContext` on power button click and resumes it if suspended. Most browsers require a user gesture before starting audio.

## Notes & TODOs

- LFO routing: an LFO oscillator (`lfoRef`) and depth gain (`lfoGainRef`) are created and update with UI, but are not yet connected to targets. To apply modulation, connect `lfoRef → lfoGainRef → targetParam` where `targetParam` is an `AudioParam` (e.g., `filterRef.current!.frequency`). Scale depth appropriately (frequency expects Hz, pitch often uses cents via `detune`).
- Chorus effect: UI exists and mix gain is created, but no chorus processing node is currently wired. A basic chorus can be implemented by summing a few short modulated `DelayNode`s with per‑channel offsets and mixing them via `chorusGainRef`.
- Per‑voice filter updates: existing voices do not update their per‑voice filter when `filter.cutoff/Q` change; only new voices reflect changes. The shared global filter does update live.
- MIDI input: not implemented; keyboard uses a fixed computer‑key mapping over two octaves. MIDI can be added via Web MIDI (where available) or a small WASM shim; map note‑on/off to `playNote`/`releaseNote`.
- Presets: a couple of factory presets are defined; a full preset loader/saver is not yet implemented.

## Extending the Engine

- Adding LFO targets:
  - Pitch vibrato: connect `lfoGain` to each active oscillator’s `detune` (in cents) or small `frequency` offsets.
  - Filter wobble: connect `lfoGain` to `filterRef.current!.frequency`. Clamp and scale to avoid DC or inaudible ranges.
  - PWM: for square waves, modulate duty cycle via a custom node or waveshaper; the stock oscillator lacks PWM.
- Implementing chorus:
  - Create 2–3 short `DelayNode`s (~10–30 ms), modulate each delay time with its own LFO at low rate (0.3–2 Hz), pan them L/R, mix via `chorusGainRef` to master.
- Performance tips:
  - Reuse shared nodes; disconnect voices promptly after release.
  - Avoid scheduling dense parameter changes each frame; prefer envelopes and audio‑rate LFOs.
  - Keep `AnalyserNode.fftSize` reasonable (1024–2048) and throttle canvas draws (already done).

## Troubleshooting

- No sound: ensure you clicked the power button to initialize/resume the `AudioContext`. Check system/browsers output device.
- Clicks on note changes: increase attack/release and/or use `exponentialRampToValueAtTime` for pitch changes (already used for glide).
- Delay runaway/feedback: keep `feedback < 0.95` (UI enforces this).

## File Map (quick reference)

- Page: `src/app/synth/page.tsx`
- Component: `src/components/synth/HybridSynth.tsx`
- Engine: `src/components/synth/hooks/useSynthEngine.ts`
- Keyboard: `src/components/synth/components/Keyboard.tsx`
- Scopes: `src/components/synth/components/Scopes*.tsx`
- Knobs/UI: `src/components/synth/components/*.tsx`

