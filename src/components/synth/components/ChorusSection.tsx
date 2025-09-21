'use client'

import React from 'react'
import { Knob } from './Knob'
import { LED } from './LED'

interface ChorusSectionProps {
  rate: number
  depth: number
  mix: number
  onRateChange: (rate: number) => void
  onDepthChange: (depth: number) => void
  onMixChange: (mix: number) => void
}

export function ChorusSection({
  rate,
  depth,
  mix,
  onRateChange,
  onDepthChange,
  onMixChange
}: ChorusSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title flex items-center justify-between">
        <span>FX BUS</span>
        <LED active={mix > 0} color="amber" size="xs" />
      </div>
      
      <div className="flex gap-4">
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

        {/* Mix Knob */}
        <div className="synth-knob-compact">
          <Knob
            value={mix * 100}
            min={0}
            max={100}
            step={1}
            label="Mix"
            unit="%"
            onChange={(v) => onMixChange(v / 100)}
            size="sm"
          />
        </div>
      </div>

      {/* LED Level Meter */}
      <div className="flex items-center gap-2 mt-2">
        <div className="text-[9px] font-mono text-gray-500">Level</div>
        <div className="flex-1 flex gap-0.5">
          {Array.from({ length: 8 }, (_, i) => (
            <LED
              key={i}
              active={mix > (i / 8)}
              color="green"
              size="xxs"
            />
          ))}
        </div>
      </div>
    </div>
  )
}