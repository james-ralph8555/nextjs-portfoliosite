'use client'

import React from 'react'

interface KeyboardProps {
  activeKeys: Record<string, string>
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#']

const KEY_MAPPING: Record<string, string> = {
  // First octave
  'z': 'C4', 's': 'C#4', 'x': 'D4', 'd': 'D#4', 'c': 'E4',
  'v': 'F4', 'g': 'F#4', 'b': 'G4', 'h': 'G#4', 'n': 'A4',
  'j': 'A#4', 'm': 'B4',
  // Second octave
  ',': 'C5', 'l': 'C#5', '.': 'D5', ';': 'D#5', '/': 'E5'
}

const REVERSE_MAPPING: Record<string, string> = Object.entries(KEY_MAPPING).reduce((acc, [key, note]) => {
  acc[note] = key
  return acc
}, {} as Record<string, string>)

export function Keyboard({ activeKeys, onNoteOn, onNoteOff }: KeyboardProps) {
  const octaves = [4, 5] // Two octaves
  const allNotes: string[] = []

  // Generate notes for both octaves
  for (const octave of octaves) {
    for (const note of WHITE_KEYS) {
      allNotes.push(`${note}${octave}`)
    }
  }

  const isKeyActive = (note: string) => {
    return Object.values(activeKeys).includes(note)
  }

  const getKeyLabel = (note: string) => {
    return REVERSE_MAPPING[note] || ''
  }

  const handleMouseDown = (note: string) => {
    onNoteOn(note)
  }

  const handleMouseUp = (note: string) => {
    onNoteOff(note)
  }

  const handleTouchStart = (e: React.TouchEvent, note: string) => {
    e.preventDefault()
    onNoteOn(note)
  }

  const handleTouchEnd = (e: React.TouchEvent, note: string) => {
    e.preventDefault()
    onNoteOff(note)
  }

  // Hardware-inspired keyboard layout
  return (
    <div className="relative h-24">
      {/* White keys */}
      <div className="flex h-full relative">
        {allNotes.map((note) => {
          const isBlackKey = BLACK_KEYS.some(bk => note.includes(bk))
          const keyLabel = getKeyLabel(note)
          const isActive = isKeyActive(note)

          if (isBlackKey) {
            return null // Handle black keys separately
          }

          return (
            <div
              key={note}
              className={`
                relative flex-1 border-r border-gray-600 last:border-r-0
                ${isActive ? 'bg-cyan-400' : 'bg-white hover:bg-gray-100'}
                transition-all duration-100 cursor-pointer select-none
                flex flex-col justify-end items-center pb-1
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
              <div className="text-[8px] font-mono text-gray-600 opacity-70">{keyLabel.toUpperCase()}</div>
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

            // Calculate position for black keys (positioned between white keys)
            const noteName = note.replace(/\d/, '')
            const octave = parseInt(note.replace(/\D/, ''))
            const whiteKeyIndex = WHITE_KEYS.indexOf(noteName.replace('#', ''))
            
            // Black keys are positioned at 2/3 of the previous white key
            const position = ((octave - 4) * 7 + whiteKeyIndex + 0.67) * (100 / 14)

            return (
              <div
                key={note}
                className={`
                  absolute w-6 h-16 rounded-b-sm
                  ${isActive ? 'bg-cyan-400' : 'bg-gray-900 hover:bg-gray-800'}
                  transition-all duration-100 cursor-pointer select-none
                  pointer-events-auto flex flex-col justify-end items-center pb-1
                  shadow-lg z-10
                `}
                style={{ left: `${position}%` }}
                onMouseDown={() => handleMouseDown(note)}
                onMouseUp={() => handleMouseUp(note)}
                onMouseLeave={() => {
                  if (isActive) handleMouseUp(note)
                }}
                onTouchStart={(e) => handleTouchStart(e, note)}
                onTouchEnd={(e) => handleTouchEnd(e, note)}
              >
                <div className="text-[7px] font-mono text-gray-400 opacity-60">{keyLabel.toUpperCase()}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}