// @ts-nocheck
import React from 'react'
import aboutConfig from '@/content/about.json'

export const AboutBlock = () => {
  return (
    <section id="about" className="mb-2 scroll-mt-8">
      <div className="content-section-borderless m-0 p-0">
        <div className="terminal-header">
          <span className="terminal-header-text">ABOUT</span>
        </div>
        <div className="px-4 pt-4 pb-4 space-y-4 text-table-text font-mono text-sm">
          {aboutConfig.paragraphs.map((paragraph, index) => (
            <p key={index} className="break-words leading-relaxed">
              {paragraph}
            </p>
          ))}
          <div className="mt-6 pt-4 border-t border-box-outline">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-box-title-bg">EXPERIENCE:</span>
                <span className="text-table-text ml-2 whitespace-nowrap">7+ YEARS</span>
              </div>
              <div>
                <span className="text-box-title-bg">FOCUS:</span>
                <span className="text-table-text ml-2">ML/AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
