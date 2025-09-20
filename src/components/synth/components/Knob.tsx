import React, { useState, useRef, useEffect } from 'react'

interface KnobProps {
  value: number
  min: number
  max: number
  step?: number
  label: string
  unit?: string
  color?: 'green' | 'amber' | 'red' | 'cyan' | 'magenta'
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function Knob({
  value,
  min,
  max,
  step = 0.01,
  label,
  unit = '',
  color = 'green',
  onChange,
  size = 'md'
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false)
  const knobRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startValueRef = useRef(value)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const colorClasses = {
    green: 'text-primary-green border-primary-green',
    amber: 'text-primary-yellow border-primary-yellow',
    red: 'text-primary-red border-primary-red',
    cyan: 'text-cyan-400 border-cyan-400',
    magenta: 'text-magenta-400 border-magenta-400'
  }

  const valueToRotation = (val: number): number => {
    const normalized = (val - min) / (max - min)
    return normalized * 270 - 135 // -135 to +135 degrees
  }

  const rotationToValue = (rotation: number): number => {
    const normalized = (rotation + 135) / 270
    const clamped = Math.max(0, Math.min(1, normalized))
    return min + clamped * (max - min)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startYRef.current = e.clientY
    startValueRef.current = value
    e.preventDefault()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    startYRef.current = e.touches[0].clientY
    startValueRef.current = value
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const deltaY = startYRef.current - e.clientY
    const sensitivity = 0.5
    const valueChange = deltaY * sensitivity * ((max - min) / 100)
    const newValue = Math.max(min, Math.min(max, startValueRef.current + valueChange))
    
    onChange(Math.round(newValue / step) * step)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return

    const deltaY = startYRef.current - e.touches[0].clientY
    const sensitivity = 0.5
    const valueChange = deltaY * sensitivity * ((max - min) / 100)
    const newValue = Math.max(min, Math.min(max, startValueRef.current + valueChange))
    
    onChange(Math.round(newValue / step) * step)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging])

  const rotation = valueToRotation(value)
  const displayValue = unit ? `${value}${unit}` : value.toString()

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-xs font-mono text-table-text uppercase tracking-wider">
        {label}
      </div>
      
      <div
        ref={knobRef}
        className={`
          relative rounded-full border-2 ${colorClasses[color]}
          ${sizeClasses[size]} cursor-grab select-none
          transition-all duration-200 hover:shadow-lg
          ${isDragging ? 'cursor-grabbing scale-105' : ''}
          bg-box-bg flex items-center justify-center
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Knob indicator line */}
        <div
          className="absolute w-0.5 h-1/2 bg-current origin-bottom"
          style={{
            transform: `translateY(-50%) rotate(${rotation}deg)`,
            bottom: '50%'
          }}
        />
        
        {/* Center dot */}
        <div className="w-2 h-2 rounded-full bg-current opacity-50" />
        
        {/* Rotation indicators */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * 45) - 135
            const isActive = Math.abs(rotation - angle) < 22.5
            return (
              <div
                key={i}
                className={`absolute w-1 h-1 rounded-full ${
                  isActive ? 'bg-current opacity-100' : 'bg-current opacity-20'
                }`}
                style={{
                  left: '50%',
                  top: '15%',
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-12px)`
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Value display */}
      <div className={`value-box text-xs ${colorClasses[color].replace('border', 'text')}`}>
        {displayValue}
      </div>
    </div>
  )
}