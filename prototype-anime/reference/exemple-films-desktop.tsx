// A journey of the web version of the imaginary app « Lumen », played as a film in a browser window: sign in,
// open the dashboard, create a session in a dialog, land back on the dashboard with the new row. It is the
// desktop counterpart of exemple-films.tsx: same data model, a cursor instead of a finger, a keyboard instead of
// a number pad. The screens are exports of a design file (1440 × 900, WebP: the images named below are yours to
// provide); the moments that move (typing, a menu that opens, a toast) are drawn in code over them.
// Coordinates are in the 1440 × 900 space of the screens: read them on a gridded contact sheet, never by eye.
// Play it with <JourneyFilm device="desktop" url="app.lumen.fr" steps={sessionFilm()} ... />.

import React from 'react'
import type { FilmStep } from '@/components/case-study/JourneyFilm'
import { Appear, TypeField } from '@/components/case-study/FilmOverlays'
import { PulseOverlay } from '@/components/case-study/ScanOverlays'

const screen = (name: string) => `/images/lumen-web/${name}.webp`

/** Time between a click and the screen it opens */
const ANSWER = 0.45
/** Typing speed on a keyboard, in characters per second */
const CPS = 12

const BTN = { w: 360, h: 48, r: 10 }

/** From the sign-in page to the new row in the dashboard. */
export function sessionFilm(): FilmStep[] {
  const EMAIL = 'claire@lumen.fr'
  const PASSWORD = '•••••••••'
  const TITLE = 'Yoga du soir'
  return [
    {
      duration: 3.7 + ANSWER,
      transition: 'fade',
      src: screen('connexion'),
      overlay: (
        <>
          <TypeField x={556} y={346} w={330} h={36} text={EMAIL} at={0.7} focusAt={0.45} cps={CPS} size={17} field={{ x: 540, y: 340, w: 360, h: 48, r: 10 }} />
          <TypeField x={556} y={434} w={330} h={36} text={PASSWORD} at={2.2} focusAt={1.95} cps={CPS} size={17} field={{ x: 540, y: 428, w: 360, h: 48, r: 10 }} />
        </>
      ),
      taps: [
        { x: 720, y: 364, at: 0.45, hold: 0.1 },
        { x: 720, y: 452, at: 1.95, hold: 0.1 },
        { x: 720, y: 544, at: 3.7, hover: BTN, press: BTN },
      ],
      camera: [
        { at: 0.1, x: 720, y: 420, zoom: 1.5 },
        { at: 3.5, x: 720, y: 450, zoom: 1 },
      ],
    },
    {
      duration: 1.5 + ANSWER,
      transition: 'push',
      src: screen('tableau'),
      taps: [{ x: 1280, y: 58, at: 1.5, hover: { w: 200, h: 44, r: 10 }, press: { w: 200, h: 44, r: 10 } }],
      camera: [
        { at: 0.2, x: 1100, y: 200, zoom: 1.35 },
        { at: 1.9, x: 720, y: 450, zoom: 1 },
      ],
    },
    {
      duration: 4.5 + ANSWER,
      transition: 'up',
      src: screen('nouvelle-seance'),
      overlay: (
        <>
          <TypeField x={506} y={292} w={430} h={30} text={TITLE} at={0.9} focusAt={0.5} cps={CPS} size={17} field={{ x: 492, y: 284, w: 456, h: 44, r: 10 }} />
          {/* The menu of times opens under the field, then the chosen time takes the place of the placeholder */}
          <Appear x={492} y={424} w={456} h={150} at={2.15} from="above">
            <ol style={{ margin: 0, padding: 8, listStyle: 'none', background: '#fff', borderRadius: 10, boxShadow: '0 0 0 1px #dfe3e7, 0 12px 28px -8px rgba(17,24,39,0.25)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 16, color: '#111827' }}>
              {['18 h 00', '19 h 00', '20 h 30'].map((v) => (
                <li key={v} style={{ height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', borderRadius: 6 }}>
                  {v}
                </li>
              ))}
            </ol>
          </Appear>
          <Appear x={493} y={373} w={454} h={42} at={3.5} from="none">
            <div style={{ height: 42, padding: '0 14px', display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 9, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 17, color: '#111827' }}>19 h 00</div>
          </Appear>
        </>
      ),
      taps: [
        { x: 720, y: 306, at: 0.5, hold: 0.1 },
        { x: 720, y: 394, at: 2.0, hold: 0.1 },
        { x: 720, y: 498, at: 3.2, hover: { w: 440, h: 44, r: 6 }, press: { w: 440, h: 44, r: 6 } },
        { x: 888, y: 650, at: 4.5, hover: { w: 120, h: 44, r: 10 }, press: { w: 120, h: 44, r: 10 } },
      ],
      camera: [
        { at: 0.2, x: 720, y: 330, zoom: 1.6 },
        { at: 2.7, x: 720, y: 480, zoom: 1.35 },
        { at: 4.1, x: 800, y: 560, zoom: 1.3 },
      ],
    },
    {
      duration: 3.2,
      transition: 'fade',
      src: screen('tableau-nouveau'),
      overlay: (
        <>
          <PulseOverlay x={296} y={190} width={1088} height={64} radius={10} delay={0.4} />
          <Appear x={1100} y={812} w={300} h={56} at={0.5}>
            <div style={{ height: 56, borderRadius: 12, background: '#111827', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', padding: '0 20px' }}>Séance créée</div>
          </Appear>
        </>
      ),
      camera: [
        { at: 0, x: 720, y: 450, zoom: 1 },
        { at: 0.2, x: 800, y: 300, zoom: 1.3 },
        { at: 2.4, x: 720, y: 450, zoom: 1 },
      ],
    },
  ]
}
