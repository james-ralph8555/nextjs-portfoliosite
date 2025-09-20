'use client'

import React, { useMemo } from 'react'
import { Knob } from './Knob'

interface FilterSectionProps {
  cutoff: number
  resonance: number
  envelopeAmount: number
  onCutoffChange: (cutoff: number) => void
  onResonanceChange: (resonance: number) => void
  onEnvelopeAmountChange: (amount: number) => void
}

export function FilterSection({ 
  cutoff, 
  resonance, 
  envelopeAmount,
  onCutoffChange, 
  onResonanceChange,
  onEnvelopeAmountChange
}: FilterSectionProps) {
  // Memoize filter curve generation to prevent hydration mismatches
  const filterCurvePath = useMemo(() => {
    return generateFilterCurve(cutoff, resonance)
  }, [cutoff, resonance])

  const cutoffXPosition = useMemo(() => {
    return frequencyToX(cutoff)
  }, [cutoff])

  return (
    <div className="synth-section">
      <div className="synth-section-title">FILTER</div>
      
      <div className="grid grid-cols-3 gap-1 mb-2">
        {/* Cutoff Frequency */}
        <div className="synth-knob-compact">
          <Knob
            value={cutoff}
            min={20}
            max={20000}
            step={1}
            label="FREQ"
            unit="Hz"
            color="cyan"
            onChange={onCutoffChange}
            size="sm"
          />
        </div>

        {/* Resonance */}
        <div className="synth-knob-compact">
          <Knob
            value={resonance}
            min={0.1}
            max={30}
            step={0.1}
            label="Q"
            color="cyan"
            onChange={onResonanceChange}
            size="sm"
          />
        </div>

        {/* Envelope Amount */}
        <div className="synth-knob-compact">
          <Knob
            value={envelopeAmount}
            min={0}
            max={1}
            step={0.01}
            label="ENV"
            color="cyan"
            onChange={onEnvelopeAmountChange}
            size="sm"
          />
        </div>
      </div>

      {/* Filter Response Visualization */}
      <div className="synth-visualizer">
        <svg width="100%" height="100%" viewBox="0 0 200 60" className="overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="45" x2="200" y2="45" stroke="#333" strokeWidth="1" />
          <line x1="0" y1="15" x2="200" y2="15" stroke="#1a1a1a" strokeWidth="0.5" />
          
          {/* Frequency labels */}
          <text x="5" y="58" fill="#666" fontSize="8" fontFamily="monospace">20Hz</text>
          <text x="85" y="58" fill="#666" fontSize="8" fontFamily="monospace">1k</text>
          <text x="165" y="58" fill="#666" fontSize="8" fontFamily="monospace">20k</text>
          
          {/* Filter curve */}
          <path 
            d={filterCurvePath}
            stroke="#00FFFF" 
            strokeWidth="2" 
            fill="none"
            className="opacity-80"
          />
          
          {/* Cutoff indicator */}
          <line 
            x1={cutoffXPosition} 
            y1="15" 
            x2={cutoffXPosition} 
            y2="45" 
            stroke="#00FFFF" 
            strokeWidth="1" 
            strokeDasharray="2,2"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  )
}

// Helper functions
function frequencyToX(freq: number): number {
  // Logarithmic scale mapping
  const minFreq = Math.log10(20)
  const maxFreq = Math.log10(20000)
  const normalized = (Math.log10(freq) - minFreq) / (maxFreq - minFreq)
  return Math.max(0, Math.min(200, normalized * 200))
}

function generateFilterCurve(cutoff: number, resonance: number): string {
  const points = []
  const numPoints = 50
  
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * 200
    const freq = 20 * Math.pow(1000, x / 200) // Logarithmic frequency scale
    
    // Simple lowpass filter response calculation
    const normalizedFreq = freq / cutoff
    const response = 1 / Math.sqrt(1 + Math.pow(normalizedFreq, 2) * resonance)
    
    const y = 50 - (response * 35) // Scale and invert for display
    points.push(`${x},${Math.max(10, Math.min(50, y))}`)
  }
  
  return `M ${points.join(' L ')}`
}

function formatFrequency(freq: number): string {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k`
  }
  return Math.round(freq).toString()
}