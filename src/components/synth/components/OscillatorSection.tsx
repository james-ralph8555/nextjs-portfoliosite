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
  onMixChange,
  onUnisonChange,
  onGlideChange
}: OscillatorSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title flex items-center justify-between">
        <span>OSC/MIX</span>
        <div className="flex gap-1">
          <LED active={unison.enabled} color="amber" size="xxs" />
          <LED active={glide.enabled} color="green" size="xxs" />
        </div>
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
      <div className="synth-knob-compact mb-2">
        <div className="synth-knob-label">Mix</div>
        <Knob
          value={mix}
          min={0}
          max={1}
          step={0.01}
          onChange={onMixChange}
          size="sm"
        />
        <div className="synth-knob-value">{(mix * 100).toFixed(0)}%</div>
      </div>

      {/* Unison Section */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-gray-500">UNISON</span>
          <button
            className={`synth-button-small text-[8px] px-2 ${
              unison.enabled ? 'bg-amber-600 text-white border-amber-500' : ''
            }`}
            onClick={() => onUnisonChange({ enabled: !unison.enabled })}
          >
            {unison.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {unison.enabled && (
          <div className="grid grid-cols-2 gap-1">
            <div className="synth-knob-compact">
              <div className="text-[8px] font-mono text-gray-500">Voices</div>
              <Knob
                value={unison.voices}
                min={2}
                max={6}
                step={1}
                onChange={(v) => onUnisonChange({ voices: Math.round(v) })}
                size="xs"
              />
              <div className="text-[8px] font-mono text-gray-400">{unison.voices}</div>
            </div>
            <div className="synth-knob-compact">
              <div className="text-[8px] font-mono text-gray-500">Detune</div>
              <Knob
                value={unison.detune}
                min={0.01}
                max={0.5}
                step={0.01}
                onChange={(v) => onUnisonChange({ detune: v })}
                size="xs"
              />
              <div className="text-[8px] font-mono text-gray-400">{unison.detune.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Glide Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-gray-500">GLIDE</span>
          <button
            className={`synth-button-small text-[8px] px-2 ${
              glide.enabled ? 'bg-green-600 text-white border-green-500' : ''
            }`}
            onClick={() => onGlideChange({ enabled: !glide.enabled })}
          >
            {glide.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {glide.enabled && (
          <div className="grid grid-cols-2 gap-1">
            <div className="synth-knob-compact">
              <div className="text-[8px] font-mono text-gray-500">Time</div>
              <Knob
                value={glide.time}
                min={0.01}
                max={1}
                step={0.01}
                onChange={(v) => onGlideChange({ time: v })}
                size="xs"
              />
              <div className="text-[8px] font-mono text-gray-400">{glide.time.toFixed(2)}s</div>
            </div>
            <div className="synth-knob-compact">
              <div className="text-[8px] font-mono text-gray-500">Legato</div>
              <button
                className={`synth-button-small text-[8px] w-full ${
                  glide.legato ? 'bg-cyan-600 text-white border-cyan-500' : ''
                }`}
                onClick={() => onGlideChange({ legato: !glide.legato })}
              >
                {glide.legato ? 'YES' : 'NO'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}