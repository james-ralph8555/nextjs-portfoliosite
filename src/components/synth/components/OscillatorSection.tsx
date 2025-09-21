'use client'

import React from 'react'
import { Knob } from './Knob'
import { LED } from './LED'

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

const WAVEFORMS: { value: OscillatorType; label: string; color: string }[] = [
  { value: 'sawtooth', label: 'SAW', color: 'amber' },
  { value: 'square', label: 'SQR', color: 'red' },
  { value: 'sine', label: 'SIN', color: 'green' },
  { value: 'triangle', label: 'TRI', color: 'cyan' }
]

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
      <div className="grid grid-cols-4 gap-1 mb-2">
        {WAVEFORMS.map(({ value, label }) => (
          <button
            key={value}
            className={`
              synth-button-waveform
              ${waveform === value ? 'active' : ''}
            `}
            onClick={() => onWaveformChange(value)}
          >
            {label}
          </button>
        ))}
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