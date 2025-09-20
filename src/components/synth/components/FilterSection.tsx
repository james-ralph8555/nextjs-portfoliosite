'use client'

import React, { useMemo } from 'react'
import { Knob } from './Knob'

interface FilterSectionProps {
  cutoff: number
  resonance: number
  onCutoffChange: (cutoff: number) => void
  onResonanceChange: (resonance: number) => void
}

export function FilterSection({ 
  cutoff, 
  resonance, 
  onCutoffChange, 
  onResonanceChange 
}: FilterSectionProps) {
  // Memoize filter curve generation to prevent hydration mismatches
  const filterCurvePath = useMemo(() => {
    return generateFilterCurve(cutoff, resonance)
  }, [cutoff, resonance])

  const cutoffXPosition = useMemo(() => {
    return frequencyToX(cutoff)
  }, [cutoff])

  return (
    <div className="fused-terminal-layout h-full">
      <div className="terminal-header">
        <span className="terminal-header-text" style={{ backgroundColor: '#00FFFF', color: '#000000' }}>
          FILTER
        </span>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Filter Type */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Type
          </div>
          <div className="value-box text-cyan-400">
            LOWPASS
          </div>
        </div>

        {/* Cutoff Frequency */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-4">
            Cutoff
          </div>
          <div className="flex justify-center">
            <Knob
              value={cutoff}
              min={20}
              max={20000}
              step={1}
              label="FREQ"
              unit="Hz"
              color="cyan"
              onChange={onCutoffChange}
              size="lg"
            />
          </div>
        </div>

        {/* Resonance */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-4">
            Resonance
          </div>
          <div className="flex justify-center">
            <Knob
              value={resonance}
              min={0.1}
              max={30}
              step={0.1}
              label="Q"
              color="cyan"
              onChange={onResonanceChange}
              size="lg"
            />
          </div>
        </div>

        {/* Filter Response Visualization */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Response
          </div>
          <div className="h-20 bg-box-bg border border-box-outline rounded p-2 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 200 60" className="overflow-visible">
              {/* Grid lines */}
              <line x1="0" y1="50" x2="200" y2="50" stroke="#333" strokeWidth="1" />
              <line x1="0" y1="10" x2="200" y2="10" stroke="#1a1a1a" strokeWidth="0.5" />
              
              {/* Frequency labels */}
              <text x="0" y="58" fill="#666" fontSize="8" fontFamily="monospace">20Hz</text>
              <text x="90" y="58" fill="#666" fontSize="8" fontFamily="monospace">1kHz</text>
              <text x="170" y="58" fill="#666" fontSize="8" fontFamily="monospace">20kHz</text>
              
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
                y1="10" 
                x2={cutoffXPosition} 
                y2="50" 
                stroke="#00FFFF" 
                strokeWidth="1" 
                strokeDasharray="2,2"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-xs font-mono text-table-text uppercase tracking-wider">
              Cutoff
            </div>
            <div className="value-box text-cyan-400 text-xs">
              {formatFrequency(cutoff)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono text-table-text uppercase tracking-wider">
              Resonance
            </div>
            <div className="value-box text-cyan-400 text-xs">
              {resonance.toFixed(1)}
            </div>
          </div>
        </div>
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