// Two journeys of an imaginary app, « Lumen », played as films in one phone: getting started, from the store
// to the home screen, then booking a slot, from the home screen to the confirmation. The screens are exports
// of a design file (the images named below are yours to provide, 390 × 844, WebP); the moments without a
// picture (store, opening, keyboard, text message) are drawn in code. Coordinates are in the 390 × 844 space
// of the screens: read them on a gridded contact sheet, never by eye (see SKILL.md, step 3).
// One finger plays the reader: each step ends just after its last press, so the next screen answers it.

import React from 'react'
import type { FilmStep, FilmTap } from '@/components/case-study/JourneyFilm'
import { CheckboxCheck, CodeBoxes, NumPad, Reveal, Selected, SmsBanner, SplashScreen, StoreScreen, TypeField } from '@/components/case-study/FilmOverlays'
import { PulseOverlay } from '@/components/case-study/ScanOverlays'

const screen = (name: string) => `/images/lumen/${name}.webp`

/** The wide button at the foot of most screens */
const CTA = { w: 358, h: 56, r: 12 }
/** Time between a press and the screen it opens */
const ANSWER = 0.45

/** Centre of a key of the number pad; `top` is the first row (pad without suggestion bar: 625) */
const KEY_X = [67, 195, 323]
const key = (digit: string, top = 625) => {
  if (digit === '0') return { x: 195, y: top + 3 * 52 }
  const n = Number(digit) - 1
  return { x: KEY_X[n % 3], y: top + Math.floor(n / 3) * 52 }
}

const PHONE = '0612345678'
const TYPE_AT = 0.9
const CPS = 5 // characters per second
const typing: FilmTap[] = PHONE.split('').map((d, i) => ({ ...key(d), at: TYPE_AT + i / CPS, hold: 0.1, press: undefined }))
const TYPED = TYPE_AT + (PHONE.length - 1) / CPS

/** From the store listing to the home screen: install, open, one field, one code. */
export function startFilm(): FilmStep[] {
  return [
    {
      duration: 2.7 + 0.3,
      transition: 'fade',
      screen: (
        <StoreScreen
          name="Lumen"
          tagline="Vos notes, partout"
          description="Écrivez, classez et retrouvez vos notes sur tous vos appareils, même sans connexion."
          icon={screen('app-icon')}
          shots={[screen('store-01'), screen('store-02')]}
          installAt={0.7}
          openAt={2.7}
        />
      ),
      taps: [
        { x: 186, y: 162, at: 0.7 }, // « Installer »
        { x: 180, y: 162, at: 2.7 }, // « Ouvrir »
      ],
      camera: [
        { at: 0.1, x: 195, y: 250, zoom: 1.4 },
        { at: 2.75, x: 195, y: 422, zoom: 1 },
      ],
    },
    { duration: 1.4, transition: 'launch', screen: <SplashScreen logo="/images/lumen/logo.svg" /> },
    {
      duration: 0.8 + ANSWER,
      transition: 'fade',
      src: screen('bienvenue'),
      taps: [{ x: 195, y: 784, at: 0.8, press: CTA }],
    },
    {
      duration: TYPED + 0.75 + ANSWER,
      src: screen('connexion'),
      overlay: (
        <>
          <TypeField x={30} y={226} w={330} h={36} text={PHONE} pairs at={TYPE_AT} focusAt={0.35} cps={CPS} field={{ x: 16, y: 220, w: 358, h: 48, r: 10 }} />
          <NumPad showAt={0.4} hideAt={TYPED + 0.3} text={PHONE} typeAt={TYPE_AT} cps={CPS} />
        </>
      ),
      taps: [{ x: 160, y: 244, at: 0.3 }, ...typing, { x: 195, y: 784, at: TYPED + 0.75, press: CTA }],
      camera: [
        { at: 0.15, x: 195, y: 470, zoom: 1.22 },
        { at: TYPED + 0.4, x: 195, y: 560, zoom: 1.1 },
      ],
    },
    {
      duration: 2.4 + ANSWER,
      src: screen('code'),
      overlay: (
        <>
          <SmsBanner at={0.15} until={1.9} title="Lumen" body="Votre code de connexion : 481926" />
          <CodeBoxes x={16} y={185} digits="481926" at={1.55} every={0.05} />
          <NumPad showAt={0.85} hideAt={1.95} suggestion={{ label: '481926', pressAt: 1.45 }} />
        </>
      ),
      taps: [
        { x: 40, y: 212, at: 0.75 },
        { x: 195, y: 574, at: 1.45 },
        { x: 195, y: 784, at: 2.4, press: CTA },
      ],
      camera: [
        { at: 0, x: 195, y: 150, zoom: 1.45 },
        { at: 1.2, x: 195, y: 400, zoom: 1.15 },
        { at: 2.1, x: 195, y: 422, zoom: 1 },
      ],
    },
    {
      duration: 2.8,
      src: screen('accueil'),
      overlay: <PulseOverlay x={16} y={294} width={358} height={184} radius={22} delay={0.5} />,
    },
  ]
}

/** From the home screen to the confirmation: pick a slot, an option, accept, confirm. */
export function bookingFilm(): FilmStep[] {
  return [
    {
      duration: 0.9 + ANSWER,
      transition: 'fade',
      src: screen('accueil'),
      taps: [{ x: 141, y: 268, at: 0.9, press: { w: 206, h: 48, r: 10 } }],
    },
    {
      duration: 1.5 + ANSWER,
      src: screen('creneaux'),
      overlay: <Selected x={16} y={360} w={120} h={38} at={0.5} />,
      taps: [
        { x: 76, y: 379, at: 0.5, press: { w: 120, h: 38, r: 19 } },
        { x: 195, y: 784, at: 1.5, press: CTA },
      ],
      camera: [
        { at: 0, x: 170, y: 330, zoom: 1.35 },
        { at: 1.05, x: 195, y: 422, zoom: 1 },
      ],
    },
    {
      duration: 1.9 + ANSWER,
      src: screen('conditions'),
      overlay: (
        <>
          <CheckboxCheck x={32} y={184} at={0.4} />
          <CheckboxCheck x={32} y={306} at={1} />
        </>
      ),
      taps: [
        { x: 44, y: 196, at: 0.4 },
        { x: 44, y: 318, at: 1 },
        { x: 195, y: 767, at: 1.9, press: CTA },
      ],
      camera: [
        { at: 0, x: 150, y: 270, zoom: 1.4 },
        { at: 1.45, x: 195, y: 422, zoom: 1 },
      ],
    },
    {
      duration: 1.8,
      src: screen('verification'),
      overlay: <Reveal x={14} y={404} w={362} h={68} r={12} until={0.9} color="#F5F7F9" />,
    },
    {
      duration: 1 + ANSWER,
      src: screen('recapitulatif'),
      taps: [{ x: 195, y: 804, at: 1, press: CTA }],
    },
    {
      duration: 2.8,
      transition: 'fade',
      src: screen('confirmation'),
      overlay: <PulseOverlay x={16} y={288} width={358} height={64} radius={12} delay={0.6} />,
    },
  ]
}
