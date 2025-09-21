'use client'

import React from 'react'
import { LED } from './LED'

interface VoiceToggleProps {
  enabled: boolean
  onToggle: () => void
  voiceNumber: 1 | 2
  color?: 'amber' | 'cyan'
  className?: string
}

export function VoiceToggle({ 
  enabled, 
  onToggle, 
  voiceNumber, 
  color = voiceNumber === 1 ? 'amber' : 'cyan',
  className = ''
}: VoiceToggleProps) {
  const toggleColor = enabled ? `bg-${color}-600 text-white border-${color}-500` : 'bg-gray-700 text-gray-300 border-gray-600'
  
  const buttonClasses = `
    synth-skeu-button 
    text-[8px] 
    ml-1
    ${toggleColor}
    ${className}
  `.trim()

  return (
    <div className="flex items-center gap-1">
      <LED active={enabled} color={color} size="xxs" />
      <span className="text-[9px] font-mono text-gray-500">V{voiceNumber}</span>
      <button
        onClick={onToggle}
        className={buttonClasses}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}