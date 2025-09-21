import { useState, useEffect } from 'react'

interface KeyboardControlsProps {
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

const KEY_MAPPING: Record<string, string> = {
  // White keys: a s d f g h j k l ; 
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4',
  'k': 'C5', 'l': 'D5', ';': 'E5',
  
  // Black keys: w e t y u o p
  'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4',
  'o': 'C#5', 'p': 'D#5'
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