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
            label="A"
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
            label="D"
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
            label="S"
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
            label="R"
            unit="s"
            color="magenta"
            onChange={onReleaseChange}
            size="sm"
          />
        </div>
      </div>

      {/* Envelope Visualization */}
      <div className="synth-visualizer">
        <svg width="100%" height="100%" viewBox="0 0 240 60" className="overflow-visible">
          {/* Grid */}
          <defs>
            <pattern id="grid-compact" width="20" height="8" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 8" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-compact)" />
          
          {/* Axes */}
          <line x1="0" y1="50" x2="240" y2="50" stroke="#333" strokeWidth="1" />
          <line x1="0" y1="10" x2="0" y2="50" stroke="#333" strokeWidth="1" />
          
          {/* ADSR Envelope Path */}
          <path 
            d={generateEnvelopePath(attack, decay, sustain, release)}
            stroke="#FF00FF" 
            strokeWidth="1.5" 
            fill="none"
            className="opacity-80"
          />
          
          {/* Phase markers */}
          <circle cx="0" cy="50" r="2" fill="#FF00FF" />
          <circle cx={attack * 60} cy="10" r="2" fill="#FF00FF" />
          <circle cx={(attack + decay) * 60} cy={50 - sustain * 35} r="2" fill="#FF00FF" />
          <circle cx={(attack + decay + 1) * 60} cy={50 - sustain * 35} r="2" fill="#FF00FF" />
          <circle cx={(attack + decay + 1 + release) * 60} cy="50" r="2" fill="#FF00FF" />
          
          {/* Labels */}
          <text x="5" y="8" fill="#666" fontSize="7" fontFamily="monospace">1.0</text>
          <text x="5" y="55" fill="#666" fontSize="7" fontFamily="monospace">0.0</text>
          <text x="8" y="55" fill="#666" fontSize="7" fontFamily="monospace">A</text>
          <text x={attack * 60 - 3} y="55" fill="#666" fontSize="7" fontFamily="monospace">D</text>
          <text x={(attack + decay) * 60 - 3} y="55" fill="#666" fontSize="7" fontFamily="monospace">S</text>
          <text x={(attack + decay + 1) * 60 - 3} y="55" fill="#666" fontSize="7" fontFamily="monospace">R</text>
        </svg>
      </div>
    </div>
  )
}

// Helper function to generate ADSR envelope path
function generateEnvelopePath(attack: number, decay: number, sustain: number, release: number): string {
  const scaleX = 60 // Scale factor for time (1 second = 60 units)
  const scaleY = 35 // Scale factor for amplitude (smaller for compact display)
  
  const attackX = attack * scaleX
  const decayX = (attack + decay) * scaleX
  const sustainY = 50 - (sustain * scaleY)
  const releaseX = (attack + decay + 1 + release) * scaleX // +1 for sustain duration
  
  return `M 0 50 L ${attackX} 10 L ${decayX} ${sustainY} L ${(attack + decay + 1) * scaleX} ${sustainY} L ${releaseX} 50`
}