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
      
      <div className="space-y-2">
        {/* Rate Knob */}
        <div className="synth-knob-compact">
          <div className="synth-knob-label">Rate</div>
          <Knob
            value={rate}
            min={0.1}
            max={10}
            step={0.1}
            onChange={onRateChange}
            size="sm"
          />
          <div className="synth-knob-value">{rate.toFixed(1)} Hz</div>
        </div>

        {/* Depth Knob */}
        <div className="synth-knob-compact">
          <div className="synth-knob-label">Depth</div>
          <Knob
            value={depth}
            min={0}
            max={1}
            step={0.01}
            onChange={onDepthChange}
            size="sm"
          />
          <div className="synth-knob-value">{(depth * 100).toFixed(0)}%</div>
        </div>

        {/* Mix Knob */}
        <div className="synth-knob-compact">
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
    </div>
  )
}