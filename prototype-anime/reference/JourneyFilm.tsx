'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useSpring, useTransform, useVelocity } from 'framer-motion'
import { Pause } from '@phosphor-icons/react'
import { CenterPlay, CornerButton, CornerControls } from '@/components/media/PlayerControls'
import DeviceMockup from '@/components/case-study/DeviceMockup'
import ScaledScreen from '@/components/case-study/ScaledScreen'
import { FilmClockContext, easeOut, phase, useFilmTime, type FilmClock } from '@/components/case-study/FilmClock'

/**
 * What the film is played on. A phone is touched by a finger; a desktop window (a browser) is driven by a
 * cursor. Every coordinate of a film (taps, camera, gestures) is in the pixel space of the screen:
 * 390 × 844 for a phone, 1440 × 900 for a desktop unless `size` says otherwise.
 */
export type FilmDevice = 'phone' | 'desktop'
export const FILM_SIZE: Record<FilmDevice, { w: number; h: number }> = { phone: { w: 390, h: 844 }, desktop: { w: 1440, h: 900 } }

/**
 * How a screen arrives. Phone: pushed from the right, raised from the bottom (a camera), cross-faded, or opened
 * from the store like an app. Desktop: `push` is a page that slides in a few pixels, `up` a panel or dialog
 * that rises, `fade` a change of page; `launch` has no meaning on a desktop and falls back to `fade`.
 */
export type FilmTransition = 'push' | 'up' | 'fade' | 'launch'

/** A move of the camera, in the pixel space of the screen */
export interface FilmShot {
  at: number
  x: number
  y: number
  zoom: number
}

/** A press of the finger or a click of the cursor: where, when (seconds into the step), and the control that darkens under it. */
export interface FilmTap {
  x: number
  y: number
  at: number
  press?: { w: number; h: number; r: number }
  /** Desktop: the control that takes a light tint while the cursor is over it, before the click */
  hover?: { w: number; h: number; r: number }
  /** Seconds on the glass (phone) or on the button (desktop), shorter for keys typed in a row */
  hold?: number
}

export interface FilmStep {
  /** Still picture of the screen (same ratio as the screen: 390 × 844 for a phone, 1440 × 900 for a desktop) */
  src?: string
  /** Screen drawn in code, when there is no picture of it */
  screen?: React.ReactNode
  /** Gestures and moments played over the screen, timed from the start of the step */
  overlay?: React.ReactNode
  /** Where the finger presses (or the cursor clicks) on this screen */
  taps?: FilmTap[]
  /** Where the camera looks: from `at`, it frames the point (x, y) of the screen at `zoom`. Without shots it rests on the whole device. */
  camera?: FilmShot[]
  /** Seconds on screen: the step ends right after its last gesture, so the next screen answers the press */
  duration: number
  transition?: FilmTransition
}

interface JourneyFilmProps {
  steps: FilmStep[]
  /** Accessible name of the film */
  label: string
  labels: { play: string; pause: string }
  /** 'phone' (default) or 'desktop' */
  device?: FilmDevice
  /** Pixel space of the screens, when it is not the default of the device (1280 × 800, 1920 × 1080...) */
  size?: { w: number; h: number }
  /** Desktop: the address shown in the browser bar */
  url?: string
}

/**
 * How the change of screen moves. A camera raised from the bottom goes back down when it closes, so the
 * screen under it is simply revealed: things leave the way they came. At the end of the journey the last
 * screen fades out and the first one fades back in.
 */
type Move = 'push' | 'up' | 'down' | 'fade' | 'loop' | 'launch'

// iOS navigation curve: the new screen arrives fast and settles long
const EASE_NAV: [number, number, number, number] = [0.32, 0.72, 0, 1]
const LOOP_FADE = 0.6
const at = (x: string, y: string, s = 1) => `translate3d(${x}, ${y}, 0) scale(${s})`
/** Where an app opened from the store grows from: the "Ouvrir" button */
const LAUNCH_ORIGIN = '46% 19%'

