import { useState, useRef, useEffect } from 'react'

export interface AudioState {
  oscillator: {
    waveform: OscillatorType
    waveform2?: OscillatorType
    mix1: number
    mix2: number
    tune1?: number // semitones
    tune2?: number // semitones
    unison: {
      enabled: boolean
      voices: number
      detune: number
    }
    glide: {
      enabled: boolean
      time: number
      legato: boolean
    }
  }
  filter: {
    cutoff: number
    resonance: number
    envelopeAmount: number
  }
  envelope: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
  filterEnvelope: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
  lfo: {
    waveform: OscillatorType
    rate: number
    depth: number
    targets: {
      pitch: boolean
      cutoff: boolean
      pulseWidth: boolean
      amp: boolean
    }
  }
  gain: number
  delay: {
    time: number
    feedback: number
    mix: number
  }
  chorus: {
    rate: number
    depth: number
    mix: number
  }
  macros: {
    1: number
    2: number
    3: number
    4: number
  }
  performance: {
    maxPolyphony: number
    voiceStealing: boolean
  }
}

export interface Voice {
  id: string
  oscillators1: OscillatorNode[]
  oscillators2: OscillatorNode[]
  osc1GainNode: GainNode
  osc2GainNode: GainNode
  filter: BiquadFilterNode
  gainNode: GainNode
  envelopeGain: GainNode
  filterEnvelopeGain: GainNode
  note: string
  baseFrequency: number
  velocity: number
  startTime: number
  isReleased: boolean
}

