'use client'

// The device that holds the film, drawn in CSS so that it stays sharp at any size and carries no baked shadow.
// Every length is a share of the device width (`cqw`), so a device at 200 px and a device at 800 px keep the same
// proportions. `phone` is a dark frame with a Dynamic Island around a 390 × 844 screen; `browser` is a window
// with its title bar (three dots and an address) above a page of any ratio. `custom` is what the film draws.
// Needs Tailwind CSS (arbitrary values) and a browser with container queries (all current ones).
// The bar of the browser is 4.6 % of its width high: JourneyFilm's camera relies on it (CHROME).

import React from 'react'

interface DeviceMockupProps {
  kind: 'phone' | 'browser'
  /** Poster of the screen; unused when `custom` is given, kept so the film can pass its first picture */
  screen: { src: string }
  /** Name of the screen, read by assistive technology */
  label: string
  /** What the film draws on the screen */
  custom?: React.ReactNode
  /** Width / height of the screen. Defaults: 390 / 844 for a phone, 16 / 10 for a browser */
  aspect?: number
  /** Browser: the address shown in the bar */
  url?: string
  className?: string
}

export default function DeviceMockup({ kind, screen, label, custom, aspect, url, className = '' }: DeviceMockupProps) {
  const picture = custom ?? (screen.src ? <img src={screen.src} alt={label} className="absolute inset-0 h-full w-full object-cover" /> : null)

  if (kind === 'browser') {
    return (
      <div className={`relative [container-type:inline-size] ${className}`}>
        <div className="relative overflow-hidden bg-[#F4F4F5] [border-radius:1.6cqw] shadow-[0_0_0_1px_rgba(17,17,17,0.1),0_2cqw_5cqw_-2.5cqw_rgba(17,17,17,0.22)]">
          <div className="flex items-center bg-[#F4F4F5] [height:4.6cqw] [padding-inline:1.8cqw] [gap:0.9cqw]" aria-hidden="true">
            <span className="rounded-full bg-[#D4D4D8] [width:1cqw] [height:1cqw]" />
            <span className="rounded-full bg-[#D4D4D8] [width:1cqw] [height:1cqw]" />
            <span className="rounded-full bg-[#D4D4D8] [width:1cqw] [height:1cqw]" />
            {url && <span className="mx-auto truncate rounded-full bg-white text-center text-gray-500 [height:2.8cqw] [width:38cqw] [line-height:2.8cqw] [font-size:1.5cqw]">{url}</span>}
          </div>
          <div className="relative overflow-hidden bg-white" style={{ aspectRatio: aspect ?? 16 / 10 }}>
            {picture}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative [container-type:inline-size] ${className}`}>
      <div className="relative bg-[#0E0F11] p-[3.4cqw] [border-radius:15.5cqw] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_0_0.5px_rgba(0,0,0,0.5),0_2.4cqw_6cqw_-3cqw_rgba(17,17,17,0.28)]">
        <div className="relative overflow-hidden bg-white [border-radius:12.2cqw]" style={{ aspectRatio: aspect ?? 390 / 844 }}>
          {picture}
          {/* Dynamic Island */}
          <span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 bg-[#0E0F11] [top:3cqw] [width:30cqw] [height:8.6cqw] [border-radius:4.3cqw]" />
        </div>
      </div>
      {/* Side buttons */}
      <span aria-hidden="true" className="absolute bg-[#1B1C1F] [left:-0.7cqw] [top:24cqw] [width:0.9cqw] [height:7cqw] [border-radius:0.4cqw]" />
      <span aria-hidden="true" className="absolute bg-[#1B1C1F] [left:-0.7cqw] [top:36cqw] [width:0.9cqw] [height:12cqw] [border-radius:0.4cqw]" />
      <span aria-hidden="true" className="absolute bg-[#1B1C1F] [right:-0.7cqw] [top:40cqw] [width:0.9cqw] [height:17cqw] [border-radius:0.4cqw]" />
    </div>
  )
}
