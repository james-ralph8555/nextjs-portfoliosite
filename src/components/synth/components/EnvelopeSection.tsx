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
    <div className="fused-terminal-layout h-full">
      <div className="terminal-header">
        <span className="terminal-header-text" style={{ backgroundColor: '#FF00FF', color: '#000000' }}>
          ENVELOPE
        </span>
      </div>
      
      <div className="p-4 space-y-6">
        {/* ADSR Controls Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
                Attack
              </div>
              <Knob
                value={attack}
                min={0.001}
                max={2}
                step={0.001}
                label="A"
                unit="s"
                color="magenta"
                onChange={onAttackChange}
                size="md"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
                Decay
              </div>
              <Knob
                value={decay}
                min={0.001}
                max={2}
                step={0.001}
                label="D"
                unit="s"
                color="magenta"
                onChange={onDecayChange}
                size="md"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
                Sustain
              </div>
              <Knob
                value={sustain}
                min={0}
                max={1}
                step={0.01}
                label="S"
                color="magenta"
                onChange={onSustainChange}
                size="md"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
                Release
              </div>
              <Knob
                value={release}
                min={0.001}
                max={5}
                step={0.001}
                label="R"
                unit="s"
                color="magenta"
                onChange={onReleaseChange}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Envelope Visualization */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Shape
          </div>
          <div className="h-24 bg-box-bg border border-box-outline rounded p-2">
            <svg width="100%" height="100%" viewBox="0 0 240 80" className="overflow-visible">
              {/* Grid */}
              <defs>
                <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 10" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Axes */}
              <line x1="0" y1="70" x2="240" y2="70" stroke="#333" strokeWidth="1" />
              <line x1="0" y1="10" x2="0" y2="70" stroke="#333" strokeWidth="1" />
              
              {/* ADSR Envelope Path */}
              <path 
                d={generateEnvelopePath(attack, decay, sustain, release)}
                stroke="#FF00FF" 
                strokeWidth="2" 
                fill="none"
                className="drop-shadow-[0_0_4px_rgba(255,0,255,0.3)]"
              />
              
              {/* Phase markers */}
              <circle cx="0" cy="70" r="3" fill="#FF00FF" />
              <circle cx={attack * 60} cy="10" r="3" fill="#FF00FF" />
              <circle cx={(attack + decay) * 60} cy={70 - sustain * 50} r="3" fill="#FF00FF" />
              <circle cx={(attack + decay + 1) * 60} cy={70 - sustain * 50} r="3" fill="#FF00FF" />
              <circle cx={(attack + decay + 1 + release) * 60} cy="70" r="3" fill="#FF00FF" />
              
              {/* Labels */}
              <text x="0" y="5" fill="#666" fontSize="8" fontFamily="monospace">1.0</text>
              <text x="0" y="75" fill="#666" fontSize="8" fontFamily="monospace">0.0</text>
              <text x="10" y="75" fill="#666" fontSize="8" fontFamily="monospace">A</text>
              <text x={attack * 60 - 5} y="75" fill="#666" fontSize="8" fontFamily="monospace">D</text>
              <text x={(attack + decay) * 60 - 5} y="75" fill="#666" fontSize="8" fontFamily="monospace">S</text>
              <text x={(attack + decay + 1) * 60 - 5} y="75" fill="#666" fontSize="8" fontFamily="monospace">R</text>
            </svg>
          </div>
        </div>

        {/* Current Values Display */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center space-y-1">
            <div className="text-table-text uppercase tracking-wider">Attack</div>
            <div className="value-box text-magenta-400">{attack.toFixed(3)}s</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-table-text uppercase tracking-wider">Decay</div>
            <div className="value-box text-magenta-400">{decay.toFixed(3)}s</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-table-text uppercase tracking-wider">Sustain</div>
            <div className="value-box text-magenta-400">{(sustain * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-table-text uppercase tracking-wider">Release</div>
            <div className="value-box text-magenta-400">{release.toFixed(3)}s</div>
          </div>
        </div>

        {/* Envelope Info */}
        <div className="text-xs font-mono text-table-text text-center">
          <div className="space-y-1">
            <div>Total Duration: {(attack + decay + release + 1).toFixed(2)}s</div>
            <div className="opacity-60">Amplitude → Time</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to generate ADSR envelope path
function generateEnvelopePath(attack: number, decay: number, sustain: number, release: number): string {
  const scaleX = 60 // Scale factor for time (1 second = 60 units)
  const scaleY = 50 // Scale factor for amplitude
  
  const attackX = attack * scaleX
  const decayX = (attack + decay) * scaleX
  const sustainY = 70 - (sustain * scaleY)
  const releaseX = (attack + decay + 1 + release) * scaleX // +1 for sustain duration
  
  return `M 0 70 L ${attackX} 10 L ${decayX} ${sustainY} L ${(attack + decay + 1) * scaleX} ${sustainY} L ${releaseX} 70`
}