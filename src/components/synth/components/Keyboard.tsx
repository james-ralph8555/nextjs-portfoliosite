'use client'

import React, { useState, useRef, useEffect } from 'react'

interface KeyboardProps {
  activeKeys: Record<string, string>
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
  onMouseActiveKeysChange?: (activeKeys: Set<string>) => void
}

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#']

// Define black key positions relative to white keys (0-indexed positions)
const BLACK_KEY_POSITIONS = {
  'C#': 0,    // After C (position 0)
  'D#': 1,    // After D (position 1)  
  'F#': 3,    // After F (position 3)
  'G#': 4,    // After G (position 4)
  'A#': 5     // After A (position 5)
}

const KEY_MAPPING: Record<string, string> = {
  // White keys: a s d f g h j k l ; 
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4',
  'k': 'C5', 'l': 'D5', ';': 'E5',
  
  // Black keys: w e t y u o p
  'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4',
  'o': 'C#5', 'p': 'D#5'
}

const REVERSE_MAPPING: Record<string, string> = Object.entries(KEY_MAPPING).reduce((acc, [key, note]) => {
  acc[note] = key
  return acc
}, {} as Record<string, string>)

export function Keyboard({ activeKeys, onNoteOn, onNoteOff, onMouseActiveKeysChange }: KeyboardProps) {
  const [mouseActiveKeys, setMouseActiveKeys] = useState<Set<string>>(new Set())
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [isTouchActive, setIsTouchActive] = useState(false)
  const [currentMouseKey, setCurrentMouseKey] = useState<string | null>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)
  const octaves = [4, 5] // Two octaves
  const allNotes: string[] = []

  // Generate notes for all octaves (both white and black keys)
  for (const octave of octaves) {
    // Add white keys
    for (const note of WHITE_KEYS) {
      const noteWithOctave = `${note}${octave}`
      if (REVERSE_MAPPING[noteWithOctave]) {
        allNotes.push(noteWithOctave)
      }
    }
    // Add black keys
    for (const note of BLACK_KEYS) {
      const noteWithOctave = `${note}${octave}`
      if (REVERSE_MAPPING[noteWithOctave]) {
        allNotes.push(noteWithOctave)
      }
    }
  }

  const isKeyActive = (note: string) => {
    return Object.values(activeKeys).includes(note) || mouseActiveKeys.has(note)
  }

  const getKeyLabel = (note: string) => {
    return REVERSE_MAPPING[note] || ''
  }

  const handleMouseUp = (note: string) => {
    if (currentMouseKey === note) {
      setIsMouseDown(false)
      setCurrentMouseKey(null)
    }
    setMouseActiveKeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(note)
      return newSet
    })
    onNoteOff(note)
  }

  const handleTouchEnd = (e: React.TouchEvent, note: string) => {
    e.preventDefault()
    if (currentMouseKey === note) {
      setIsTouchActive(false)
      setCurrentMouseKey(null)
    }
    setMouseActiveKeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(note)
      return newSet
    })
    onNoteOff(note)
  }

  // Find the key at a given position
  const getKeyAtPosition = (x: number, y: number): string | null => {
    if (!keyboardRef.current) return null
    
    const containerRect = keyboardRef.current.getBoundingClientRect()
    const relativeX = x - containerRect.left
    const relativeY = y - containerRect.top
    
    // Check black keys first (they're on top)
    const blackKeyElements = keyboardRef.current.querySelectorAll('.key-black')
    for (const element of blackKeyElements) {
      const rect = element.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const note = element.getAttribute('data-note')
        return note || null
      }
    }
    
    // Check white keys
    const whiteKeyElements = keyboardRef.current.querySelectorAll('.key-white')
    for (const element of whiteKeyElements) {
      const rect = element.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const note = element.getAttribute('data-note')
        return note || null
      }
    }
    
    return null
  }

  // Handle mouse movement while dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !keyboardRef.current) return
    
    const key = getKeyAtPosition(e.clientX, e.clientY)
    if (key && key !== currentMouseKey) {
      // Release previous key
      if (currentMouseKey) {
        setMouseActiveKeys(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentMouseKey)
          return newSet
        })
        onNoteOff(currentMouseKey)
      }
      
      // Activate new key
      setCurrentMouseKey(key)
      setMouseActiveKeys(prev => new Set(prev).add(key))
      onNoteOn(key)
    }
  }

  // Handle touch movement while dragging
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchActive || !keyboardRef.current) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const key = getKeyAtPosition(touch.clientX, touch.clientY)
    
    if (key && key !== currentMouseKey) {
      // Release previous key
      if (currentMouseKey) {
        setMouseActiveKeys(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentMouseKey)
          return newSet
        })
        onNoteOff(currentMouseKey)
      }
      
      // Activate new key
      setCurrentMouseKey(key)
      setMouseActiveKeys(prev => new Set(prev).add(key))
      onNoteOn(key)
    }
  }

  // Global mouse up handler
  const handleGlobalMouseUp = () => {
    if (isMouseDown && currentMouseKey) {
      setMouseActiveKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(currentMouseKey)
        return newSet
      })
      onNoteOff(currentMouseKey)
    }
    setIsMouseDown(false)
    setCurrentMouseKey(null)
  }

  // Global touch end handler
  const handleGlobalTouchEnd = () => {
    if (isTouchActive && currentMouseKey) {
      setMouseActiveKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(currentMouseKey)
        return newSet
      })
      onNoteOff(currentMouseKey)
    }
    setIsTouchActive(false)
    setCurrentMouseKey(null)
  }

  // Notify parent of mouseActiveKeys changes
  useEffect(() => {
    if (onMouseActiveKeysChange) {
      onMouseActiveKeysChange(mouseActiveKeys)
    }
  }, [mouseActiveKeys, onMouseActiveKeysChange])

  // Add global event listeners
  useEffect(() => {
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchend', handleGlobalTouchEnd)
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isMouseDown, isTouchActive, currentMouseKey])

  // Hardware-inspired keyboard layout
  // Get the actual white keys that will be rendered (filtered by key mapping)
  const renderedWhiteKeys = allNotes.filter(note => !BLACK_KEYS.some(bk => note.includes(bk)))
  
  // Update mouse down handler to enable continuous movement
  const handleMouseDown = (note: string) => {
    setIsMouseDown(true)
    setCurrentMouseKey(note)
    setMouseActiveKeys(prev => new Set(prev).add(note))
    onNoteOn(note)
  }

  // Update touch start handler to enable continuous movement
  const handleTouchStart = (e: React.TouchEvent, note: string) => {
    e.preventDefault()
    setIsTouchActive(true)
    setCurrentMouseKey(note)
    setMouseActiveKeys(prev => new Set(prev).add(note))
    onNoteOn(note)
  }

  return (
    <div 
      ref={keyboardRef}
      className="relative h-24"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseLeave={() => {
        if (isMouseDown && currentMouseKey) {
          setMouseActiveKeys(prev => {
            const newSet = new Set(prev)
            newSet.delete(currentMouseKey)
            return newSet
          })
          onNoteOff(currentMouseKey)
          setCurrentMouseKey(null)
        }
      }}
    >
      {/* White keys using CSS Grid for consistent sizing */}
      <div className="grid h-full relative" style={{ gridTemplateColumns: `repeat(${renderedWhiteKeys.length}, 1fr)` }}>
        {renderedWhiteKeys.map((note, index) => {
          const keyLabel = getKeyLabel(note)
          const isActive = isKeyActive(note)

          return (
            <div
              key={note}
              className={`
                key-white relative border-r border-gray-600 last:border-r-0
                ${isActive ? 'bg-cyan-300' : 'bg-white hover:bg-gray-100'}
                transition-all duration-100 cursor-pointer select-none
                flex flex-col justify-between items-center py-1
              `}
              data-active={isActive}
              data-note={note}
              onMouseDown={() => handleMouseDown(note)}
              onMouseUp={() => handleMouseUp(note)}
              onMouseLeave={() => {
                if (isActive) handleMouseUp(note)
              }}
              onTouchStart={(e) => handleTouchStart(e, note)}
              onTouchEnd={(e) => handleTouchEnd(e, note)}
            >
              <div className="hidden md:block text-xs font-mono text-gray-500 font-medium">{note}</div>
              <div className="hidden md:block text-xs font-mono text-gray-700 font-medium">{keyLabel.toUpperCase()}</div>
              <div className="md:hidden text-xs font-mono text-gray-500 font-medium mt-auto">{note}</div>
            </div>
          )
        })}

        {/* Black keys overlay */}
        <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none">
          {allNotes.map((note) => {
            const isBlackKey = BLACK_KEYS.some(bk => note.includes(bk))
            const keyLabel = getKeyLabel(note)
            const isActive = isKeyActive(note)

            if (!isBlackKey) return null

            // Find the position of this black key relative to white keys
            const noteName = note.replace(/\d+$/, '') // Remove octave
            const blackKeyPosition = BLACK_KEY_POSITIONS[noteName as keyof typeof BLACK_KEY_POSITIONS]
            
            if (typeof blackKeyPosition !== 'number') {
              return null
            }
            
            // Calculate which white key this black key follows
            const octave = parseInt(note.replace(/^\D+/, ''))
            const octaveStartIndex = (octave - 4) * WHITE_KEYS.length
            const whiteKeyIndex = octaveStartIndex + blackKeyPosition
            
            // Find the actual rendered white key at this position
            const targetWhiteKey = renderedWhiteKeys[whiteKeyIndex]
            
            if (!targetWhiteKey) return null
            
            // Position black key at 75% between white keys for proper alignment
            const position = ((whiteKeyIndex + 1) / renderedWhiteKeys.length) * 100
            
            return (
              <div
                key={note}
                className={`
                  key-black absolute w-7 h-16 rounded-b-sm
                  ${isActive ? 'bg-cyan-600' : 'bg-gray-900 hover:bg-gray-800'}
                  transition-all duration-100 cursor-pointer select-none
                  pointer-events-auto flex flex-col justify-between items-center py-1 flex-col-reverse
                  z-20
                `}
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                data-active={isActive}
                data-note={note}
                onMouseDown={() => handleMouseDown(note)}
                onMouseUp={() => handleMouseUp(note)}
                onMouseLeave={() => {
                  if (isActive) handleMouseUp(note)
                }}
                onTouchStart={(e) => handleTouchStart(e, note)}
                onTouchEnd={(e) => handleTouchEnd(e, note)}
              >
                <div className="text-xs font-mono text-white font-medium hidden md:block">{keyLabel.toUpperCase()}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
