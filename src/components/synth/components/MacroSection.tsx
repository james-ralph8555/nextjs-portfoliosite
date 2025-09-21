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
  1: 'Bright',
  2: 'Thick', 
  3: 'Move',
  4: 'Space'
}

export function MacroSection({
  macros,
  onMacroChange
}: MacroSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title">MACRO</div>
      
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(macros).map(([num, value]) => (
          <div key={num} className="synth-knob-compact">
            <div className="text-[9px] font-mono text-gray-400 mb-1 text-center">
              {MACRO_LABELS[parseInt(num) as keyof typeof MACRO_LABELS]}
            </div>
            <div className="flex justify-center">
              <Knob
                value={value}
                min={0}
                max={1}
                step={0.01}
                label=""
                unit="%"
                onChange={(v) => onMacroChange(parseInt(num), v)}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Spacer to match height of LFO/MOD section */}
      <div className="flex-1 min-h-[16px]"></div>

    </div>
  )
}
