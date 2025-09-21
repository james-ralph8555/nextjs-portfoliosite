'use client'

import React, { useState, useEffect, useRef } from 'react'
import { OscillatorSection } from './components/OscillatorSection'
import { FilterSection } from './components/FilterSection'
import { EnvelopeSection } from './components/EnvelopeSection'
import { MasterSection } from './components/MasterSection'
import { LFOSection } from './components/LFOSection'
import { ChorusSection } from './components/ChorusSection'
import { Scopes } from './components/Scopes'
import { MacroSection } from './components/MacroSection'
import { UnisonGlideSection } from './components/UnisonGlideSection'
import { ScopesMasterSection } from './components/ScopesMasterSection'
import { Keyboard } from './components/Keyboard'
import { Analyzer } from './components/Analyzer'
import { LED } from './components/LED'
import { PowerButton } from './components/PowerButton'
import { PanicButton } from './components/PanicButton'
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
    updateFilterEnvelope,
    updateGain,
    updateDelay,
    updateLFO,
    updateChorus,
    updateMacros,
    updatePerformance,
    playNote,
    releaseNote,
    panic,
    isPlaying,
    analyser
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

  const handlePanicClick = () => {
    panic()
  }

  return (
    <div className="synth-chassis synth--noise max-w-7xl mx-auto flex flex-col">
      {/* Status Bar */}
      <div className="synth-status-bar">
        <div className="flex items-center space-x-3">
          <LED active={isInitialized} color="green" size="sm" />
          <LED active={isPlaying} color="amber" size="sm" />
          <LED active={Object.keys(activeKeys).length > 0} color="cyan" size="sm" />
          </div>
        
        <div className="flex items-center space-x-4">
          <PowerButton 
            isOn={isInitialized}
            onToggle={handleInitClick}
          />
          <PanicButton 
            onPanic={handlePanicClick}
          />
        </div>
      </div>

      {/* Keyboard */}
      <div className="synth-keyboard-container">
        <Keyboard 
          activeKeys={activeKeys}
          onNoteOn={playNote}
          onNoteOff={releaseNote}
        />
      </div>

      {/* Main 4x2 Grid Layout */}
      <div className="synth-grid-desktop">
        {/* Top Row: Sound Design */}
        <div className="synth-grid-osc">
          <OscillatorSection 
            waveform={audioState.oscillator.waveform}
            mix={audioState.oscillator.mix}
            unison={audioState.oscillator.unison}
            glide={audioState.oscillator.glide}
            onWaveformChange={(waveform) => updateOscillator({ waveform })}
            onMixChange={(mix) => updateOscillator({ mix })}
            onUnisonChange={(unison) => updateOscillator({ unison: { ...audioState.oscillator.unison, ...unison } })}
            onGlideChange={(glide) => updateOscillator({ glide: { ...audioState.oscillator.glide, ...glide } })}
          />
        </div>

        <div className="synth-grid-unison-glide">
          <UnisonGlideSection
            unison={audioState.oscillator.unison}
            glide={audioState.oscillator.glide}
            onUnisonChange={(unison) => updateOscillator({ unison: { ...audioState.oscillator.unison, ...unison } })}
            onGlideChange={(glide) => updateOscillator({ glide: { ...audioState.oscillator.glide, ...glide } })}
          />
        </div>

        <div className="synth-grid-filter">
          <FilterSection 
            cutoff={audioState.filter.cutoff}
            resonance={audioState.filter.resonance}
            envelopeAmount={audioState.filter.envelopeAmount}
            onCutoffChange={(cutoff) => updateFilter({ cutoff })}
            onResonanceChange={(resonance) => updateFilter({ resonance })}
            onEnvelopeAmountChange={(envelopeAmount) => updateFilter({ envelopeAmount })}
          />
        </div>

        <div className="synth-grid-env">
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

        {/* Bottom Row: Modulation & Effects */}
        <div className="synth-grid-lfo">
          <LFOSection
            waveform={audioState.lfo.waveform}
            rate={audioState.lfo.rate}
            depth={audioState.lfo.depth}
            targets={audioState.lfo.targets}
            onWaveformChange={(waveform) => updateLFO({ waveform })}
            onRateChange={(rate) => updateLFO({ rate })}
            onDepthChange={(depth) => updateLFO({ depth })}
            onTargetChange={(target, enabled) => updateLFO({ 
              targets: { ...audioState.lfo.targets, [target]: enabled } 
            })}
          />
        </div>

        <div className="synth-grid-fx">
          <ChorusSection
            rate={audioState.chorus.rate}
            depth={audioState.chorus.depth}
            mix={audioState.chorus.mix}
            onRateChange={(rate) => updateChorus({ rate })}
            onDepthChange={(depth) => updateChorus({ depth })}
            onMixChange={(mix) => updateChorus({ mix })}
          />
        </div>

        <div className="synth-grid-scopes-master">
          <ScopesMasterSection 
            audioContext={audioContextRef.current}
            analyser={analyser}
            gain={audioState.gain}
            delayTime={audioState.delay.time}
            delayFeedback={audioState.delay.feedback}
            delayMix={audioState.delay.mix}
            onGainChange={updateGain}
            onDelayTimeChange={(time) => updateDelay({ time })}
            onDelayFeedbackChange={(feedback) => updateDelay({ feedback })}
            onDelayMixChange={(mix) => updateDelay({ mix })}
          />
        </div>

        <div className="synth-grid-macro">
          <MacroSection
            macros={audioState.macros}
            onMacroChange={(macro, value) => updateMacros({ [macro]: value })}
          />
        </div>
      </div>

      {/* Legacy Analyzer (hidden for now, can be removed) */}
      <div className="hidden">
        <Analyzer audioContext={audioContextRef.current} />
      </div>
    </div>
  )
}
