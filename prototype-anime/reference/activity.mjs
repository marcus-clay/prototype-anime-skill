// Where does the image change, over time? For each step of STEP seconds: the bounding box (as shares of the
// frame) of the pixels that changed since the previous step, and how many changed.
// Needs: npm i -D playwright && npx playwright install chromium, and the dev server on localhost:3000
import { chromium } from 'playwright'
import fs from 'fs'
const [, , src, out, STEP = '0.2'] = process.argv
const b = await chromium.launch()
const p = await b.newPage()
await p.goto('http://localhost:3000/robots.txt')
const res = await p.evaluate(async ({ src, STEP }) => {
  const v = document.createElement('video'); v.src = src; v.muted = true; v.preload = 'auto'
  document.body.appendChild(v)
  await new Promise((r, j) => { v.onloadeddata = r; v.onerror = j })
  const W = 240, H = Math.round(W * v.videoHeight / v.videoWidth)
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })
  let prev = null; const rows = []
  for (let t = 0; t < v.duration; t += STEP) {
    await new Promise(r => { v.onseeked = r; v.currentTime = t })
    g.drawImage(v, 0, 0, W, H)
    const d = g.getImageData(0, 0, W, H).data
    if (prev) {
      let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4
        const diff = Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2])
        if (diff > 40) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      }
      rows.push(n > 3 ? { t: +t.toFixed(2), n, box: [x0 / W, y0 / H, (x1 + 1) / W, (y1 + 1) / H].map(v => +v.toFixed(3)) } : { t: +t.toFixed(2), n })
    }
    prev = d
  }
  return { w: v.videoWidth, h: v.videoHeight, d: v.duration, rows }
}, { src, STEP: Number(STEP) })
fs.writeFileSync(out, JSON.stringify(res))
console.log(src, res.w, res.h, res.d.toFixed(1), 'samples', res.rows.length)
await b.close()
