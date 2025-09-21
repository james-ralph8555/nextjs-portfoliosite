'use client'

import React, { useState } from 'react'

interface KeyboardProps {
  activeKeys: Record<string, string>
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
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

export function Keyboard({ activeKeys, onNoteOn, onNoteOff }: KeyboardProps) {
  const [mouseActiveKeys, setMouseActiveKeys] = useState<Set<string>>(new Set())
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

  const handleMouseDown = (note: string) => {
    setMouseActiveKeys(prev => new Set(prev).add(note))
    onNoteOn(note)
  }

  const handleMouseUp = (note: string) => {
    setMouseActiveKeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(note)
      return newSet
    })
    onNoteOff(note)
  }

  const handleTouchStart = (e: React.TouchEvent, note: string) => {
    e.preventDefault()
    setMouseActiveKeys(prev => new Set(prev).add(note))
    onNoteOn(note)
  }

  const handleTouchEnd = (e: React.TouchEvent, note: string) => {
    e.preventDefault()
    setMouseActiveKeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(note)
      return newSet
    })
    onNoteOff(note)
  }

  // Hardware-inspired keyboard layout
  // Get the actual white keys that will be rendered (filtered by key mapping)
  const renderedWhiteKeys = allNotes.filter(note => !BLACK_KEYS.some(bk => note.includes(bk)))
  
  return (
    <div className="relative h-24">
      {/* White keys using CSS Grid for consistent sizing */}
      <div className="grid h-full relative" style={{ gridTemplateColumns: `repeat(${renderedWhiteKeys.length}, 1fr)` }}>
        {renderedWhiteKeys.map((note, index) => {
          const keyLabel = getKeyLabel(note)
          const isActive = isKeyActive(note)

          return (
            <div
              key={note}
              className={`
                relative border-r border-gray-600 last:border-r-0
                ${isActive ? 'bg-cyan-300' : 'bg-white hover:bg-gray-100'}
                transition-all duration-100 cursor-pointer select-none
                flex flex-col justify-between items-center py-1
                shadow-inner
              `}
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
                  absolute w-7 h-16 rounded-b-sm
                  ${isActive ? 'bg-cyan-600' : 'bg-gray-900 hover:bg-gray-800'}
                  transition-all duration-100 cursor-pointer select-none
                  pointer-events-auto flex flex-col justify-between items-center py-1 flex-col-reverse
                  shadow-lg z-20
                `}
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
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
