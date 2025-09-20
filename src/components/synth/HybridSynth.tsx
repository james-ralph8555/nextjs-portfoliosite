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
    <div className="fused-terminal-layout space-y-4">
      {/* Header */}
      <div className="fused-panel-top">
        <div className="terminal-header">
          <span className="terminal-header-text">SYNTH ENGINE</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <LED active={isInitialized} color="green" label="POWER" />
            <LED active={isPlaying} color="amber" label="ACTIVE" />
            <LED active={Object.keys(activeKeys).length > 0} color="cyan" label="KEYS" />
          </div>
          
          {!isInitialized && (
            <button
              onClick={handleInitClick}
              className="boombox-button px-4 py-2 text-primary-green border border-primary-green hover:bg-primary-green hover:text-black transition-colors"
            >
              INIT AUDIO
            </button>
          )}
        </div>
      </div>

      {/* Control Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
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
      </div>

      {/* Master Section */}
      <div className="p-4">
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
      <div className="p-4">
        <Analyzer audioContext={audioContextRef.current} />
      </div>

      {/* Keyboard */}
      <div className="fused-panel-bottom">
        <div className="terminal-header">
          <span className="terminal-header-text">KEYBOARD</span>
        </div>
        <div className="p-4">
          <Keyboard 
            activeKeys={activeKeys}
            onNoteOn={playNote}
            onNoteOff={releaseNote}
          />
        </div>
      </div>
    </div>
  )
}