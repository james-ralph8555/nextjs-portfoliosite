import React from 'react'

interface OscillatorSectionProps {
  waveform: OscillatorType
  onWaveformChange: (waveform: OscillatorType) => void
}

const WAVEFORMS: { value: OscillatorType; label: string; color: string }[] = [
  { value: 'sawtooth', label: 'SAW', color: 'amber' },
  { value: 'square', label: 'SQR', color: 'red' },
  { value: 'sine', label: 'SIN', color: 'green' },
  { value: 'triangle', label: 'TRI', color: 'cyan' }
]

export function OscillatorSection({ waveform, onWaveformChange }: OscillatorSectionProps) {
  return (
    <div className="fused-terminal-layout h-full">
      <div className="terminal-header">
        <span className="terminal-header-text" style={{ backgroundColor: '#E7F40F' }}>
          OSCILLATOR
        </span>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Waveform Selection */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider mb-3">
            Waveform
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {WAVEFORMS.map(({ value, label, color }) => (
              <button
                key={value}
                className={`
                  boombox-button h-12 font-mono text-xs
                  ${waveform === value 
                    ? `bg-${color}-500 text-black border-${color}-500` 
                    : 'text-table-text border-box-outline hover:border-primary-yellow'
                  }
                  transition-all duration-200
                `}
                onClick={() => onWaveformChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Waveform Info */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Current
          </div>
          <div className="value-box text-primary-yellow">
            {WAVEFORMS.find(w => w.value === waveform)?.label || 'SAW'}
          </div>
        </div>

        {/* Visual Waveform Representation */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Shape
          </div>
          <div className="h-16 bg-box-bg border border-box-outline rounded p-2 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 200 60" className="overflow-visible">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="200" y2="30" stroke="#333" strokeWidth="1" />
              <line x1="0" y1="10" x2="200" y2="10" stroke="#1a1a1a" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="200" y2="50" stroke="#1a1a1a" strokeWidth="0.5" />
              
              {/* Waveform path */}
              {waveform === 'sawtooth' && (
                <path 
                  d="M 0 50 L 20 10 L 20 50 L 40 10 L 40 50 L 60 10 L 60 50 L 80 10 L 80 50 L 100 10 L 100 50 L 120 10 L 120 50 L 140 10 L 140 50 L 160 10 L 160 50 L 180 10 L 180 50 L 200 10" 
                  stroke="#E7F40F" 
                  strokeWidth="2" 
                  fill="none"
                  className="animate-pulse"
                />
              )}
              
              {waveform === 'square' && (
                <path 
                  d="M 0 10 L 20 10 L 20 50 L 40 50 L 40 10 L 60 10 L 60 50 L 80 50 L 80 10 L 100 10 L 100 50 L 120 50 L 120 10 L 140 10 L 140 50 L 160 50 L 160 10 L 180 10 L 180 50 L 200 50" 
                  stroke="#F8343D" 
                  strokeWidth="2" 
                  fill="none"
                  className="animate-pulse"
                />
              )}
              
              {waveform === 'sine' && (
                <path 
                  d="M 0 30 Q 10 10, 20 10 T 40 30 T 60 30 T 80 30 T 100 30 T 120 30 T 140 30 T 160 30 T 180 30 T 200 30" 
                  stroke="#5AFD81" 
                  strokeWidth="2" 
                  fill="none"
                  className="animate-pulse"
                />
              )}
              
              {waveform === 'triangle' && (
                <path 
                  d="M 0 50 L 20 10 L 40 50 L 60 10 L 80 50 L 100 10 L 120 50 L 140 10 L 160 50 L 180 10 L 200 50" 
                  stroke="#00FFFF" 
                  strokeWidth="2" 
                  fill="none"
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>
        </div>

        {/* Frequency Range Info */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-table-text uppercase tracking-wider">
            Range
          </div>
          <div className="text-xs font-mono text-table-text">
            C1 - C8 (32Hz - 4.2kHz)
          </div>
        </div>
      </div>
    </div>
  )
}