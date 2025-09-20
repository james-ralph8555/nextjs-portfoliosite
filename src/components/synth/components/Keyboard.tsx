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

  // Desktop layout - wide keyboard
  return (
    <div className="space-y-4">
      {/* QWERTY Key Reference */}
      <div className="text-center">
        <div className="text-xs font-mono text-table-text mb-2">
          Keyboard: Z S X D C V G B H N J M , L . ; /
        </div>
      </div>

      {/* Desktop Keyboard */}
      <div className="hidden md:block">
        <div className="relative h-32 bg-box-bg rounded-lg border border-box-outline p-4">
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
                    relative flex-1 border border-box-outline rounded-b-md
                    ${isActive ? 'bg-primary-green text-black' : 'bg-white hover:bg-gray-100'}
                    transition-all duration-150 cursor-pointer select-none
                    flex flex-col justify-end items-center pb-2
                    mx-0.5 first:ml-0 last:mr-0
                  `}
                  onMouseDown={() => handleMouseDown(note)}
                  onMouseUp={() => handleMouseUp(note)}
                  onMouseLeave={() => {
                    if (isActive) handleMouseUp(note)
                  }}
                  onTouchStart={(e) => handleTouchStart(e, note)}
                  onTouchEnd={(e) => handleTouchEnd(e, note)}
                >
                  <div className="text-xs font-mono opacity-60">{keyLabel.toUpperCase()}</div>
                  <div className="text-xs font-mono opacity-40 mt-1">{note}</div>
                </div>
              )
            })}

            {/* Black keys overlay */}
            <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none">
              {allNotes.map((note) => {
                const isBlackKey = BLACK_KEYS.some(bk => note.includes(bk))
                const keyLabel = getKeyLabel(note)
                const isActive = isKeyActive(note)

                if (!isBlackKey) return null

                // Calculate position for black keys
                const whiteKeyIndex = allNotes.findIndex(wn => {
                  const wnNote = wn.replace(/\d/, '')
                  const bkNote = note.replace(/\d/, '')
                  return wnNote === WHITE_KEYS[WHITE_KEYS.indexOf(bkNote.replace('#', '')) - 1]
                })
                
                if (whiteKeyIndex === -1) return null

                const position = (whiteKeyIndex + 0.75) * (100 / allNotes.length)

                return (
                  <div
                    key={note}
                    className={`
                      absolute w-8 h-20 rounded-b-md border border-box-outline
                      ${isActive ? 'bg-primary-green text-black' : 'bg-gray-800 hover:bg-gray-700'}
                      transition-all duration-150 cursor-pointer select-none
                      pointer-events-auto flex flex-col justify-end items-center pb-2
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
                    <div className="text-xs font-mono text-white opacity-60">{keyLabel.toUpperCase()}</div>
                    <div className="text-xs font-mono text-white opacity-40 mt-1">{note}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Keyboard - Compact */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {allNotes.slice(0, 14).map((note) => {
            const isBlackKey = BLACK_KEYS.some(bk => note.includes(bk))
            const isActive = isKeyActive(note)

            if (isBlackKey) {
              // Add black keys as smaller buttons between white keys
              return (
                <div
                  key={note}
                  className={`
                    h-16 rounded border border-box-outline text-xs
                    ${isActive ? 'bg-primary-green text-black' : 'bg-gray-800 hover:bg-gray-700'}
                    transition-all duration-150 cursor-pointer select-none
                    flex flex-col justify-end items-center pb-1
                  `}
                  onMouseDown={() => handleMouseDown(note)}
                  onMouseUp={() => handleMouseUp(note)}
                  onTouchStart={(e) => handleTouchStart(e, note)}
                  onTouchEnd={(e) => handleTouchEnd(e, note)}
                >
                  <div className="font-mono">{note}</div>
                </div>
              )
            }

            return (
              <div
                key={note}
                className={`
                  h-24 rounded border border-box-outline
                  ${isActive ? 'bg-primary-green text-black' : 'bg-white hover:bg-gray-100'}
                  transition-all duration-150 cursor-pointer select-none
                  flex flex-col justify-end items-center pb-2
                `}
                onMouseDown={() => handleMouseDown(note)}
                onMouseUp={() => handleMouseUp(note)}
                onTouchStart={(e) => handleTouchStart(e, note)}
                onTouchEnd={(e) => handleTouchEnd(e, note)}
              >
                <div className="text-xs font-mono opacity-60">{getKeyLabel(note).toUpperCase()}</div>
                <div className="text-xs font-mono opacity-40 mt-1">{note}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}