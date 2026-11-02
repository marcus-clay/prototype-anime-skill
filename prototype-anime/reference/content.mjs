// Where is the interface, over time? For each step: the box (shares of the frame) of the pixels that are not
// ground (brighter than the dark canvas), ignoring isolated specks, plus the activity box as in activity.mjs.
// Needs: npm i -D playwright && npx playwright install chromium, and the dev server on localhost:3000
import { chromium } from 'playwright'
import fs from 'fs'
const [, , src, out, STEP = '0.25'] = process.argv
const b = await chromium.launch()
const p = await b.newPage()
await p.goto('http://localhost:3000/robots.txt')
const res = await p.evaluate(async ({ src, STEP }) => {
  const v = document.createElement('video'); v.src = src; v.muted = true; v.preload = 'auto'
  document.body.appendChild(v)
  await new Promise((r, j) => { v.onloadeddata = r; v.onerror = j })
  const W = 320, H = Math.round(W * v.videoHeight / v.videoWidth)
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })
  const rows = []
  for (let t = 0; t < v.duration; t += STEP) {
    await new Promise(r => { v.onseeked = r; v.currentTime = t })
    g.drawImage(v, 0, 0, W, H)
    const d = g.getImageData(0, 0, W, H).data
    // count bright pixels per column and per row, then trim the sparse edges (1% of the mass each side)
    const col = new Float64Array(W), row = new Float64Array(H); let total = 0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
      if (l > 38) { col[x]++; row[y]++; total++ }
    }
    if (total < 30) { rows.push({ t: +t.toFixed(2) }); continue }
    const trim = (arr) => { let a = 0, s = 0; while (s + arr[a] < total * 0.01) s += arr[a++]; let z = arr.length - 1; s = 0; while (s + arr[z] < total * 0.01) s += arr[z--]; return [a, z + 1] }
    const [x0, x1] = trim(col), [y0, y1] = trim(row)
    rows.push({ t: +t.toFixed(2), box: [x0 / W, y0 / H, x1 / W, y1 / H].map(v => +v.toFixed(3)) })
  }
  return { w: v.videoWidth, h: v.videoHeight, d: v.duration, rows }
}, { src, STEP: Number(STEP) })
fs.writeFileSync(out, JSON.stringify(res))
console.log(src, res.w + 'x' + res.h, res.d.toFixed(1))
await b.close()