const SCREEN_VARIANTS = {
  initial: (move: Move) =>
    move === 'push'
      ? { transform: at('100%', '0%'), opacity: 1, filter: 'blur(3px)', zIndex: 1 }
      : move === 'up'
        ? { transform: at('0%', '100%'), opacity: 1, zIndex: 1 }
        : move === 'down'
          ? { transform: at('0%', '0%', 0.97), opacity: 0.7, zIndex: 0 }
          : move === 'launch'
            ? { transform: at('0%', '0%', 0.12), opacity: 0, borderRadius: 120, zIndex: 1 }
            : { transform: at('0%', '0%'), opacity: 0, zIndex: 1 },
  animate: (move: Move) => ({
    transform: at('0%', '0%'),
    opacity: 1,
    filter: 'blur(0px)',
    borderRadius: 0,
    zIndex: 1,
    transition:
      move === 'loop'
        ? { duration: LOOP_FADE, delay: LOOP_FADE + 0.15, ease: 'easeOut' as const }
        : move === 'launch'
          ? { duration: 0.55, ease: EASE_NAV, opacity: { duration: 0.18 } }
          : { duration: move === 'fade' ? 0.3 : 0.5, ease: EASE_NAV },
  }),
  exit: (move: Move) =>
    move === 'push'
      ? { transform: at('-28%', '0%'), opacity: 0.75, filter: 'blur(2px)', zIndex: 0, transition: { duration: 0.5, ease: EASE_NAV } }
      : move === 'up' || move === 'launch'
        ? { transform: at('0%', '0%', 0.97), opacity: 0.7, zIndex: 0, transition: { duration: 0.5, ease: EASE_NAV } }
        : move === 'down'
          ? { transform: at('0%', '100%'), opacity: 1, zIndex: 2, transition: { duration: 0.45, ease: EASE_NAV } }
          : { transform: at('0%', '0%'), opacity: 0, zIndex: 2, transition: { duration: move === 'loop' ? LOOP_FADE : 0.3, ease: 'easeInOut' as const } },
}


/**
 * The same changes of screen on a desktop window: nothing travels across 1440 px. A page slides in by a few
 * pixels while it fades in, a panel rises a little, and the old screen leaves underneath by fading out.
 */
const DESKTOP_VARIANTS = {
  // A page or a panel arrives on top of the old screen, which stays opaque underneath until it is covered; a
  // change of page (fade) is the opposite, the new screen is already there and the old one fades out on top.
  // Either way there is never a moment where both are transparent and the empty stage shows through.
  initial: (move: Move) =>
    move === 'push'
      ? { transform: at('24px', '0px'), opacity: 0, zIndex: 1 }
      : move === 'up'
        ? { transform: at('0px', '28px'), opacity: 0, zIndex: 1 }
        : move === 'loop'
          ? { transform: at('0px', '0px'), opacity: 0, zIndex: 1 }
          : { transform: at('0px', '0px'), opacity: 1, zIndex: 0 },
  animate: (move: Move) => ({
    transform: at('0px', '0px'),
    opacity: 1,
    zIndex: 1,
    transition:
      move === 'loop' ? { duration: LOOP_FADE, delay: LOOP_FADE + 0.15, ease: 'easeOut' as const } : { duration: move === 'push' || move === 'up' ? 0.4 : 0.3, ease: EASE_NAV },
  }),
  exit: (move: Move) =>
    move === 'push' || move === 'up'
      ? { opacity: 0.999, zIndex: 0, transition: { duration: 0.4 } }
      : move === 'down'
        ? { transform: at('0px', '28px'), opacity: 0, zIndex: 2, transition: { duration: 0.3, ease: EASE_NAV } }
        : { opacity: 0, zIndex: 2, transition: { duration: move === 'loop' ? LOOP_FADE : 0.3, ease: 'easeInOut' as const } },
}

