"use client"

import React from 'react'

export type FilterTypeOption = 'lowpass' | 'highpass' | 'bandpass' | 'notch'

interface Props {
  selectedType: FilterTypeOption
  onChange: (type: FilterTypeOption) => void
  size?: 'sm' | 'md'
  className?: string
}

const TYPES: { key: FilterTypeOption; label: string }[] = [
  { key: 'lowpass', label: 'LP' },
  { key: 'highpass', label: 'HP' },
  { key: 'bandpass', label: 'BP' },
  { key: 'notch', label: 'NOTCH' }
]

export function FilterTypeButtons({ selectedType, onChange, size = 'md', className = '' }: Props) {
  const sizeClasses = {
    sm: 'h-8 text-[9px]',
    md: 'h-10 text-[10px]'
  }

  return (
    <div className={`flex ${size === 'sm' ? 'w-40' : 'w-48'} ${className}`}>
      {TYPES.map((t, index) => {
        const isSelected = selectedType === t.key
        const isFirst = index === 0
        const isLast = index === TYPES.length - 1
        return (
          <button
            key={t.key}
            className={`
              synth-button-waveform
              flex-1
              ${sizeClasses[size]}
              ${isFirst ? 'rounded-l rounded-r-none' : ''}
              ${isLast ? 'rounded-r rounded-l-none' : 'rounded-none'}
              ${!isFirst && !isLast ? 'border-l-0' : ''}
              ${isSelected ? 'active' : ''}
              flex items-center justify-center
            `}
            style={isSelected ? { boxShadow: '0 0 8px rgba(56, 189, 248, 0.5)' } : undefined}
            onClick={() => onChange(t.key)}
            aria-label={`${t.label} filter${isSelected ? ' (selected)' : ''}`}
            aria-pressed={isSelected}
          >
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

