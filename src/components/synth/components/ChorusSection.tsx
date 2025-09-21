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
      
      <div className="grid grid-cols-2 gap-2">
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

        {/* LED Level Meter - Span full width */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mt-1">
            <div className="text-[9px] font-mono text-gray-500">Level</div>
            <div className="flex-1 flex gap-0.5">
              {Array.from({ length: 8 }, (_, i) => (
                <LED
                  key={i}
                  active={(mix + drive * 0.5) > (i / 8)}
                  color="green"
                  size="xxs"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