/** One screen of the film with the clock of its own step, frozen once the step is over. */
function StepLayer({ stepKey, clockFor, move, reduce, step, device, size }: { stepKey: string; clockFor: (key: string) => FilmClock; move: Move; reduce: boolean; step: FilmStep; device: FilmDevice; size: { w: number; h: number } }) {
  const clock = useMemo(() => clockFor(stepKey), [clockFor, stepKey])
  return (
    <motion.div
      custom={reduce ? 'fade' : move}
      variants={device === 'desktop' ? DESKTOP_VARIANTS : SCREEN_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#F5F7F9', boxShadow: '0 0 28px -10px rgba(0,0,0,0.3)', willChange: 'transform, opacity', transformOrigin: move === 'launch' ? LAUNCH_ORIGIN : '50% 50%' }}
    >
      <FilmClockContext.Provider value={clock}>
        {step.src && <img src={step.src} alt="" width={size.w} height={size.h} draggable={false} style={{ display: 'block', width: size.w, height: size.h }} />}
        {step.screen}
        {step.taps?.map((tap, i) => (tap.press || tap.hover) && <PressHighlight key={i} tap={tap} />)}
        {step.overlay}
      </FilmClockContext.Provider>
    </motion.div>
  )
}

/**
 * The control under the finger darkens the moment it is touched and clears when the finger lifts. On a desktop,
 * `hover` gives the control a light tint while the cursor is over it, then `press` darkens it for the click.
 */
function PressHighlight({ tap }: { tap: FilmTap }) {
  const t = useFilmTime(0.016)
  const release = tap.at + (tap.hold ?? FINGER_HOLD)
  const press = tap.press ? phase(t, tap.at, 0.04) * (1 - phase(t, release, 0.15)) : 0
  const h = tap.hover
  const hover = h ? phase(t, tap.at - 0.3, 0.2) * (1 - phase(t, release + 0.5, 0.3)) : 0
  const box = (b: { w: number; h: number; r: number }, background: string, opacity: number) => (
    <span aria-hidden="true" style={{ position: 'absolute', left: tap.x - b.w / 2, top: tap.y - b.h / 2, width: b.w, height: b.h, borderRadius: b.r, background, opacity }} />
  )
  return (
    <>
      {h && hover > 0 && box(h, 'rgba(0,0,0,0.05)', hover)}
      {tap.press && press > 0 && box(tap.press, 'rgba(0,0,0,0.13)', press)}
    </>
  )
}

/** How long a finger stays on the glass for a tap, and how far it drifts once lifted */
const FINGER_HOLD = 0.2
const FINGER_DRIFT = { x: 16, y: 44 }
/** The finger comes from below the screen the first time */
const FINGER_HOME = { x: 330, y: 930 }

const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

/**
 * The reader's finger: one fingertip that travels above the glass from one control to the next, lands,
 * presses, lifts and drifts away, so the film reads as a person using the app. Above the glass it is light
 * and its shadow is long; on the glass it is darker and its shadow short.
 */
function Finger({ taps, from }: { taps: FilmTap[]; from: { x: number; y: number } }) {
  const t = useFilmTime(0.016)

  let x = from.x
  let y = from.y
  let prev = from
  let free = 0
  let settled = true
  for (const tap of taps) {
    const start = Math.max(free, tap.at - 0.5)
    const end = tap.at - 0.04
    if (t < start) {
      x = prev.x
      y = prev.y
      settled = false
      break
    }
    if (t < end) {
      const p = easeInOut((t - start) / Math.max(0.05, end - start))
      // A light arc, as a hand moves: a little higher in the middle of the way
      x = lerp(prev.x, tap.x, p)
      y = lerp(prev.y, tap.y, p) - Math.sin(Math.PI * p) * 18
      settled = false
      break
    }
    x = tap.x
    y = tap.y
    prev = tap
    free = tap.at + (tap.hold ?? FINGER_HOLD)
  }
  const last = taps[taps.length - 1]
  if (settled && last) {
    const lift = easeOut(phase(t, last.at + (last.hold ?? FINGER_HOLD), 0.45))
    x = last.x + FINGER_DRIFT.x * lift
    y = last.y + FINGER_DRIFT.y * lift
  }

  // On the glass: 0 in the air, 1 pressed
  let contact = 0
  for (const tap of taps) contact = Math.max(contact, phase(t, tap.at - 0.04, 0.04) * (1 - phase(t, tap.at + (tap.hold ?? FINGER_HOLD), 0.06)))
  // Shown while it travels and a moment after a press; gone on screens it does not touch
  let shown = 0
  let prevRelease = -Infinity
  for (const tap of taps) {
    const start = Math.max(prevRelease, tap.at - 0.5)
    shown = Math.max(shown, phase(t, start - 0.15, 0.2) * (1 - phase(t, tap.at + (tap.hold ?? FINGER_HOLD) + 0.5, 0.35)))
    prevRelease = tap.at + (tap.hold ?? FINGER_HOLD)
  }
  if (shown <= 0) return null
  const height = 1 - contact
  // The press answers with a spring: it squashes on contact, rebounds past its size, then settles
  let press = 0
  let ripple: { p: number; tap: FilmTap } | null = null
  for (const tap of taps) {
    const since = t - tap.at
    if (since >= 0 && since < 0.9) {
      press = spring(since)
      ripple = { p: since / 0.65, tap }
    }
  }
  const scale = (1.1 - 0.1 * contact) * (1 - 0.16 * press)
  return (
    <>
      {ripple && ripple.p < 1 && (
        <>
          <Wave x={ripple.tap.x} y={ripple.tap.y} p={ripple.p} strength={1} />
          <Wave x={ripple.tap.x} y={ripple.tap.y} p={ripple.p - 0.18} strength={0.55} />
        </>
      )}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 58,
          height: 62,
          borderRadius: '50%',
          // Liquid glass: a clear lens that bends what is under it, a bright rim where the light catches,
          // a soft inner shade at the bottom, and a shadow that shortens as the finger meets the glass
          background: 'radial-gradient(120% 110% at 32% 24%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.2) 42%, rgba(255,255,255,0.06) 72%, rgba(255,255,255,0.14) 100%)',
          backdropFilter: 'blur(5px) saturate(180%) brightness(1.06)',
          WebkitBackdropFilter: 'blur(5px) saturate(180%) brightness(1.06)',
          boxShadow: [
            'inset 0 0 0 1px rgba(255,255,255,0.75)',
            'inset 0 1.5px 1px rgba(255,255,255,0.9)',
            'inset 0 -6px 12px rgba(0,0,0,0.12)',
            `0 ${3 + 12 * height}px ${10 + 16 * height}px rgba(0,0,0,${0.14 + 0.1 * contact})`,
          ].join(', '),
          opacity: shown * (0.7 + 0.3 * contact),
          transform: `translate(-50%, -50%) scale(${scale})`,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
    </>
  )
}

/** Underdamped spring of the press, from 0 (rest) to 1 (fully squashed), over about 0.9 s */
function spring(since: number) {
  const squash = phase(since, 0, 0.07)
  if (since < 0.07) return easeOut(squash)
  const u = since - 0.07
  // Released: it swings back past its size once, then settles
  return Math.exp(-7 * u) * Math.cos(13 * u)
}

/** A thin ring of light that spreads from the point of contact and fades: the glass answering the tap. */
function Wave({ x, y, p, strength }: { x: number; y: number; p: number; strength: number }) {
  if (p <= 0 || p >= 1) return null
  const e = easeOut(p)
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 58,
        height: 58,
        borderRadius: '50%',
        boxShadow: `0 0 0 ${1.5 * (1 - e) + 0.5}px rgba(255,255,255,0.95), 0 0 10px rgba(0,0,0,0.12), inset 0 0 10px rgba(255,255,255,0.35)`,
        opacity: strength * 0.75 * (1 - p),
        transform: `translate(-50%, -50%) scale(${1 + 1.5 * e})`,
        pointerEvents: 'none',
        zIndex: 4,
      }}
    />
  )
}

