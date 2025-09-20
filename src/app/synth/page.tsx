'use client'

import { HybridSynth } from '@/components/synth/HybridSynth'
import { PortfolioLayout } from '@/app/PortfolioLayout'

export default function SynthPage() {
  return (
    <PortfolioLayout sidebar={null}>
      <div className="min-h-screen bg-bg-main p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary-green font-mono mb-2">
              Hybrid Synthesizer
            </h1>
            <p className="text-table-text font-mono text-sm">
              Web Audio API synthesizer with retro-futuristic interface
            </p>
          </div>
          <HybridSynth />
        </div>
      </div>
    </PortfolioLayout>
  )
}