export function useSynthEngine(audioContext: AudioContext | null) {
  const [audioState, setAudioState] = useState<AudioState>({
    oscillator: { 
      waveform: 'sawtooth',
      waveform2: 'square',
      mix1: 0.5,
      mix2: 0.5,
      tune1: 0,
      tune2: 0,
      unison: { enabled: true, voices: 3, detune: 0.1 },
      glide: { enabled: false, time: 0.1, legato: true }
    },
    filter: { cutoff: 4000, resonance: 1, envelopeAmount: 0.5 },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5 },
    filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5 },
    lfo: { 
      waveform: 'sine', 
      rate: 2, 
      depth: 0.5, 
      targets: { pitch: false, cutoff: true, pulseWidth: false, amp: false } 
    },
    gain: 0.3,
    delay: { time: 0.3, feedback: 0.3, mix: 0.3 },
    chorus: { rate: 1.5, depth: 0.5, mix: 0.3 },
    macros: { 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5 },
    performance: { maxPolyphony: 8, voiceStealing: true }
  })

  const [isPlaying, setIsPlaying] = useState(false)
  
  const voicesRef = useRef<Map<string, Voice>>(new Map())
  const masterGainRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const delayRef = useRef<DelayNode | null>(null)
  const delayFeedbackRef = useRef<GainNode | null>(null)
  const delayGainRef = useRef<GainNode | null>(null)
  const chorusRef = useRef<any>(null)
  const chorusGainRef = useRef<GainNode | null>(null)
  const lfoRef = useRef<OscillatorNode | null>(null)
  const lfoGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const lastNoteRef = useRef<{ note: string; frequency: number } | null>(null)

  // Initialize audio nodes
  useEffect(() => {
    if (!audioContext) return

    // Create master gain
    masterGainRef.current = audioContext.createGain()
    masterGainRef.current.gain.value = audioState.gain

    // Create main filter
    filterRef.current = audioContext.createBiquadFilter()
    filterRef.current.type = 'lowpass'
    filterRef.current.frequency.value = audioState.filter.cutoff
    filterRef.current.Q.value = audioState.filter.resonance

    // Create delay effect
    delayRef.current = audioContext.createDelay(1.0)
    delayRef.current.delayTime.value = audioState.delay.time
    
    delayFeedbackRef.current = audioContext.createGain()
    delayFeedbackRef.current.gain.value = audioState.delay.feedback
    
    delayGainRef.current = audioContext.createGain()
    delayGainRef.current.gain.value = audioState.delay.mix

    // Create chorus effect
    chorusGainRef.current = audioContext.createGain()
    chorusGainRef.current.gain.value = audioState.chorus.mix

    // Create LFO
    lfoRef.current = audioContext.createOscillator()
    lfoRef.current.type = audioState.lfo.waveform
    lfoRef.current.frequency.value = audioState.lfo.rate
    lfoRef.current.start()
    
    lfoGainRef.current = audioContext.createGain()
    lfoGainRef.current.gain.value = audioState.lfo.depth

    // Create analyser
    analyserRef.current = audioContext.createAnalyser()
    analyserRef.current.fftSize = 2048

    // Connect delay feedback loop
    delayRef.current.connect(delayFeedbackRef.current)
    delayFeedbackRef.current.connect(delayRef.current)

    // Connect main signal chain
    filterRef.current.connect(masterGainRef.current)
    masterGainRef.current.connect(audioContext.destination)
    
    // Connect delay to output
    delayRef.current.connect(delayGainRef.current)
    delayGainRef.current.connect(audioContext.destination)

    return () => {
      // Clean up all voices
      voicesRef.current.forEach(voice => {
        voice.oscillators1.forEach(osc => {
          try { osc.stop() } catch {}
          try { osc.disconnect() } catch {}
        })
        voice.oscillators2.forEach(osc => {
          try { osc.stop() } catch {}
          try { osc.disconnect() } catch {}
        })
        voice.filter.disconnect()
        voice.gainNode.disconnect()
        voice.envelopeGain.disconnect()
        voice.filterEnvelopeGain.disconnect()
        voice.osc1GainNode.disconnect()
        voice.osc2GainNode.disconnect()
      })
      voicesRef.current.clear()

      // Clean up master nodes
      masterGainRef.current?.disconnect()
      filterRef.current?.disconnect()
      delayRef.current?.disconnect()
      delayFeedbackRef.current?.disconnect()
      delayGainRef.current?.disconnect()
      chorusRef.current?.disconnect()
      chorusGainRef.current?.disconnect()
      lfoRef.current?.disconnect()
      lfoGainRef.current?.disconnect()
      analyserRef.current?.disconnect()
    }
  }, [audioContext])

  // Update audio parameters when state changes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = audioState.gain
    }
  }, [audioState.gain])

  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = audioState.filter.cutoff
      filterRef.current.Q.value = audioState.filter.resonance
    }
  }, [audioState.filter.cutoff, audioState.filter.resonance])

  useEffect(() => {
    if (delayRef.current && delayFeedbackRef.current) {
      delayRef.current.delayTime.value = audioState.delay.time
      delayFeedbackRef.current.gain.value = audioState.delay.feedback
    }
  }, [audioState.delay.time, audioState.delay.feedback])

  useEffect(() => {
    if (delayGainRef.current) {
      delayGainRef.current.gain.value = audioState.delay.mix
    }
  }, [audioState.delay.mix])

  useEffect(() => {
    if (chorusGainRef.current) {
      chorusGainRef.current.gain.value = audioState.chorus.mix
    }
  }, [audioState.chorus.mix])

  useEffect(() => {
    if (lfoRef.current && lfoGainRef.current) {
      lfoRef.current.type = audioState.lfo.waveform
      lfoRef.current.frequency.value = audioState.lfo.rate
      lfoGainRef.current.gain.value = audioState.lfo.depth
    }
  }, [audioState.lfo.waveform, audioState.lfo.rate, audioState.lfo.depth])

  const noteToFrequency = (note: string): number => {
    const noteFrequencies: Record<string, number> = {
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
      'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
      'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
    }
    return noteFrequencies[note] || 440
  }

  const getVoiceToSteal = (): string | null => {
    if (!audioState.performance.voiceStealing) return null
    
    const activeVoices = Array.from(voicesRef.current.entries())
    if (activeVoices.length < audioState.performance.maxPolyphony) return null
    
    // Find voice with lowest velocity or oldest note
    let voiceToSteal = activeVoices[0]
    for (const [note, voice] of activeVoices) {
      if (voice.velocity < voiceToSteal[1].velocity) {
        voiceToSteal = [note, voice]
      }
    }
    
    return voiceToSteal[0]
  }

  const createUnisonOscillatorsForWaveform = (
    ac: AudioContext,
    baseFrequency: number,
    detune: number,
    waveform: OscillatorType,
    baseTuneCents: number
  ): OscillatorNode[] => {
    const oscillators: OscillatorNode[] = []
    const unisonVoices = audioState.oscillator.unison.enabled ? audioState.oscillator.unison.voices : 1

    for (let i = 0; i < unisonVoices; i++) {
      const osc = ac.createOscillator()
      osc.type = waveform

      if (unisonVoices > 1) {
        const detuneAmount = (i - (unisonVoices - 1) / 2) * detune * 100 // cents
        osc.detune.value = detuneAmount + baseTuneCents
      } else {
        osc.detune.value = baseTuneCents
      }

      osc.frequency.value = baseFrequency
      oscillators.push(osc)
    }

    return oscillators
  }

  const playNote = (note: string, velocity: number = 0.8) => {
    if (!audioContext) return

    const baseFrequency = noteToFrequency(note)
    const now = audioContext.currentTime

    // Handle glide/portamento
    let targetFrequency = baseFrequency
    if (audioState.oscillator.glide.enabled && lastNoteRef.current) {
      if (audioState.oscillator.glide.legato && voicesRef.current.size > 0) {
        targetFrequency = lastNoteRef.current.frequency
      }
    }

    // Check for voice stealing
    const voiceToSteal = getVoiceToSteal()
    if (voiceToSteal) {
      releaseNote(voiceToSteal)
    }

    // Create voice ID
    const voiceId = `${note}-${Date.now()}-${Math.random()}`

    // Create voice nodes
    const oscillators1 = createUnisonOscillatorsForWaveform(
      audioContext,
      targetFrequency,
      audioState.oscillator.unison.detune,
      audioState.oscillator.waveform,
      (audioState.oscillator.tune1 || 0) * 100
    )
    const oscillators2 = createUnisonOscillatorsForWaveform(
      audioContext,
      targetFrequency,
      audioState.oscillator.unison.detune,
      audioState.oscillator.waveform2 || audioState.oscillator.waveform,
      (audioState.oscillator.tune2 || 0) * 100
    )
    const filter = audioContext.createBiquadFilter()
    const gainNode = audioContext.createGain()
    const envelopeGain = audioContext.createGain()
    const filterEnvelopeGain = audioContext.createGain()

    // Configure filter for this voice
    filter.type = 'lowpass'
    filter.frequency.value = audioState.filter.cutoff
    filter.Q.value = audioState.filter.resonance

    // Configure amp envelope
    envelopeGain.gain.setValueAtTime(0, now)
    envelopeGain.gain.linearRampToValueAtTime(velocity, now + audioState.envelope.attack * velocity)
    envelopeGain.gain.linearRampToValueAtTime(audioState.envelope.sustain * velocity, now + audioState.envelope.attack * velocity + audioState.envelope.decay)

    // Configure filter envelope
    filterEnvelopeGain.gain.setValueAtTime(0, now)
    filterEnvelopeGain.gain.linearRampToValueAtTime(1, now + audioState.filterEnvelope.attack)
    filterEnvelopeGain.gain.linearRampToValueAtTime(audioState.filterEnvelope.sustain, now + audioState.filterEnvelope.attack + audioState.filterEnvelope.decay)

    // Group mixers to normalize unison within each oscillator group
    const groupMixer1 = audioContext.createGain()
    const groupMixer2 = audioContext.createGain()
    const unisonVoices = audioState.oscillator.unison.enabled ? audioState.oscillator.unison.voices : 1
    groupMixer1.gain.value = 1 / unisonVoices
    groupMixer2.gain.value = 1 / unisonVoices

    oscillators1.forEach(osc => {
      osc.connect(groupMixer1)
      osc.start(now)
    })
    oscillators2.forEach(osc => {
      osc.connect(groupMixer2)
      osc.start(now)
    })

    // Crossfade between osc1 and osc2 using mix
    const osc1GainNode = audioContext.createGain()
    const osc2GainNode = audioContext.createGain()
    const mix1 = Math.max(0, Math.min(1, audioState.oscillator.mix1))
    const mix2 = Math.max(0, Math.min(1, audioState.oscillator.mix2))
    osc1GainNode.gain.value = mix1
    osc2GainNode.gain.value = mix2

    groupMixer1.connect(osc1GainNode)
    groupMixer2.connect(osc2GainNode)

    // Sum into filter
    osc1GainNode.connect(filter)
    osc2GainNode.connect(filter)

    // Continue chain
    filter.connect(envelopeGain)
    envelopeGain.connect(gainNode)
    
    // Apply filter envelope modulation
    filterEnvelopeGain.connect(filter.frequency)
    
    // Connect to main signal chain
    gainNode.connect(filterRef.current!)
    gainNode.connect(delayRef.current!)
    gainNode.connect(analyserRef.current!)

    // Handle glide if enabled
    if (audioState.oscillator.glide.enabled && lastNoteRef.current && targetFrequency !== baseFrequency) {
      const allOscs = [...oscillators1, ...oscillators2]
      allOscs.forEach(osc => {
        osc.frequency.cancelScheduledValues(now)
        osc.frequency.setValueAtTime(targetFrequency, now)
        osc.frequency.exponentialRampToValueAtTime(baseFrequency, now + audioState.oscillator.glide.time)
      })
    }

    // Store voice
    const voice: Voice = {
      id: voiceId,
      oscillators1,
      oscillators2,
      osc1GainNode,
      osc2GainNode,
      filter,
      gainNode,
      envelopeGain,
      filterEnvelopeGain,
      note,
      baseFrequency,
      velocity,
      startTime: now,
      isReleased: false
    }
    voicesRef.current.set(voiceId, voice)
    lastNoteRef.current = { note, frequency: baseFrequency }

    setIsPlaying(true)
  }

  const releaseNote = (note: string) => {
    if (!audioContext) return

    // Find voice(s) for this note
    const voicesToRemove: string[] = []
    voicesRef.current.forEach((voice, voiceId) => {
      if (voice.note === note && !voice.isReleased) {
        voicesToRemove.push(voiceId)
      }
    })

    if (voicesToRemove.length === 0) return

    const now = audioContext.currentTime

    voicesToRemove.forEach(voiceId => {
      const voice = voicesRef.current.get(voiceId)!
      if (!voice) return

      voice.isReleased = true

      // Apply release envelope
      const currentGain = voice.envelopeGain.gain.value
      voice.envelopeGain.gain.cancelScheduledValues(now)
      voice.envelopeGain.gain.setValueAtTime(currentGain, now)
      voice.envelopeGain.gain.linearRampToValueAtTime(0, now + audioState.envelope.release)

      // Apply filter envelope release
      const currentFilterGain = voice.filterEnvelopeGain.gain.value
      voice.filterEnvelopeGain.gain.cancelScheduledValues(now)
      voice.filterEnvelopeGain.gain.setValueAtTime(currentFilterGain, now)
      voice.filterEnvelopeGain.gain.linearRampToValueAtTime(0, now + audioState.filterEnvelope.release)

      // Stop oscillators after release
      const allOscs = [...voice.oscillators1, ...voice.oscillators2]
      allOscs.forEach(osc => {
        osc.stop(now + Math.max(audioState.envelope.release, audioState.filterEnvelope.release))
      })

      // Clean up voice
      setTimeout(() => {
        voice.oscillators1.forEach(osc => osc.disconnect())
        voice.oscillators2.forEach(osc => osc.disconnect())
        voice.filter.disconnect()
        voice.gainNode.disconnect()
        voice.envelopeGain.disconnect()
        voice.filterEnvelopeGain.disconnect()
        voice.osc1GainNode.disconnect()
        voice.osc2GainNode.disconnect()
        voicesRef.current.delete(voiceId)

        if (voicesRef.current.size === 0) {
          setIsPlaying(false)
        }
      }, Math.max(audioState.envelope.release, audioState.filterEnvelope.release) * 1000)
    })
  }

  const updateOscillator = (updates: Partial<AudioState['oscillator']>) => {
    const prev = audioState
    const next = { ...prev.oscillator, ...updates }
    const tune1DeltaCents = (typeof updates.tune1 === 'number' ? (updates.tune1 - (prev.oscillator.tune1 || 0)) * 100 : 0)
    const tune2DeltaCents = (typeof updates.tune2 === 'number' ? (updates.tune2 - (prev.oscillator.tune2 || 0)) * 100 : 0)

    setAudioState({
      ...prev,
      oscillator: next
    })

    // Update active oscillators
    voicesRef.current.forEach(voice => {
      if (updates.waveform) {
        voice.oscillators1.forEach(osc => {
          osc.type = updates.waveform as OscillatorType
        })
      }
      if (updates.waveform2) {
        voice.oscillators2.forEach(osc => {
          osc.type = updates.waveform2 as OscillatorType
        })
      }
      if (typeof (updates as any).mix1 === 'number') {
        const mix1 = Math.max(0, Math.min(1, (updates as any).mix1))
        voice.osc1GainNode.gain.value = mix1
      }
      if (typeof (updates as any).mix2 === 'number') {
        const mix2 = Math.max(0, Math.min(1, (updates as any).mix2))
        voice.osc2GainNode.gain.value = mix2
      }
      if (tune1DeltaCents !== 0) {
        const now = audioContext?.currentTime ?? 0
        voice.oscillators1.forEach(osc => {
          osc.detune.setValueAtTime(osc.detune.value + tune1DeltaCents, now)
        })
      }
      if (tune2DeltaCents !== 0) {
        const now = audioContext?.currentTime ?? 0
        voice.oscillators2.forEach(osc => {
          osc.detune.setValueAtTime(osc.detune.value + tune2DeltaCents, now)
        })
      }
    })
  }

  const updateFilter = (updates: Partial<AudioState['filter']>) => {
    setAudioState(prev => ({
      ...prev,
      filter: { ...prev.filter, ...updates }
    }))
  }

  const updateEnvelope = (updates: Partial<AudioState['envelope']>) => {
    setAudioState(prev => ({
      ...prev,
      envelope: { ...prev.envelope, ...updates }
    }))
  }

  const updateGain = (gain: number) => {
    setAudioState(prev => ({ ...prev, gain }))
  }

  const updateDelay = (updates: Partial<AudioState['delay']>) => {
    setAudioState(prev => ({
      ...prev,
      delay: { ...prev.delay, ...updates }
    }))
  }

  const updateFilterEnvelope = (updates: Partial<AudioState['filterEnvelope']>) => {
    setAudioState(prev => ({
      ...prev,
      filterEnvelope: { ...prev.filterEnvelope, ...updates }
    }))
  }

  const updateLFO = (updates: Partial<AudioState['lfo']>) => {
    setAudioState(prev => ({
      ...prev,
      lfo: { ...prev.lfo, ...updates }
    }))
  }

  const updateChorus = (updates: Partial<AudioState['chorus']>) => {
    setAudioState(prev => ({
      ...prev,
      chorus: { ...prev.chorus, ...updates }
    }))
  }

  const updateMacros = (updates: Partial<AudioState['macros']>) => {
    setAudioState(prev => ({
      ...prev,
      macros: { ...prev.macros, ...updates }
    }))
  }

  const updatePerformance = (updates: Partial<AudioState['performance']>) => {
    setAudioState(prev => ({
      ...prev,
      performance: { ...prev.performance, ...updates }
    }))
  }

  const panic = () => {
    // Stop all notes immediately
    voicesRef.current.forEach((voice, voiceId) => {
      const allOscs = [...voice.oscillators1, ...voice.oscillators2]
      allOscs.forEach(osc => {
        osc.stop()
        osc.disconnect()
      })
      voice.filter.disconnect()
      voice.gainNode.disconnect()
      voice.envelopeGain.disconnect()
      voice.filterEnvelopeGain.disconnect()
      voice.osc1GainNode.disconnect()
      voice.osc2GainNode.disconnect()
    })
    voicesRef.current.clear()
    setIsPlaying(false)
    lastNoteRef.current = null
  }

  const getFactoryPresets = () => [
    {
      name: "Init Patch",
      state: {
        oscillator: { 
          waveform: 'sawtooth' as OscillatorType,
          waveform2: 'square' as OscillatorType,
          mix1: 0.5,
          mix2: 0.5,
          tune1: 0,
          tune2: 0,
          unison: { enabled: true, voices: 3, detune: 0.1 },
          glide: { enabled: false, time: 0.1, legato: true }
        },
        filter: { cutoff: 4000, resonance: 1, envelopeAmount: 0.5 },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5 },
        filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5 },
        lfo: { 
          waveform: 'sine' as OscillatorType, 
          rate: 2, 
          depth: 0.5, 
          targets: { pitch: false, cutoff: true, pulseWidth: false, amp: false } 
        },
        gain: 0.3,
        delay: { time: 0.3, feedback: 0.3, mix: 0.3 },
        chorus: { rate: 1.5, depth: 0.5, mix: 0.3 },
        macros: { 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5 },
        performance: { maxPolyphony: 8, voiceStealing: true }
      }
    },
    {
      name: "Fat Lead",
      state: {
        oscillator: { 
          waveform: 'sawtooth' as OscillatorType,
          waveform2: 'square' as OscillatorType,
          mix1: 0.4,
          mix2: 0.6,
          tune1: 0,
          tune2: 0,
          unison: { enabled: true, voices: 4, detune: 0.2 },
          glide: { enabled: false, time: 0.1, legato: true }
        },
        filter: { cutoff: 800, resonance: 1.5, envelopeAmount: 0.7 },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
        filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.2 },
        lfo: { 
          waveform: 'sine' as OscillatorType, 
          rate: 4, 
          depth: 0.3, 
          targets: { pitch: false, cutoff: true, pulseWidth: false, amp: false } 
        },
        gain: 0.4,
        delay: { time: 0.25, feedback: 0.4, mix: 0.2 },
        chorus: { rate: 2, depth: 0.6, mix: 0.4 },
        macros: { 1: 0.7, 2: 0.3, 3: 0.8, 4: 0.2 },
        performance: { maxPolyphony: 6, voiceStealing: true }
      }
    }
    // Add more presets as needed
  ]

  return {
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
    voices: voicesRef.current,
    analyser: analyserRef.current,
    getFactoryPresets
  }
}