/** How long the cursor stays on the button for a click, and how far it drifts once the click is done */
const CURSOR_HOLD = 0.12
const CURSOR_DRIFT = { x: 26, y: 20 }

/**
 * The reader's cursor on a desktop: an arrow that travels from one control to the next on a slightly curved
 * path, slows down as it arrives, presses (it shrinks a little, a thin ring spreads from the point of the
 * click), then drifts away and fades once the click is done. The tip of the arrow is the point (x, y).
 */
function Pointer({ taps, from }: { taps: FilmTap[]; from: { x: number; y: number } }) {
  const t = useFilmTime(0.016)

  let x = from.x
  let y = from.y
  let prev = from
  let free = 0
  let settled = true
  for (const tap of taps) {
    const start = Math.max(free, tap.at - 0.6)
    const end = tap.at - 0.04
    if (t < start) {
      x = prev.x
      y = prev.y
      settled = false
      break
    }
    if (t < end) {
      const p = easeInOut((t - start) / Math.max(0.05, end - start))
      x = lerp(prev.x, tap.x, p)
      y = lerp(prev.y, tap.y, p) - Math.sin(Math.PI * p) * 10
      settled = false
      break
    }
    x = tap.x
    y = tap.y
    prev = tap
    free = tap.at + (tap.hold ?? CURSOR_HOLD)
  }
  const last = taps[taps.length - 1]
  if (settled && last) {
    const lift = easeOut(phase(t, last.at + (last.hold ?? CURSOR_HOLD), 0.5))
    x = last.x + CURSOR_DRIFT.x * lift
    y = last.y + CURSOR_DRIFT.y * lift
  }

  // Shown while it travels and for a moment after a click; gone on screens it does not touch
  let shown = 0
  let prevRelease = -Infinity
  let down = 0
  let ripple: { p: number; tap: FilmTap } | null = null
  for (const tap of taps) {
    const release = tap.at + (tap.hold ?? CURSOR_HOLD)
    const start = Math.max(prevRelease, tap.at - 0.6)
    shown = Math.max(shown, phase(t, start - 0.15, 0.2) * (1 - phase(t, release + 0.9, 0.4)))
    down = Math.max(down, phase(t, tap.at, 0.06) * (1 - phase(t, release, 0.12)))
    const since = t - tap.at
    if (since >= 0 && since < 0.5) ripple = { p: since / 0.5, tap }
    prevRelease = release
  }
  if (shown <= 0) return null
  return (
    <>
      {ripple && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: ripple.tap.x,
            top: ripple.tap.y,
            width: 44,
            height: 44,
            borderRadius: '50%',
            boxShadow: 'inset 0 0 0 2px rgba(17,17,17,0.35)',
            opacity: 1 - ripple.p,
            transform: `translate(-50%, -50%) scale(${0.3 + 0.9 * easeOut(ripple.p)})`,
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
      )}
      <svg
        aria-hidden="true"
        width="22"
        height="30"
        viewBox="-1 -1 22 30"
        style={{ position: 'absolute', left: x, top: y, opacity: shown, transform: `scale(${1 - 0.14 * down})`, transformOrigin: '1px 1px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))', pointerEvents: 'none', zIndex: 5 }}
      >
        <path d="M0 0 L0 17.5 L4.4 13.4 L7.4 20.4 L10.2 19.2 L7.2 12.4 L13 12.4 Z" fill="#111" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </>
  )
}

