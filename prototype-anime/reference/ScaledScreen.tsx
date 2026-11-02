'use client'

import React, { useEffect, useRef, useState } from 'react'

/**
 * A screen in its own pixel space (390 × 844 for a phone, 1440 × 900 for a desktop window), scaled to the
 * device that holds it.
 */
export default function ScaledScreen({
  children,
  width = 390,
  height = 844,
  className = 'absolute inset-0 overflow-hidden',
}: {
  children: React.ReactNode
  width?: number
  height?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [width])
  return (
    <div ref={ref} className={className}>
      <div style={{ position: 'absolute', top: 0, left: 0, width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  )
}
