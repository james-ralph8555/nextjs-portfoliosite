'use client'

import React from 'react'
import { Knob } from './Knob'

interface EnvelopeSectionProps {
  attack: number
  decay: number
  sustain: number
  release: number
  onAttackChange: (attack: number) => void
  onDecayChange: (decay: number) => void
  onSustainChange: (sustain: number) => void
  onReleaseChange: (release: number) => void
}

export function EnvelopeSection({
  attack,
  decay,
  sustain,
  release,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange
}: EnvelopeSectionProps) {
  return (
    <div className="synth-section">
      <div className="synth-section-title">ENVELOPE</div>
      
      {/* ADSR Controls Grid */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        <div className="synth-knob-compact">
          <Knob
            value={attack}
            min={0.001}
            max={2}
            step={0.001}
            label="Atk"
            unit="s"
            color="magenta"
            onChange={onAttackChange}
            size="sm"
          />
        </div>
        
        <div className="synth-knob-compact">
          <Knob
            value={decay}
            min={0.001}
            max={2}
            step={0.001}
            label="Dec"
            unit="s"
            color="magenta"
            onChange={onDecayChange}
            size="sm"
          />
        </div>
        
        <div className="synth-knob-compact">
          <Knob
            value={sustain}
            min={0}
            max={1}
            step={0.01}
            label="Sus"
            color="magenta"
            onChange={onSustainChange}
            size="sm"
          />
        </div>
        
        <div className="synth-knob-compact">
          <Knob
            value={release}
            min={0.001}
            max={5}
            step={0.001}
            label="Rel"
            unit="s"
            color="magenta"
            onChange={onReleaseChange}
            size="sm"
          />
        </div>
      </div>

      {/* Envelope Visualization */}
      <div className="synth-visualizer">
        <svg width="100%" height="100%" viewBox="0 0 240 90" className="overflow-visible">
          {/* Grid */}
          <defs>
            <pattern id="grid-compact" width="20" height="8" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 8" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-compact)" />
          
          {/* Axes */}
          <line x1="0" y1="75" x2="240" y2="75" stroke="#333" strokeWidth="1" />
          <line x1="0" y1="15" x2="0" y2="75" stroke="#333" strokeWidth="1" />
          
          {/* ADSR Envelope Path */}
          <path 
            d={generateEnvelopePath(attack, decay, sustain, release)}
            stroke="#FF00FF" 
            strokeWidth="1.5" 
            fill="none"
            className="opacity-80"
          />
          
          {/* Phase markers */}
          <circle cx="0" cy="70" r="2" fill="#FF00FF" />
          <circle cx={Math.min(attack * 40, 80)} cy="20" r="2" fill="#FF00FF" />
          <circle cx={Math.min((attack + decay) * 40, 120)} cy={70 - sustain * 50} r="2" fill="#FF00FF" />
          <circle cx={Math.min((attack + decay) * 40, 120) + 30} cy={70 - sustain * 50} r="2" fill="#FF00FF" />
          <circle cx={Math.min((attack + decay) * 40, 120) + 30 + Math.min(release * 40, 70)} cy="70" r="2" fill="#FF00FF" />
          
          {/* Labels */}
          <text x="5" y="17" fill="#666" fontSize="7" fontFamily="monospace">1.0</text>
          <text x="5" y="77" fill="#666" fontSize="7" fontFamily="monospace">0.0</text>
          <text x="8" y="77" fill="#666" fontSize="7" fontFamily="monospace">Atk</text>
          <text x={Math.min(attack * 40, 80) - 5} y="77" fill="#666" fontSize="7" fontFamily="monospace">Dec</text>
          <text x={Math.min((attack + decay) * 40, 120) - 5} y="77" fill="#666" fontSize="7" fontFamily="monospace">Sus</text>
          <text x={Math.min((attack + decay) * 40, 120) + 25} y="77" fill="#666" fontSize="7" fontFamily="monospace">Rel</text>
        </svg>
      </div>
    </div>
  )
}

// Helper function to generate ADSR envelope path
function generateEnvelopePath(attack: number, decay: number, sustain: number, release: number): string {
  const scaleX = 40 // Reduced scale factor to prevent overflow
  const scaleY = 50 // Scale factor for amplitude
  
  const attackX = Math.min(attack * scaleX, 80) // Cap at 80 to leave room
  const decayX = Math.min((attack + decay) * scaleX, 120) // Cap at 120
  const sustainY = 70 - (sustain * scaleY) // Base at 70, scale down
  const sustainDuration = 30 // Fixed sustain duration for display
  const releaseX = Math.min(decayX + sustainDuration + (release * scaleX), 220) // Cap at 220
  
  return `M 0 70 L ${attackX} 20 L ${decayX} ${sustainY} L ${decayX + sustainDuration} ${sustainY} L ${releaseX} 70`
}