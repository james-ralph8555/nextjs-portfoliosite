'use client'

import React from 'react'
import { Knob } from './Knob'

interface MasterSectionProps {
  gain: number
  delayTime: number
  delayFeedback: number
  onGainChange: (gain: number) => void
  onDelayTimeChange: (time: number) => void
  onDelayFeedbackChange: (feedback: number) => void
}

export function MasterSection({
  gain,
  delayTime,
  delayFeedback,
  onGainChange,
  onDelayTimeChange,
  onDelayFeedbackChange
}: MasterSectionProps) {
  return (
    <div className="fused-terminal-layout">
      <div className="terminal-header">
        <span className="terminal-header-text" style={{ backgroundColor: '#5AFD81' }}>
          MASTER
        </span>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Master Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volume Control */}
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
                Volume
              </div>
              <Knob
                value={gain}
                min={0}
                max={1}
                step={0.01}
                label="VOL"
                color="green"
                onChange={onGainChange}
                size="lg"
              />
            </div>
            <div className="text-center">
              <div className="value-box text-primary-green text-xs">
                {Math.round(gain * 100)}%
              </div>
            </div>
          </div>
          
          {/* Delay Time */}
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
                Delay Time
              </div>
              <Knob
                value={delayTime}
                min={0}
                max={1}
                step={0.01}
                label="TIME"
                unit="s"
                color="amber"
                onChange={onDelayTimeChange}
                size="lg"
              />
            </div>
            <div className="text-center">
              <div className="value-box text-primary-yellow text-xs">
                {delayTime.toFixed(2)}s
              </div>
            </div>
          </div>
          
          {/* Delay Feedback */}
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
                Feedback
              </div>
              <Knob
                value={delayFeedback}
                min={0}
                max={0.95}
                step={0.01}
                label="FB"
                color="red"
                onChange={onDelayFeedbackChange}
                size="lg"
              />
            </div>
            <div className="text-center">
              <div className="value-box text-primary-red text-xs">
                {Math.round(delayFeedback * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Delay Status */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Delay Effect
          </div>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${delayTime > 0 ? 'bg-primary-green animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-xs font-mono text-table-text">
                {delayTime > 0 ? 'ACTIVE' : 'BYPASS'}
              </span>
            </div>
            <div className="text-xs font-mono text-table-text opacity-60">
              {delayFeedback > 0.5 ? 'HIGH FEEDBACK' : delayFeedback > 0.2 ? 'MEDIUM FEEDBACK' : 'LOW FEEDBACK'}
            </div>
          </div>
        </div>

        {/* Level Meters */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Levels
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Input Level */}
            <div className="space-y-1">
              <div className="text-xs font-mono text-table-text">Input</div>
              <div className="h-6 bg-box-bg border border-box-outline rounded relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-green to-primary-yellow transition-all duration-100"
                  style={{ width: `${Math.min(100, gain * 120)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-mono text-black mix-blend-difference">
                    {Math.round(gain * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Delay Level */}
            <div className="space-y-1">
              <div className="text-xs font-mono text-table-text">Delay</div>
              <div className="h-6 bg-box-bg border border-box-outline rounded relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-yellow to-primary-red transition-all duration-100"
                  style={{ width: `${delayTime > 0 ? Math.min(100, delayFeedback * 120) : 0}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-mono text-black mix-blend-difference">
                    {delayTime > 0 ? Math.round(delayFeedback * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Master Info */}
        <div className="text-center">
          <div className="text-xs font-mono text-table-text opacity-60">
            Hybrid Synth Engine v1.0 • Web Audio API
          </div>
        </div>
      </div>
    </div>
  )
}