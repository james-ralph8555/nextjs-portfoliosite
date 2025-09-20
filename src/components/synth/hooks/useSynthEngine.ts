import { useState, useRef, useEffect } from 'react'

export interface AudioState {
  oscillator: {
    waveform: OscillatorType
  }
  filter: {
    cutoff: number
    resonance: number
  }
  envelope: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
  gain: number
  delay: {
    time: number
    feedback: number
  }
}

export interface Voice {
  oscillator: OscillatorNode
  filter: BiquadFilterNode
  gainNode: GainNode
  envelopeGain: GainNode
  note: string
  frequency: number
  startTime: number
}

export function useSynthEngine(audioContext: AudioContext | null) {
  const [audioState, setAudioState] = useState<AudioState>({
    oscillator: { waveform: 'sawtooth' },
    filter: { cutoff: 1000, resonance: 1 },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5 },
    gain: 0.3,
    delay: { time: 0.3, feedback: 0.3 }
  })

  const [isPlaying, setIsPlaying] = useState(false)
  
  const voicesRef = useRef<Map<string, Voice>>(new Map())
  const masterGainRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const delayRef = useRef<DelayNode | null>(null)
  const delayFeedbackRef = useRef<GainNode | null>(null)
  const delayGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

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
    delayGainRef.current.gain.value = 0.3

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
        voice.oscillator.stop()
        voice.oscillator.disconnect()
        voice.filter.disconnect()
        voice.gainNode.disconnect()
        voice.envelopeGain.disconnect()
      })
      voicesRef.current.clear()

      // Clean up master nodes
      masterGainRef.current?.disconnect()
      filterRef.current?.disconnect()
      delayRef.current?.disconnect()
      delayFeedbackRef.current?.disconnect()
      delayGainRef.current?.disconnect()
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

  const playNote = (note: string) => {
    if (!audioContext || voicesRef.current.has(note)) return

    const frequency = noteToFrequency(note)
    const now = audioContext.currentTime

    // Create voice nodes
    const oscillator = audioContext.createOscillator()
    const filter = audioContext.createBiquadFilter()
    const gainNode = audioContext.createGain()
    const envelopeGain = audioContext.createGain()

    // Configure oscillator
    oscillator.type = audioState.oscillator.waveform
    oscillator.frequency.value = frequency

    // Configure filter for this voice
    filter.type = 'lowpass'
    filter.frequency.value = audioState.filter.cutoff
    filter.Q.value = audioState.filter.resonance

    // Configure envelope
    envelopeGain.gain.setValueAtTime(0, now)
    envelopeGain.gain.linearRampToValueAtTime(1, now + audioState.envelope.attack)
    envelopeGain.gain.linearRampToValueAtTime(audioState.envelope.sustain, now + audioState.envelope.attack + audioState.envelope.decay)

    // Connect voice signal chain
    oscillator.connect(filter)
    filter.connect(envelopeGain)
    envelopeGain.connect(gainNode)
    gainNode.connect(filterRef.current!)
    gainNode.connect(delayRef.current!)
    gainNode.connect(analyserRef.current!)

    // Start oscillator
    oscillator.start(now)

    // Store voice
    const voice: Voice = {
      oscillator,
      filter,
      gainNode,
      envelopeGain,
      note,
      frequency,
      startTime: now
    }
    voicesRef.current.set(note, voice)

    setIsPlaying(true)
  }

  const releaseNote = (note: string) => {
    if (!audioContext || !voicesRef.current.has(note)) return

    const voice = voicesRef.current.get(note)!
    const now = audioContext.currentTime

    // Apply release envelope
    const currentGain = voice.envelopeGain.gain.value
    voice.envelopeGain.gain.cancelScheduledValues(now)
    voice.envelopeGain.gain.setValueAtTime(currentGain, now)
    voice.envelopeGain.gain.linearRampToValueAtTime(0, now + audioState.envelope.release)

    // Stop oscillator after release
    voice.oscillator.stop(now + audioState.envelope.release)

    // Clean up voice
    setTimeout(() => {
      voice.oscillator.disconnect()
      voice.filter.disconnect()
      voice.gainNode.disconnect()
      voice.envelopeGain.disconnect()
      voicesRef.current.delete(note)

      if (voicesRef.current.size === 0) {
        setIsPlaying(false)
      }
    }, audioState.envelope.release * 1000)
  }

  const updateOscillator = (updates: Partial<AudioState['oscillator']>) => {
    setAudioState(prev => ({
      ...prev,
      oscillator: { ...prev.oscillator, ...updates }
    }))

    // Update active oscillators
    voicesRef.current.forEach(voice => {
      if (updates.waveform) {
        voice.oscillator.type = updates.waveform
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

  return {
    audioState,
    updateOscillator,
    updateFilter,
    updateEnvelope,
    updateGain,
    updateDelay,
    playNote,
    releaseNote,
    isPlaying,
    voices: voicesRef.current,
    analyser: analyserRef.current
  }
}