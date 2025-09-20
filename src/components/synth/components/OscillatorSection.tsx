'use client'

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
    <div className="synth-section">
      <div className="synth-section-title">OSCILLATOR</div>
      
      {/* Waveform Selection */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {WAVEFORMS.map(({ value, label }) => (
          <button
            key={value}
            className={`
              synth-button-waveform
              ${waveform === value ? 'active' : ''}
            `}
            onClick={() => onWaveformChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Visual Waveform Representation */}
      <div className="synth-waveform-display">
        <svg width="100%" height="100%" viewBox="0 0 200 30" className="overflow-visible">
          {/* Waveform path */}
          {waveform === 'sawtooth' && (
            <path 
              d="M 0 25 L 10 5 L 10 25 L 20 5 L 20 25 L 30 5 L 30 25 L 40 5 L 40 25 L 50 5 L 50 25 L 60 5 L 60 25 L 70 5 L 70 25 L 80 5 L 80 25 L 90 5 L 90 25 L 100 5 L 100 25 L 110 5 L 110 25 L 120 5 L 120 25 L 130 5 L 130 25 L 140 5 L 140 25 L 150 5 L 150 25 L 160 5 L 160 25 L 170 5 L 170 25 L 180 5 L 180 25 L 190 5 L 190 25 L 200 5" 
              stroke="#E7F40F" 
              strokeWidth="1.5" 
              fill="none"
              className="opacity-80"
            />
          )}
          
          {waveform === 'square' && (
            <path 
              d="M 0 5 L 25 5 L 25 25 L 50 25 L 50 5 L 75 5 L 75 25 L 100 25 L 100 5 L 125 5 L 125 25 L 150 25 L 150 5 L 175 5 L 175 25 L 200 25" 
              stroke="#F8343D" 
              strokeWidth="1.5" 
              fill="none"
              className="opacity-80"
            />
          )}
          
          {waveform === 'sine' && (
            <path 
              d="M 0 15 Q 12.5 5, 25 5 T 50 15 T 75 15 T 100 15 T 125 15 T 150 15 T 175 15 T 200 15" 
              stroke="#5AFD81" 
              strokeWidth="1.5" 
              fill="none"
              className="opacity-80"
            />
          )}
          
          {waveform === 'triangle' && (
            <path 
              d="M 0 25 L 25 5 L 50 25 L 75 5 L 100 25 L 125 5 L 150 25 L 175 5 L 200 25" 
              stroke="#00FFFF" 
              strokeWidth="1.5" 
              fill="none"
              className="opacity-80"
            />
          )}
        </svg>
      </div>
    </div>
  )
}