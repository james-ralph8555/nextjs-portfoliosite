'use client'

import React from 'react'
import { Knob } from './Knob'
import { LED } from './LED'
import { WaveButtonGroup } from './WaveButton'

interface OscillatorSectionProps {
  waveform: OscillatorType
  mix: number
  unison: {
    enabled: boolean
    voices: number
    detune: number
  }
  glide: {
    enabled: boolean
    time: number
    legato: boolean
  }
  onWaveformChange: (waveform: OscillatorType) => void
  onMixChange: (mix: number) => void
  onUnisonChange: (unison: Partial<{ enabled: boolean; voices: number; detune: number }>) => void
  onGlideChange: (glide: Partial<{ enabled: boolean; time: number; legato: boolean }>) => void
}

const WAVEFORMS = ['sawtooth', 'square', 'sine', 'triangle'] as const

export function OscillatorSection({
  waveform,
  mix,
  unison,
  glide,
  onWaveformChange,
  onMixChange
}: OscillatorSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title">
        OSC/MIX
      </div>
      
      {/* Waveform Selection */}
      <div className="flex justify-center mb-2">
        <WaveButtonGroup
          waveforms={WAVEFORMS}
          selectedWaveform={waveform}
          onWaveformChange={onWaveformChange}
          labelMode="abbreviated"
          showIcons={true}
          size="md"
        />
      </div>

      {/* Mix Knob */}
      <div className="synth-knob-compact">
        <Knob
          value={mix}
          min={0}
          max={1}
          step={0.01}
          label="Mix"
          unit="%"
          onChange={(v) => onMixChange(v)}
          size="sm"
        />
      </div>
    </div>
  )
}