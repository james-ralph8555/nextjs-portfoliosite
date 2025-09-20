import React from 'react'

interface LEDProps {
  active: boolean
  color: 'green' | 'amber' | 'red' | 'cyan' | 'magenta'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export function LED({ active, color, label, size = 'md', pulse = false }: LEDProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const colorClasses = {
    green: active ? 'bg-primary-green' : 'bg-gray-700',
    amber: active ? 'bg-primary-yellow' : 'bg-gray-700',
    red: active ? 'bg-primary-red' : 'bg-gray-700',
    cyan: active ? 'bg-cyan-400' : 'bg-gray-700',
    magenta: active ? 'bg-magenta-400' : 'bg-gray-700'
  }

  const glowClasses = {
    green: active ? 'shadow-lg shadow-primary-green/50' : '',
    amber: active ? 'shadow-lg shadow-primary-yellow/50' : '',
    red: active ? 'shadow-lg shadow-primary-red/50' : '',
    cyan: active ? 'shadow-lg shadow-cyan-400/50' : '',
    magenta: active ? 'shadow-lg shadow-magenta-400/50' : ''
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          ${glowClasses[color]}
          rounded-full 
          transition-all duration-300
          ${active && pulse ? 'animate-pulse' : ''}
          ${active ? 'opacity-100' : 'opacity-40'}
        `}
      />
      {label && (
        <span className="text-xs font-mono text-table-text uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  )
}

// Special blinking LED for activity indicators
interface BlinkingLEDProps extends LEDProps {
  blinkSpeed?: 'slow' | 'normal' | 'fast'
}

export function BlinkingLED({ 
  active, 
  color, 
  label, 
  size = 'md', 
  blinkSpeed = 'normal' 
}: BlinkingLEDProps) {
  const blinkClasses = {
    slow: 'animate-pulse',
    normal: 'animate-pulse',
    fast: 'animate-ping'
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`
          ${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} 
          rounded-full 
          transition-all duration-300
          ${active ? color === 'green' ? 'bg-primary-green animate-pulse shadow-lg shadow-primary-green/50' :
                   color === 'amber' ? 'bg-primary-yellow animate-pulse shadow-lg shadow-primary-yellow/50' :
                   color === 'red' ? 'bg-primary-red animate-pulse shadow-lg shadow-primary-red/50' :
                   color === 'cyan' ? 'bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50' :
                   'bg-magenta-400 animate-pulse shadow-lg shadow-magenta-400/50' :
                   'bg-gray-700 opacity-40'
          }
        `}
      />
      {label && (
        <span className="text-xs font-mono text-table-text uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  )
}

// Multi-LED array for complex status displays
interface LEDArrayProps {
  leds: Array<{
    active: boolean
    color: 'green' | 'amber' | 'red' | 'cyan' | 'magenta'
    label?: string
  }>
  direction?: 'horizontal' | 'vertical'
  spacing?: 'tight' | 'normal' | 'loose'
}

export function LEDArray({ leds, direction = 'horizontal', spacing = 'normal' }: LEDArrayProps) {
  const spacingClasses = {
    tight: direction === 'horizontal' ? 'space-x-1' : 'space-y-1',
    normal: direction === 'horizontal' ? 'space-x-2' : 'space-y-2',
    loose: direction === 'horizontal' ? 'space-x-4' : 'space-y-4'
  }

  const containerClasses = `
    flex 
    ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} 
    ${spacingClasses[spacing]}
    items-center
  `

  return (
    <div className={containerClasses}>
      {leds.map((led, index) => (
        <LED
          key={index}
          active={led.active}
          color={led.color}
          label={led.label}
          size="sm"
          pulse={led.active}
        />
      ))}
    </div>
  )
}

// VU meter style LED bar
interface VUMeterProps {
  level: number // 0-1
  color?: 'green' | 'amber' | 'red' | 'gradient'
  segments?: number
  label?: string
}

export function VUMeter({ 
  level, 
  color = 'gradient', 
  segments = 12, 
  label 
}: VUMeterProps) {
  const activeSegments = Math.floor(level * segments)

  const getSegmentColor = (index: number) => {
    if (color === 'gradient') {
      if (index < segments * 0.6) return 'bg-green-500'
      if (index < segments * 0.8) return 'bg-yellow-500'
      return 'bg-red-500'
    }
    
    const colorMap = {
      green: 'bg-primary-green',
      amber: 'bg-primary-yellow',
      red: 'bg-primary-red'
    }
    return colorMap[color] || 'bg-primary-green'
  }

  return (
    <div className="space-y-1">
      {label && (
        <div className="text-xs font-mono text-table-text uppercase tracking-wider">
          {label}
        </div>
      )}
      <div className="flex space-x-1">
        {Array.from({ length: segments }, (_, index) => (
          <div
            key={index}
            className={`
              w-2 h-6 rounded-sm transition-all duration-100
              ${index < activeSegments ? 
                `${getSegmentColor(index)} shadow-sm` : 
                'bg-gray-800'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}