// Phone geometry, as shares of its width (see DeviceMockup): the bezel around the screen
const BEZEL = 0.034
// Browser window: the height of the bar above the page, as a share of the window width (see DeviceMockup)
const CHROME = 0.046

/** Where the screen sits inside the device, as shares of the device width: left, top, width, height, and the total height. */
function frameOf(device: FilmDevice, size: { w: number; h: number }) {
  if (device === 'phone') {
    const w = 1 - 2 * BEZEL
    const h = w * (size.h / size.w)
    return { left: BEZEL, top: BEZEL, w, h, total: h + 2 * BEZEL }
  }
  const h = size.h / size.w
  return { left: 0, top: CHROME, w: 1, h, total: CHROME + h }
}

/**
 * The camera over the phone, as in a product film: it pushes in on the part of the screen where the action
 * is and pulls back out, on a critically damped spring so it never overshoots. While it travels, a blur that
 * grows with its speed gives the move its motion blur.
 */
function Camera({ shots, stepKey, reduce, device, size, children }: { shots?: FilmShot[]; stepKey: string; reduce: boolean; device: FilmDevice; size: { w: number; h: number }; children: React.ReactNode }) {
  const t = useFilmTime(0.016)
  // At rest the camera shows the whole device
  const REST = useMemo(() => ({ x: size.w / 2, y: size.h / 2, zoom: 1 }), [size.w, size.h])
  const frame = frameOf(device, size)
  const carry = useRef(REST)
  const lastKey = useRef(stepKey)
  if (lastKey.current !== stepKey) {
    lastKey.current = stepKey
    if (!shots?.length) carry.current = REST
  }
  let target = carry.current
  for (const shot of shots ?? []) if (t >= shot.at) target = shot
  if (reduce) target = REST
  carry.current = target

  const spring = { stiffness: 85, damping: 21, mass: 1 }
  const x = useSpring(REST.x, spring)
  const y = useSpring(REST.y, spring)
  const zoom = useSpring(REST.zoom, spring)
  useEffect(() => {
    x.set(target.x)
    y.set(target.y)
    zoom.set(target.zoom)
  }, [target, x, y, zoom])

  const vx = useVelocity(x)
  const vy = useVelocity(y)
  const vz = useVelocity(zoom)
  const transform = useTransform([x, y, zoom], ([px, py, z]: number[]) => {
    const u = frame.left + frame.w * (px / size.w)
    const v = (frame.top + frame.h * (py / size.h)) / frame.total
    return `translate3d(${(0.5 - u) * z * 100}%, ${(0.5 - v) * z * 100}%, 0) scale(${z})`
  })
  const filter = useTransform([vx, vy, vz], ([a, b, c]: number[]) => {
    const blur = Math.min(2.5, (Math.abs(a) + Math.abs(b)) / 520 + Math.abs(c) * 1.6)
    return blur < 0.15 ? 'none' : `blur(${blur.toFixed(2)}px)`
  })

  return <motion.div style={{ transform, filter, transformOrigin: '50% 50%', willChange: 'transform, filter' }}>{children}</motion.div>
}

