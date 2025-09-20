'use client'

import React, { useState, useEffect, useRef } from 'react'
import { OscillatorSection } from './components/OscillatorSection'
import { FilterSection } from './components/FilterSection'
import { EnvelopeSection } from './components/EnvelopeSection'
import { MasterSection } from './components/MasterSection'
import { Keyboard } from './components/Keyboard'
import { Analyzer } from './components/Analyzer'
import { LED } from './components/LED'
import { useSynthEngine } from './hooks/useSynthEngine'
import { useKeyboardControls } from './hooks/useKeyboardControls'

export function HybridSynth() {
  const [isInitialized, setIsInitialized] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const {
    audioState,
    updateOscillator,
    updateFilter,
    updateEnvelope,
    updateGain,
    updateDelay,
    playNote,
    releaseNote,
    isPlaying
  } = useSynthEngine(audioContextRef.current)

  const { activeKeys } = useKeyboardControls({
    onNoteOn: playNote,
    onNoteOff: releaseNote
  })

  // Initialize audio context on first user interaction
  const initAudio = async () => {
    if (!isInitialized) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = context
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize audio context:', error)
      }
    }
  }

  // Handle audio context resume
  const handleInitClick = async () => {
    await initAudio()
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }

  return (
    <div className="synth-chassis max-w-4xl mx-auto">
      {/* Status Bar */}
      <div className="synth-status-bar">
        <div className="flex items-center space-x-3">
          <LED active={isInitialized} color="green" size="sm" />
          <LED active={isPlaying} color="amber" size="sm" />
          <LED active={Object.keys(activeKeys).length > 0} color="cyan" size="sm" />
        </div>
        
        {!isInitialized && (
          <button
            onClick={handleInitClick}
            className="synth-button-small bg-cyan-600 text-cyan-100 border-cyan-500 hover:bg-cyan-500"
          >
            INIT
          </button>
        )}
      </div>

      {/* Main Control Panel */}
      <div className="synth-control-panel">
        <OscillatorSection 
          waveform={audioState.oscillator.waveform}
          onWaveformChange={(waveform) => updateOscillator({ waveform })}
        />
        
        <FilterSection 
          cutoff={audioState.filter.cutoff}
          resonance={audioState.filter.resonance}
          onCutoffChange={(cutoff) => updateFilter({ cutoff })}
          onResonanceChange={(resonance) => updateFilter({ resonance })}
        />
        
        <EnvelopeSection 
          attack={audioState.envelope.attack}
          decay={audioState.envelope.decay}
          sustain={audioState.envelope.sustain}
          release={audioState.envelope.release}
          onAttackChange={(attack) => updateEnvelope({ attack })}
          onDecayChange={(decay) => updateEnvelope({ decay })}
          onSustainChange={(sustain) => updateEnvelope({ sustain })}
          onReleaseChange={(release) => updateEnvelope({ release })}
        />

        <MasterSection 
          gain={audioState.gain}
          delayTime={audioState.delay.time}
          delayFeedback={audioState.delay.feedback}
          onGainChange={updateGain}
          onDelayTimeChange={(time) => updateDelay({ time })}
          onDelayFeedbackChange={(feedback) => updateDelay({ feedback })}
        />
      </div>

      {/* Analyzer */}
      <div className="mb-2">
        <Analyzer audioContext={audioContextRef.current} />
      </div>

      {/* Keyboard */}
      <div className="synth-keyboard-container">
        <Keyboard 
          activeKeys={activeKeys}
          onNoteOn={playNote}
          onNoteOff={releaseNote}
        />
      </div>
    </div>
  )
}