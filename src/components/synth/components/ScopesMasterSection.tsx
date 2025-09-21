'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Knob } from './Knob'
import { LED } from './LED'
import { formatLevel } from '@/lib/synth-utils'

interface ScopesMasterSectionProps {
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  gain: number
  delayTime: number
  delayFeedback: number
  delayMix: number
  onGainChange: (gain: number) => void
  onDelayTimeChange: (time: number) => void
  onDelayFeedbackChange: (feedback: number) => void
  onDelayMixChange: (mix: number) => void
}

export function ScopesMasterSection({
  audioContext,
  analyser,
  gain,
  delayTime,
  delayFeedback,
  delayMix,
  onGainChange,
  onDelayTimeChange,
  onDelayFeedbackChange,
  onDelayMixChange
}: ScopesMasterSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const waveCanvasRef = useRef<HTMLCanvasElement>(null)
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null)
  const waveAnimationRef = useRef<number>()
  const spectrumAnimationRef = useRef<number>()
  
  // Throttle rendering for performance
  const lastWaveRenderRef = useRef<number>(0)
  const lastSpectrumRenderRef = useRef<number>(0)
  const FPS = 30
  const FRAME_TIME = 1000 / FPS

  useEffect(() => {
    if (!analyser || !waveCanvasRef.current || !spectrumCanvasRef.current) return

    const waveCanvas = waveCanvasRef.current
    const spectrumCanvas = spectrumCanvasRef.current
    const waveCtx = waveCanvas.getContext('2d')
    const spectrumCtx = spectrumCanvas.getContext('2d')
    if (!waveCtx || !spectrumCtx) return

    const bufferLength = analyser.frequencyBinCount
    const waveDataArray = new Uint8Array(bufferLength)
    const spectrumDataArray = new Uint8Array(bufferLength)

    const drawWave = (timestamp: number) => {
      // Throttle rendering
      if (timestamp - lastWaveRenderRef.current < FRAME_TIME) {
        waveAnimationRef.current = requestAnimationFrame(drawWave)
        return
      }
      lastWaveRenderRef.current = timestamp

      analyser.getByteTimeDomainData(waveDataArray)

      waveCtx.fillStyle = '#000000'
      waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height)

      // Draw waveform
      waveCtx.lineWidth = 1
      waveCtx.strokeStyle = '#22d3ee'
      waveCtx.beginPath()

      const sliceWidth = waveCanvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = waveDataArray[i] / 128.0
        const y = v * waveCanvas.height / 2

        if (i === 0) {
          waveCtx.moveTo(x, y)
        } else {
          waveCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      waveCtx.lineTo(waveCanvas.width, waveCanvas.height / 2)
      waveCtx.stroke()

      waveAnimationRef.current = requestAnimationFrame(drawWave)
    }

    const drawSpectrum = (timestamp: number) => {
      // Throttle rendering
      if (timestamp - lastSpectrumRenderRef.current < FRAME_TIME) {
        spectrumAnimationRef.current = requestAnimationFrame(drawSpectrum)
        return
      }
      lastSpectrumRenderRef.current = timestamp

      analyser.getByteFrequencyData(spectrumDataArray)

      spectrumCtx.fillStyle = '#000000'
      spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height)
      
      const barWidth = (spectrumCanvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (spectrumDataArray[i] / 255) * spectrumCanvas.height

        const hue = (i / bufferLength) * 240 // Blue to cyan gradient
        spectrumCtx.fillStyle = `hsl(${180 + hue * 0.3}, 70%, 50%)`
        spectrumCtx.fillRect(x, spectrumCanvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }

      spectrumAnimationRef.current = requestAnimationFrame(drawSpectrum)
    }

    waveAnimationRef.current = requestAnimationFrame(drawWave)
    spectrumAnimationRef.current = requestAnimationFrame(drawSpectrum)

    return () => {
      if (waveAnimationRef.current) {
        cancelAnimationFrame(waveAnimationRef.current)
      }
      if (spectrumAnimationRef.current) {
        cancelAnimationFrame(spectrumAnimationRef.current)
      }
    }
  }, [analyser])

  const handleCanvasClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="synth-section">
        <div className="synth-section-title">SCOPES/MASTER</div>
        
        {/* Scopes Section */}
        <div className="mb-3">
          {/* Dual Scopes */}
          <div className="grid grid-cols-2 gap-2">
            {/* Waveform Scope */}
            <div className="relative">
              <canvas
                ref={waveCanvasRef}
                width={120}
                height={80}
                className="w-full h-16 bg-black border border-gray-700 rounded cursor-pointer hover:border-cyan-500 transition-colors"
                onClick={handleCanvasClick}
              />
              <div className="absolute top-1 right-1">
                <LED active={true} color="cyan" size="xxs" />
              </div>
              <div className="absolute bottom-1 left-1 text-[8px] font-mono text-gray-500">
                TIME
              </div>
            </div>
            
            {/* Spectrum Scope */}
            <div className="relative">
              <canvas
                ref={spectrumCanvasRef}
                width={120}
                height={80}
                className="w-full h-16 bg-black border border-gray-700 rounded cursor-pointer hover:border-cyan-500 transition-colors"
                onClick={handleCanvasClick}
              />
              <div className="absolute top-1 right-1">
                <LED active={true} color="cyan" size="xxs" />
              </div>
              <div className="absolute bottom-1 left-1 text-[8px] font-mono text-gray-500">
                FREQ
              </div>
            </div>
          </div>
        </div>

        {/* Master Section */}
        <div className="border-t border-gray-600 pt-3">
          {/* Master Controls Grid */}
          <div className="grid grid-cols-4 gap-1 mb-2">
            {/* Volume Control */}
            <div className="synth-knob-compact">
              <Knob
                value={gain}
                min={0}
                max={1}
                step={0.01}
                label="VOL"
                color="green"
                onChange={onGainChange}
                size="xs"
              />
            </div>
            
            {/* Delay Time */}
            <div className="synth-knob-compact">
              <Knob
                value={delayTime}
                min={0}
                max={1}
                step={0.01}
                label="TIME"
                unit="s"
                color="amber"
                onChange={onDelayTimeChange}
                size="xs"
              />
            </div>
            
            {/* Delay Feedback */}
            <div className="synth-knob-compact">
              <Knob
                value={delayFeedback}
                min={0}
                max={0.95}
                step={0.01}
                label="FB"
                color="red"
                onChange={onDelayFeedbackChange}
                size="xs"
              />
            </div>

            {/* Delay Mix */}
            <div className="synth-knob-compact">
              <Knob
                value={delayMix}
                min={0}
                max={1}
                step={0.01}
                label="MIX"
                color="purple"
                onChange={onDelayMixChange}
                size="xs"
              />
            </div>
          </div>

          {/* Compact Level Meters */}
          <div className="grid grid-cols-2 gap-1">
            {/* Input Level */}
            <div className="bg-black border border-gray-700 rounded p-1">
              <div className="text-[8px] font-mono text-gray-500 mb-1">IN</div>
              <div className="h-4 bg-gray-900 rounded relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-100"
                  style={{ width: formatLevel(Math.min(100, gain * 120)) }}
                />
              </div>
            </div>
            
            {/* Delay Level */}
            <div className="bg-black border border-gray-700 rounded p-1">
              <div className="text-[8px] font-mono text-gray-500 mb-1">DLY</div>
              <div className="h-4 bg-gray-900 rounded relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-600 to-red-500 transition-all duration-100"
                  style={{ width: delayTime > 0 ? formatLevel(Math.min(100, delayFeedback * 120)) : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full scope view */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-cyan-400">
                Dual Analyzer
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="synth-button-small"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-mono text-gray-400 mb-2">Waveform</div>
                <canvas
                  ref={waveCanvasRef}
                  width={400}
                  height={300}
                  className="w-full bg-black border border-gray-700 rounded"
                />
              </div>
              <div>
                <div className="text-sm font-mono text-gray-400 mb-2">Spectrum</div>
                <canvas
                  ref={spectrumCanvasRef}
                  width={400}
                  height={300}
                  className="w-full bg-black border border-gray-700 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}