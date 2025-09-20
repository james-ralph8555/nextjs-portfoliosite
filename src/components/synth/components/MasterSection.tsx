'use client'

import React from 'react'
import { Knob } from './Knob'

interface MasterSectionProps {
  gain: number
  delayTime: number
  delayFeedback: number
  delayMix: number
  onGainChange: (gain: number) => void
  onDelayTimeChange: (time: number) => void
  onDelayFeedbackChange: (feedback: number) => void
  onDelayMixChange: (mix: number) => void
}

export function MasterSection({
  gain,
  delayTime,
  delayFeedback,
  delayMix,
  onGainChange,
  onDelayTimeChange,
  onDelayFeedbackChange,
  onDelayMixChange
}: MasterSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title">MASTER</div>
      
      {/* Master Controls Grid */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {/* Volume Control */}
        <div className="synth-knob-compact">
          <Knob
            value={gain}
            min={0}
            max={1}
            step={0.01}
            label="VOL"
            color="green"
            onChange={onGainChange}
            size="xs"
          />
        </div>
        
        {/* Delay Time */}
        <div className="synth-knob-compact">
          <Knob
            value={delayTime}
            min={0}
            max={1}
            step={0.01}
            label="TIME"
            unit="s"
            color="amber"
            onChange={onDelayTimeChange}
            size="xs"
          />
        </div>
        
        {/* Delay Feedback */}
        <div className="synth-knob-compact">
          <Knob
            value={delayFeedback}
            min={0}
            max={0.95}
            step={0.01}
            label="FB"
            color="red"
            onChange={onDelayFeedbackChange}
            size="xs"
          />
        </div>

        {/* Delay Mix */}
        <div className="synth-knob-compact">
          <Knob
            value={delayMix}
            min={0}
            max={1}
            step={0.01}
            label="MIX"
            color="purple"
            onChange={onDelayMixChange}
            size="xs"
          />
        </div>
      </div>

      {/* Compact Level Meters */}
      <div className="grid grid-cols-2 gap-1">
        {/* Input Level */}
        <div className="bg-black border border-gray-700 rounded p-1">
          <div className="text-[8px] font-mono text-gray-500 mb-1">IN</div>
          <div className="h-4 bg-gray-900 rounded relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-100"
              style={{ width: `${Math.min(100, gain * 120)}%` }}
            />
          </div>
        </div>
        
        {/* Delay Level */}
        <div className="bg-black border border-gray-700 rounded p-1">
          <div className="text-[8px] font-mono text-gray-500 mb-1">DLY</div>
          <div className="h-4 bg-gray-900 rounded relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-red-500 transition-all duration-100"
              style={{ width: `${delayTime > 0 ? Math.min(100, delayFeedback * 120) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}