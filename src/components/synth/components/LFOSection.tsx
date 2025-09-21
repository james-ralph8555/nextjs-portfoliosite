'use client'

import React from 'react'
import { Knob } from './Knob'
import { LED } from './LED'

interface LFOSectionProps {
  waveform: OscillatorType
  rate: number
  depth: number
  targets: {
    pitch: boolean
    cutoff: boolean
    pulseWidth: boolean
    amp: boolean
  }
  onWaveformChange: (waveform: OscillatorType) => void
  onRateChange: (rate: number) => void
  onDepthChange: (depth: number) => void
  onTargetChange: (target: keyof typeof targets, enabled: boolean) => void
}

const WAVEFORMS: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle']

export function LFOSection({
  waveform,
  rate,
  depth,
  targets,
  onWaveformChange,
  onRateChange,
  onDepthChange,
  onTargetChange
}: LFOSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title flex items-center justify-between">
        <span>LFO/MOD</span>
        <LED active={targets.pitch || targets.cutoff || targets.amp} color="cyan" size="xs" />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Waveform Selection */}
        <div className="col-span-2">
          <div className="flex gap-1 justify-center">
            {WAVEFORMS.map((wf) => (
              <button
                key={wf}
                className={`synth-button-waveform ${waveform === wf ? 'active' : ''}`}
                onClick={() => onWaveformChange(wf)}
              >
                {wf.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Rate Knob */}
        <div className="synth-knob-compact">
          <Knob
            value={rate}
            min={0.1}
            max={20}
            step={0.1}
            label="Rate"
            unit=" Hz"
            onChange={onRateChange}
            size="sm"
          />
        </div>

        {/* Depth Knob */}
        <div className="synth-knob-compact">
          <Knob
            value={depth * 100}
            min={0}
            max={100}
            step={1}
            label="Depth"
            unit="%"
            onChange={(v) => onDepthChange(v / 100)}
            size="sm"
          />
        </div>

        {/* Targets */}
        <div className="col-span-2">
          <div className="text-[10px] font-mono text-gray-500 mb-1">Targets</div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(targets).map(([target, enabled]) => (
              <button
                key={target}
                className={`synth-button-small text-[9px] ${
                  enabled ? 'bg-cyan-600 text-white border-cyan-500' : ''
                }`}
                onClick={() => onTargetChange(target as keyof typeof targets, !enabled)}
              >
                {target.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}