/**
 * A journey of the app played as a film in one large phone on the grey stage, from the first screen to the
 * last: each press leads to the next screen, fields fill in, the camera reads a card, then the film fades out
 * and starts again. It plays on its own while it is on screen, like the videos of the site, and stops when it
 * leaves or when the tab is hidden. One small button pauses it. It plays the same with reduced motion: the
 * film is the content of the figure.
 */
export default function JourneyFilm({ steps, label, labels, device = 'phone', size: sizeProp, url }: JourneyFilmProps) {
  const size = useMemo(() => sizeProp ?? FILM_SIZE[device], [sizeProp, device])
  // The film plays in full whatever the system motion setting: it is the content (see useGestureReducedMotion)
  const reduce = false
  const rootRef = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const pausedByUser = useRef(false)
  const onScreen = useRef(false)
  const listeners = useRef(new Set<() => void>())
  const frozen = useRef(new Map<string, number>())
  const [index, setIndex] = useState(0)
  const [run, setRun] = useState(0)
  const [move, setMove] = useState<Move>('fade')
  const [playing, setPlaying] = useState(false)

  const total = steps.length
  const stepKey = `${index}-${run}`
  const keyRef = useRef(stepKey)
  keyRef.current = stepKey

  const clockFor = useCallback(
    (key: string): FilmClock => ({
      now: () => (key === keyRef.current ? elapsed.current : (frozen.current.get(key) ?? 0)),
      subscribe: (listener) => {
        listeners.current.add(listener)
        return () => listeners.current.delete(listener)
      },
    }),
    []
  )

  // Every picture is fetched once the film comes near, so no screen arrives blank
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        steps.forEach((s) => {
          if (s.src) new Image().src = s.src
        })
        observer.disconnect()
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [steps])

  // On screen it plays, off screen or in a hidden tab it stops; a reader who paused it is never restarted
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const sync = () => setPlaying(onScreen.current && !document.hidden && !pausedByUser.current && !reduce)
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting
        sync()
      },
      { threshold: 0.45 }
    )
    observer.observe(el)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [reduce])

  // The clock: gestures follow it frame by frame, and the next screen comes as soon as the step is over
  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      // A long frame (a tab coming back) never skips a gesture
      elapsed.current += Math.min(0.1, (now - last) / 1000)
      last = now
      listeners.current.forEach((l) => l())
      // The first screen waits for the end of the fade that brought it back
      if (elapsed.current >= steps[index].duration + (index === 0 && run > 0 ? LOOP_FADE * 2 : 0)) {
        const next = (index + 1) % total
        let how: Move = 'loop'
        if (next !== 0) how = steps[index].transition === 'up' && steps[next].transition !== 'up' ? 'down' : (steps[next].transition ?? 'push')
        frozen.current.set(keyRef.current, elapsed.current)
        elapsed.current = 0
        setMove(how)
        setIndex(next)
        setRun((r) => r + 1)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, index, run, steps, total])

  // The first screen of a new lap starts its gestures once it is fully back
  const step = steps[index]
  const delayed = index === 0 && run > 0
  const shownStep = useMemo(
    () =>
      delayed
        ? {
            ...step,
            screen: step.screen && <DelayedClock by={LOOP_FADE * 2}>{step.screen}</DelayedClock>,
            overlay: step.overlay && <DelayedClock by={LOOP_FADE * 2}>{step.overlay}</DelayedClock>,
            taps: step.taps?.map((tap) => ({ ...tap, at: tap.at + LOOP_FADE * 2 })),
            camera: step.camera?.map((shot) => ({ ...shot, at: shot.at + LOOP_FADE * 2 })),
          }
        : step,
    [delayed, step]
  )

  // The finger (or the cursor) starts where it left the previous screen it touched
  const fingerFrom = useMemo(() => {
    const drift = device === 'desktop' ? CURSOR_DRIFT : FINGER_DRIFT
    for (let i = index - 1; i >= 0; i--) {
      const last = steps[i].taps?.[steps[i].taps!.length - 1]
      if (last) return { x: last.x + drift.x, y: last.y + drift.y }
    }
    // The first time, it comes from outside the screen: below on a phone, from the lower right on a desktop
    return device === 'desktop' ? { x: size.w * 0.82, y: size.h * 1.04 } : FINGER_HOME
  }, [index, steps, device, size.w, size.h])
  const fingerClock = useMemo(() => clockFor(stepKey), [clockFor, stepKey])

  const toggle = () => {
    pausedByUser.current = playing
    setPlaying(!playing)
  }

  const screen = (
    <div className="absolute inset-0 overflow-hidden bg-[#F5F7F9]">
      <ScaledScreen width={size.w} height={size.h}>
        <AnimatePresence initial={false} custom={reduce ? 'fade' : move}>
          <StepLayer key={stepKey} stepKey={stepKey} clockFor={clockFor} move={move} reduce={reduce} step={shownStep} device={device} size={size} />
        </AnimatePresence>
        <FilmClockContext.Provider value={fingerClock}>
          {device === 'desktop' ? <Pointer key={stepKey} taps={shownStep.taps ?? []} from={fingerFrom} /> : <Finger key={stepKey} taps={shownStep.taps ?? []} from={fingerFrom} />}
        </FilmClockContext.Provider>
      </ScaledScreen>
    </div>
  )

  return (
    <div ref={rootRef} role="group" aria-label={label} className="relative bg-[#E8E8E8] rounded-xl overflow-hidden ring-1 ring-black/[0.04]">
      <div className={device === 'desktop' ? 'flex justify-center px-4 py-8 md:px-12 md:py-14' : 'flex justify-center px-6 pt-10 pb-12 md:pt-14 md:pb-16'}>
        <div className={device === 'desktop' ? 'w-full max-w-[880px]' : 'w-[min(74vw,340px)] md:w-[360px]'}>
          <FilmClockContext.Provider value={fingerClock}>
            <Camera shots={shownStep.camera} stepKey={stepKey} reduce={reduce} device={device} size={size}>
              <DeviceMockup kind={device === 'desktop' ? 'browser' : 'phone'} aspect={size.w / size.h} url={url} screen={{ src: steps[0].src ?? '' }} label={label} custom={screen} />
            </Camera>
          </FilmClockContext.Provider>
        </div>
      </div>
      {/* Same controls as every player of the site: stopped, the large play in the middle; playing, the small
          pause in the bottom right corner of the grey container */}
      {!playing && <CenterPlay onClick={toggle} label={labels.play} />}
      {playing && (
        <CornerControls fallbackClassName="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20">
          <CornerButton onClick={toggle} label={labels.pause} dim>
            <Pause size={11} weight="fill" aria-hidden="true" />
          </CornerButton>
        </CornerControls>
      )}
    </div>
  )
}

/** Shifts the clock of the gestures it holds, so they start once the screen has faded back in. */
function DelayedClock({ by, children }: { by: number; children: React.ReactNode }) {
  const parent = React.useContext(FilmClockContext)
  const clock = useMemo<FilmClock | null>(() => (parent ? { now: () => Math.max(0, parent.now() - by), subscribe: parent.subscribe } : null), [parent, by])
  return <FilmClockContext.Provider value={clock}>{children}</FilmClockContext.Provider>
}
