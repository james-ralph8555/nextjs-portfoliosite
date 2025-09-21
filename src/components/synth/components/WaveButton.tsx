'use client'

import React from 'react'

export type WaveformType = 'sawtooth' | 'square' | 'sine' | 'triangle'
export type LabelMode = 'full' | 'abbreviated' | 'single' | 'icons-only'

export interface WaveButtonGroupProps {
  waveforms: WaveformType[]
  selectedWaveform: WaveformType
  onWaveformChange: (waveform: WaveformType) => void
  labelMode?: LabelMode
  showIcons?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const WAVEFORM_CONFIG = {
  sawtooth: {
    label: 'SAW',
    abbreviatedLabel: 'SAW',
    singleLabel: 'S',
    icon: (
      <svg viewBox="0 0 40 20" className="w-full h-full">
        <path
          d="M 2 18 L 38 2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    )
  },
  square: {
    label: 'SQR',
    abbreviatedLabel: 'SQR',
    singleLabel: 'Q',
    icon: (
      <svg viewBox="0 0 40 20" className="w-full h-full">
        <path
          d="M 2 18 L 2 2 L 12 2 L 12 18 L 22 18 L 22 2 L 32 2 L 32 18 L 38 18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    )
  },
  sine: {
    label: 'SIN',
    abbreviatedLabel: 'SIN',
    singleLabel: 'I',
    icon: (
      <svg viewBox="0 0 40 20" className="w-full h-full">
        <path
          d="M 2 10 Q 10 2 20 10 T 38 10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    )
  },
  triangle: {
    label: 'TRI',
    abbreviatedLabel: 'TRI',
    singleLabel: 'T',
    icon: (
      <svg viewBox="0 0 40 20" className="w-full h-full">
        <path
          d="M 2 18 L 20 2 L 38 18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    )
  }
} as const

export function WaveButtonGroup({
  waveforms,
  selectedWaveform,
  onWaveformChange,
  labelMode = 'abbreviated',
  showIcons = false,
  size = 'md',
  className = ''
}: WaveButtonGroupProps) {
  const sizeClasses = {
    sm: 'h-8 text-[9px]',
    md: 'h-10 text-[10px]'
  }

  const getLabel = (waveform: WaveformType) => {
    const config = WAVEFORM_CONFIG[waveform]
    switch (labelMode) {
      case 'full':
        return waveform.charAt(0).toUpperCase() + waveform.slice(1)
      case 'single':
        return config.singleLabel
      case 'abbreviated':
      default:
        return config.abbreviatedLabel
      case 'icons-only':
        return ''
    }
  }

  return (
    <div className={`flex ${size === 'sm' ? 'w-32' : 'w-40'} ${className}`}>
      {waveforms.map((waveform, index) => {
        const config = WAVEFORM_CONFIG[waveform]
        const isSelected = selectedWaveform === waveform
        const isFirst = index === 0
        const isLast = index === waveforms.length - 1
        
        return (
          <button
            key={waveform}
            className={`
              synth-button-waveform
              flex-1
              ${sizeClasses[size]}
              ${isFirst ? 'rounded-l rounded-r-none' : ''}
              ${isLast ? 'rounded-r rounded-l-none' : 'rounded-none'}
              ${!isFirst && !isLast ? 'border-l-0' : ''}
              ${isSelected ? 'active' : ''}
              ${labelMode === 'icons-only' ? 'flex items-center justify-center' : showIcons ? 'flex flex-col items-center justify-center gap-0.5' : 'flex items-center justify-center'}
            `}
            style={isSelected ? { boxShadow: '0 0 8px rgba(56, 189, 248, 0.5)' } : undefined}
            onClick={() => onWaveformChange(waveform)}
            aria-label={`${waveform} waveform${isSelected ? ' (selected)' : ''}`}
            aria-pressed={isSelected}
          >
            {(showIcons || labelMode === 'icons-only') && (
              <div className={`${labelMode === 'icons-only' ? 'w-6 h-3' : 'w-6 h-3'} opacity-60`}>
                {config.icon}
              </div>
            )}
            {labelMode !== 'icons-only' && (
              <span className={showIcons ? 'text-[8px]' : ''}>
                {getLabel(waveform)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}