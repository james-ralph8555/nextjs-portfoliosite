'use client'

import React, { useState, useEffect } from 'react'
import { Knob } from './Knob'
import { LED } from './LED'

interface OscillatorSectionProps {
  waveform: OscillatorType
  mix: number
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
  onWaveformChange: (waveform: OscillatorType) => void
  onMixChange: (mix: number) => void
  onUnisonChange: (unison: Partial<{ enabled: boolean; voices: number; detune: number }>) => void
  onGlideChange: (glide: Partial<{ enabled: boolean; time: number; legato: boolean }>) => void
}

const WAVEFORMS: { value: OscillatorType; label: string; color: string }[] = [
  { value: 'sawtooth', label: 'SAW', color: 'amber' },
  { value: 'square', label: 'SQR', color: 'red' },
  { value: 'sine', label: 'SIN', color: 'green' },
  { value: 'triangle', label: 'TRI', color: 'cyan' }
]

export function OscillatorSection({
  waveform,
  mix,
  unison,
  glide,
  onWaveformChange,
  onMixChange,
  onUnisonChange,
  onGlideChange
}: OscillatorSectionProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileUnisonExpanded, setMobileUnisonExpanded] = useState(false)
  const [mobileGlideExpanded, setMobileGlideExpanded] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleUnison = () => {
    onUnisonChange({ enabled: !unison.enabled })
  }

  const toggleGlide = () => {
    onGlideChange({ enabled: !glide.enabled })
  }

  const toggleMobileUnison = () => {
    setMobileUnisonExpanded(!mobileUnisonExpanded)
  }

  const toggleMobileGlide = () => {
    setMobileGlideExpanded(!mobileGlideExpanded)
  }

  return (
    <div className="synth-section">
      <div className="synth-section-title flex items-center justify-between">
        <span>OSC/MIX</span>
        <div className="flex gap-1">
          <div className="flex items-center gap-1">
            <LED active={unison.enabled} color="amber" size="xxs" />
            <span className="text-[8px] font-mono text-gray-500">UNI</span>
          </div>
          <div className="flex items-center gap-1">
            <LED active={glide.enabled} color="green" size="xxs" />
            <span className="text-[8px] font-mono text-gray-500">GLI</span>
          </div>
        </div>
      </div>
      
      {/* Base Controls (Always Visible) */}
      <div className="space-y-2">
        {/* Waveform Selection */}
        <div className="grid grid-cols-4 gap-1">
          {WAVEFORMS.map(({ value, label }) => (
            <button
              key={value}
              className={`
                synth-button-waveform
                ${waveform === value ? 'active' : ''}
              `}
              onClick={() => onWaveformChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mix Knob */}
        <div className="synth-knob-compact">
          <div className="synth-knob-label">Mix</div>
          <Knob
            value={mix}
            min={0}
            max={1}
            step={0.01}
            onChange={onMixChange}
            size="sm"
          />
          <div className="synth-knob-value">{(mix * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Desktop Layout - Integrated Controls (Always Visible) */}
      {!isMobile && (
        <div className="mt-3 space-y-2">
          {/* Unison Section */}
          <div className="synth-subsection-desktop">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <LED active={unison.enabled} color="amber" size="xxs" />
                <span className="text-[9px] font-mono text-gray-500">UNISON</span>
                <button
                  onClick={toggleUnison}
                  className={`synth-skeu-button text-[8px] ml-1 ${
                    unison.enabled ? 'bg-amber-600 text-white border-amber-500' : 'bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                >
                  {unison.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div className="synth-knob-compact">
                <div className="text-[8px] font-mono text-gray-500">Voices</div>
                <Knob
                  value={unison.voices}
                  min={2}
                  max={6}
                  step={1}
                  onChange={(v) => onUnisonChange({ voices: Math.round(v) })}
                  size="xs"
                />
                <div className="text-[8px] font-mono text-gray-400">{unison.voices}</div>
              </div>
              <div className="synth-knob-compact">
                <div className="text-[8px] font-mono text-gray-500">Detune</div>
                <Knob
                  value={unison.detune}
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  onChange={(v) => onUnisonChange({ detune: v })}
                  size="xs"
                />
                <div className="text-[8px] font-mono text-gray-400">{unison.detune.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Glide Section */}
          <div className="synth-subsection-desktop">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <LED active={glide.enabled} color="green" size="xxs" />
                <span className="text-[9px] font-mono text-gray-500">GLIDE</span>
                <button
                  onClick={toggleGlide}
                  className={`synth-skeu-button text-[8px] ml-1 ${
                    glide.enabled ? 'bg-green-600 text-white border-green-500' : 'bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                >
                  {glide.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div className="synth-knob-compact">
                <div className="text-[8px] font-mono text-gray-500">Time</div>
                <Knob
                  value={glide.time}
                  min={0.01}
                  max={1}
                  step={0.01}
                  onChange={(v) => onGlideChange({ time: v })}
                  size="xs"
                />
                <div className="text-[8px] font-mono text-gray-400">{glide.time.toFixed(2)}s</div>
              </div>
              <div className="synth-knob-compact">
                <div className="text-[8px] font-mono text-gray-500">Legato</div>
                <button
                  className={`synth-button-small text-[8px] w-full ${
                    glide.legato ? 'bg-cyan-600 text-white border-cyan-500' : ''
                  }`}
                  onClick={() => onGlideChange({ legato: !glide.legato })}
                >
                  {glide.legato ? 'YES' : 'NO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Layout - Expandable Sections */}
      {isMobile && (
        <div className="mt-2 space-y-2">
          {/* Unison Section - Mobile */}
          <div className="synth-subsection-mobile">
            <button
              onClick={toggleMobileUnison}
              className="flex items-center justify-between w-full hover:bg-gray-700 transition-colors p-1 rounded"
            >
              <div className="flex items-center gap-1">
                <LED active={unison.enabled} color="amber" size="xxs" />
                <span className="text-[9px] font-mono text-gray-500">UNISON</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleUnison()
                  }}
                  className={`synth-skeu-button text-[8px] ${
                    unison.enabled ? 'bg-amber-600 text-white border-amber-500' : 'bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                >
                  {unison.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <span className="text-[8px] font-mono text-gray-400">
                {mobileUnisonExpanded ? '▼' : '▶'}
              </span>
            </button>
            
            {mobileUnisonExpanded && (
              <div className="mt-2 space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <div className="synth-knob-compact">
                    <div className="text-[8px] font-mono text-gray-500">Voices</div>
                    <Knob
                      value={unison.voices}
                      min={2}
                      max={6}
                      step={1}
                      onChange={(v) => onUnisonChange({ voices: Math.round(v) })}
                      size="xs"
                    />
                    <div className="text-[8px] font-mono text-gray-400">{unison.voices}</div>
                  </div>
                  <div className="synth-knob-compact">
                    <div className="text-[8px] font-mono text-gray-500">Detune</div>
                    <Knob
                      value={unison.detune}
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      onChange={(v) => onUnisonChange({ detune: v })}
                      size="xs"
                    />
                    <div className="text-[8px] font-mono text-gray-400">{unison.detune.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Glide Section - Mobile */}
          <div className="synth-subsection-mobile">
            <button
              onClick={toggleMobileGlide}
              className="flex items-center justify-between w-full hover:bg-gray-700 transition-colors p-1 rounded"
            >
              <div className="flex items-center gap-1">
                <LED active={glide.enabled} color="green" size="xxs" />
                <span className="text-[9px] font-mono text-gray-500">GLIDE</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleGlide()
                  }}
                  className={`synth-skeu-button text-[8px] ${
                    glide.enabled ? 'bg-green-600 text-white border-green-500' : 'bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                >
                  {glide.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <span className="text-[8px] font-mono text-gray-400">
                {mobileGlideExpanded ? '▼' : '▶'}
              </span>
            </button>
            
            {mobileGlideExpanded && (
              <div className="mt-2 space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <div className="synth-knob-compact">
                    <div className="text-[8px] font-mono text-gray-500">Time</div>
                    <Knob
                      value={glide.time}
                      min={0.01}
                      max={1}
                      step={0.01}
                      onChange={(v) => onGlideChange({ time: v })}
                      size="xs"
                    />
                    <div className="text-[8px] font-mono text-gray-400">{glide.time.toFixed(2)}s</div>
                  </div>
                  <div className="synth-knob-compact">
                    <div className="text-[8px] font-mono text-gray-500">Legato</div>
                    <button
                      className={`synth-button-small text-[8px] w-full ${
                        glide.legato ? 'bg-cyan-600 text-white border-cyan-500' : ''
                      }`}
                      onClick={() => onGlideChange({ legato: !glide.legato })}
                    >
                      {glide.legato ? 'YES' : 'NO'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}