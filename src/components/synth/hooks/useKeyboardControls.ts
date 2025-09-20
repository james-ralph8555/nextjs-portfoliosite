import { useState, useEffect } from 'react'

interface KeyboardControlsProps {
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

const KEY_MAPPING: Record<string, string> = {
  // White keys
  'z': 'C4',
  's': 'C#4',
  'x': 'D4',
  'd': 'D#4',
  'c': 'E4',
  'v': 'F4',
  'g': 'F#4',
  'b': 'G4',
  'h': 'G#4',
  'n': 'A4',
  'j': 'A#4',
  'm': 'B4',
  ',': 'C5',
  'l': 'C#5',
  '.': 'D5',
  ';': 'D#5',
  '/': 'E5',
  
  // Higher octave
  'q': 'C5',
  '2': 'C#5',
  'w': 'D5',
  '3': 'D#5',
  'e': 'E5',
  'r': 'F5',
  '5': 'F#5',
  't': 'G5',
  '6': 'G#5',
  'y': 'A5',
  '7': 'A#5',
  'u': 'B5',
  'i': 'C6',
  '9': 'C#6',
  'o': 'D6',
  '0': 'D#6',
  'p': 'E6'
}

export function useKeyboardControls({ onNoteOn, onNoteOff }: KeyboardControlsProps) {
  const [activeKeys, setActiveKeys] = useState<Record<string, string>>({})

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      
      // Skip if key is already active or modifier key
      if (activeKeys[key] || event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      const note = KEY_MAPPING[key]
      if (note) {
        event.preventDefault()
        setActiveKeys(prev => ({ ...prev, [key]: note }))
        onNoteOn(note)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const note = activeKeys[key]

      if (note) {
        event.preventDefault()
        setActiveKeys(prev => {
          const newKeys = { ...prev }
          delete newKeys[key]
          return newKeys
        })
        onNoteOff(note)
      }
    }

    // Handle window blur to prevent stuck notes
    const handleBlur = () => {
      Object.entries(activeKeys).forEach(([key, note]) => {
        onNoteOff(note)
      })
      setActiveKeys({})
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      
      // Release all active notes on cleanup
      Object.values(activeKeys).forEach(note => {
        onNoteOff(note)
      })
    }
  }, [activeKeys, onNoteOn, onNoteOff])

  return {
    activeKeys,
    KEY_MAPPING
  }
}