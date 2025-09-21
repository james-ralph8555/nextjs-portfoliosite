'use client'

import React from 'react'
import { Knob } from './Knob'
import { LED } from './LED'

interface ChorusSectionProps {
  rate: number
  depth: number
  mix: number
  drive: number
  onRateChange: (rate: number) => void
  onDepthChange: (depth: number) => void
  onMixChange: (mix: number) => void
  onDriveChange: (drive: number) => void
}

export function ChorusSection({
  rate,
  depth,
  mix,
  drive,
  onRateChange,
  onDepthChange,
  onMixChange,
  onDriveChange
}: ChorusSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title flex items-center justify-between">
        <span>FX BUS</span>
        <LED active={mix > 0} color="amber" size="xs" />
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {/* Rate Knob */}
        <div className="synth-knob-compact">
          <Knob
            value={rate}
            min={0.1}
            max={10}
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
            value={depth}
            min={0}
            max={1}
            step={0.01}
            label="Depth"
            unit="%"
            onChange={(v) => onDepthChange(v)}
            size="sm"
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

        {/* Drive Knob */}
        <div className="synth-knob-compact">
          <Knob
            value={drive}
            min={0}
            max={1}
            step={0.01}
            label="Drive"
            unit="%"
            onChange={(v) => onDriveChange(v)}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
