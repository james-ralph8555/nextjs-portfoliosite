'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Knob } from './Knob'
import { LED } from './LED'

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

type ScopeType = 'wave' | 'spectrum'

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
  const [activeTab, setActiveTab] = useState<ScopeType>('wave')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  
  // Throttle rendering for performance
  const lastRenderRef = useRef<number>(0)
  const FPS = 30
  const FRAME_TIME = 1000 / FPS

  useEffect(() => {
    if (!analyser || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = (timestamp: number) => {
      // Throttle rendering
      if (timestamp - lastRenderRef.current < FRAME_TIME) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }
      lastRenderRef.current = timestamp

      analyser.getByteTimeDomainData(dataArray)

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (activeTab === 'wave') {
        // Draw waveform
        ctx.lineWidth = 1
        ctx.strokeStyle = '#22d3ee'
        ctx.beginPath()

        const sliceWidth = canvas.width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = v * canvas.height / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()
      } else {
        // Draw spectrum
        analyser.getByteFrequencyData(dataArray)
        
        const barWidth = (canvas.width / bufferLength) * 2.5
        let barHeight
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height

          const hue = (i / bufferLength) * 240 // Blue to cyan gradient
          ctx.fillStyle = `hsl(${180 + hue * 0.3}, 70%, 50%)`
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    animationRef.current = requestAnimationFrame(draw)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, activeTab])

  const handleCanvasClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="synth-section">
        <div className="synth-section-title">SCOPES/MASTER</div>
        
        {/* Scopes Section */}
        <div className="mb-3">
          {/* Tabs */}
          <div className="flex gap-1 mb-2">
            <button
              className={`flex-1 synth-button-small text-[9px] ${
                activeTab === 'wave' ? 'bg-cyan-600 text-white border-cyan-500' : ''
              }`}
              onClick={() => setActiveTab('wave')}
            >
              Wave
            </button>
            <button
              className={`flex-1 synth-button-small text-[9px] ${
                activeTab === 'spectrum' ? 'bg-cyan-600 text-white border-cyan-500' : ''
              }`}
              onClick={() => setActiveTab('spectrum')}
            >
              Spec
            </button>
          </div>

          {/* Mini Scope */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={200}
              height={80}
              className="w-full h-16 bg-black border border-gray-700 rounded cursor-pointer hover:border-cyan-500 transition-colors"
              onClick={handleCanvasClick}
            />
            <div className="absolute top-1 right-1">
              <LED active={true} color="cyan" size="xxs" />
            </div>
            <div className="absolute bottom-1 left-1 text-[8px] font-mono text-gray-500">
              {activeTab === 'wave' ? 'TIME' : 'FREQ'}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 mt-2 text-[8px] font-mono">
            <div className="bg-gray-900 rounded px-2 py-1">
              <div className="text-gray-500">PEAK</div>
              <div className="text-cyan-400">-12dB</div>
            </div>
            <div className="bg-gray-900 rounded px-2 py-1">
              <div className="text-gray-500">RMS</div>
              <div className="text-cyan-400">-18dB</div>
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
                  style={{ width: `${Math.min(100, gain * 120)}%` }}
                />
              </div>
            </div>
            
            {/* Delay Level */}
            <div className="bg-black border border-gray-700 rounded p-1">
              <div className="text-[8px] font-mono text-gray-500 mb-1">DLY</div>
              <div className="h-4 bg-gray-900 rounded relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-600 to-red-500 transition-all duration-100"
                  style={{ width: `${delayTime > 0 ? Math.min(100, delayFeedback * 120) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full scope view */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-cyan-400">
                {activeTab === 'wave' ? 'Waveform' : 'Spectrum'} Analyzer
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="synth-button-small"
              >
                Close
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className="w-full bg-black border border-gray-700 rounded"
            />
          </div>
        </div>
      )}
    </>
  )
}