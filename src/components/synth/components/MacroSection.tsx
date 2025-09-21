'use client'

import React from 'react'
import { Knob } from './Knob'

interface MacroSectionProps {
  macros: {
    1: number
    2: number
    3: number
    4: number
  }
  onMacroChange: (macro: number, value: number) => void
}

const MACRO_LABELS = {
  1: 'Brightness',
  2: 'Thickness', 
  3: 'Movement',
  4: 'Space'
}

export function MacroSection({
  macros,
  onMacroChange
}: MacroSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title">MACRO</div>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(macros).map(([num, value]) => (
          <div key={num} className="synth-knob-compact">
            <div className="text-[10px] font-mono text-cyan-400 mb-1 text-center">
              {MACRO_LABELS[num as keyof typeof MACRO_LABELS]}
            </div>
            <div className="flex justify-center">
              <Knob
                value={value * 100}
                min={0}
                max={100}
                step={1}
                label={`M${num}`}
                unit="%"
                onChange={(v) => onMacroChange(parseInt(num), v / 100)}
                size="md"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-700">
        <div className="text-[9px] font-mono text-gray-500 text-center">
          Macros control multiple parameters simultaneously
        </div>
      </div>
    </div>
  )
}