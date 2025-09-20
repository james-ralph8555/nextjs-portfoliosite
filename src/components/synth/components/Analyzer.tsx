import React, { useRef, useEffect, useState } from 'react'

interface AnalyzerProps {
  audioContext: AudioContext | null
}

export function Analyzer({ audioContext }: AnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [mode, setMode] = useState<'waveform' | 'spectrum'>('waveform')
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (!audioContext) return

    // Create analyser node
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    analyserRef.current = analyser

    // Create data array
    const bufferLength = analyser.frequencyBinCount
    dataArrayRef.current = new Uint8Array(bufferLength)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioContext])

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#060606'
    ctx.fillRect(0, 0, width, height)

    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current

    if (mode === 'waveform') {
      // Get waveform data
      analyser.getByteTimeDomainData(dataArray)

      // Draw waveform
      ctx.lineWidth = 2
      ctx.strokeStyle = '#5AFD81'
      ctx.beginPath()

      const sliceWidth = width / dataArray.length
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0
        const y = v * height / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()

      // Add glow effect
      ctx.shadowColor = '#5AFD81'
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowBlur = 0

    } else {
      // Get frequency data
      analyser.getByteFrequencyData(dataArray)

      // Draw spectrum
      const barWidth = width / dataArray.length * 2.5
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
        gradient.addColorStop(0, '#5AFD81')
        gradient.addColorStop(0.5, '#E7F40F')
        gradient.addColorStop(1, '#F8343D')

        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    // Draw grid
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 0.5
    ctx.setLineDash([2, 2])

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Vertical lines
    for (let i = 0; i <= 8; i++) {
      const x = (width / 8) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    ctx.setLineDash([])

    animationRef.current = requestAnimationFrame(draw)
  }

  useEffect(() => {
    if (audioContext && analyserRef.current) {
      animationRef.current = requestAnimationFrame(draw)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioContext, mode])

  const connectAudioSource = (source: AudioNode) => {
    if (analyserRef.current) {
      source.connect(analyserRef.current)
    }
  }

  return (
    <div className="fused-terminal-layout">
      <div className="terminal-header">
        <span className="terminal-header-text" style={{ backgroundColor: '#5AFD81' }}>
          ANALYZER
        </span>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Mode Selector */}
        <div className="flex justify-center space-x-2">
          <button
            className={`boombox-button px-3 py-1 text-xs ${
              mode === 'waveform' 
                ? 'bg-primary-green text-black border-primary-green' 
                : 'text-table-text border-box-outline hover:border-primary-green'
            }`}
            onClick={() => setMode('waveform')}
          >
            WAVEFORM
          </button>
          <button
            className={`boombox-button px-3 py-1 text-xs ${
              mode === 'spectrum' 
                ? 'bg-primary-green text-black border-primary-green' 
                : 'text-table-text border-box-outline hover:border-primary-green'
            }`}
            onClick={() => setMode('spectrum')}
          >
            SPECTRUM
          </button>
        </div>

        {/* Canvas */}
        <div className="bg-box-bg border border-box-outline rounded p-2">
          <canvas
            ref={canvasRef}
            width="600"
            height="150"
            className="w-full h-[150px] max-w-full"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        {/* Info */}
        <div className="text-center">
          <div className="text-xs font-mono text-table-text">
            {mode === 'waveform' ? 'Oscilloscope - Time Domain' : 'Spectrum Analyzer - Frequency Domain'}
          </div>
          <div className="text-xs font-mono text-table-text opacity-60 mt-1">
            Real-time audio visualization
          </div>
        </div>
      </div>
    </div>
  )
}