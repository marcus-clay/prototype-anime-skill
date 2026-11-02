// From the activity of a video to camera shots: push in on each burst of local activity, rest on the whole
// frame when the whole screen changes or nothing happens. Output: [{ at, x, y, zoom }] in shares of the frame.
import fs from 'fs'
export function shotsFrom(act, opt = {}) {
  const { FILL = 0.62, ZMAX = 1.6, ZMIN = 1.15, GAP = 1.0, LEAD = 0.45, TAIL = 0.9 } = opt
  const rows = act.rows
  const full = (r) => r.n > 0 && r.box && (r.box[2] - r.box[0]) * (r.box[3] - r.box[1]) > 0.45
  // segments of local activity
  const segs = []
  let cur = null
  for (const r of rows) {
    if (!r.box || r.n <= 3) continue
    if (full(r)) { if (cur) segs.push(cur); cur = null; segs.push({ full: true, t0: r.t, t1: r.t }); continue }
    if (cur && r.t - cur.t1 <= GAP) { cur.t1 = r.t; cur.n += r.n; cur.box = [Math.min(cur.box[0], r.box[0]), Math.min(cur.box[1], r.box[1]), Math.max(cur.box[2], r.box[2]), Math.max(cur.box[3], r.box[3])] }
    else { if (cur) segs.push(cur); cur = { t0: r.t, t1: r.t, n: r.n, box: [...r.box] } }
  }
  if (cur) segs.push(cur)
  const REST = { x: 0.5, y: 0.5, zoom: 1 }
  const shots = [{ at: 0, ...REST }]
  const push = (s) => {
    const last = shots[shots.length - 1]
    if (s.at < last.at + 0.6) { shots[shots.length - 1] = { ...s, at: last.at }; return }
    if (Math.abs(s.x - last.x) < 0.02 && Math.abs(s.y - last.y) < 0.02 && Math.abs(s.zoom - last.zoom) < 0.05) return
    shots.push(s)
  }
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    if (s.full) { push({ at: Math.max(0, s.t0 - 0.3), ...REST }); continue }
    if (s.n < 25) continue // a lone blip of the cursor
    const bw = s.box[2] - s.box[0], bh = s.box[3] - s.box[1]
    const aspect = act.w / act.h
    let zoom = Math.min(ZMAX, FILL / Math.max(bw, bh * 1, 0.05))
    if (zoom < ZMIN) { push({ at: Math.max(0, s.t0 - LEAD), ...REST }); continue }
    zoom = +zoom.toFixed(2)
    // centre, kept inside the frame so no edge shows
    const half = 0.5 / zoom
    const x = +Math.min(1 - half, Math.max(half, (s.box[0] + s.box[2]) / 2)).toFixed(3)
    const y = +Math.min(1 - half, Math.max(half, (s.box[1] + s.box[3]) / 2)).toFixed(3)
    push({ at: +Math.max(0, s.t0 - LEAD).toFixed(2), x, y, zoom })
    const next = segs[i + 1]
    if (!next || next.t0 - s.t1 > TAIL + 1.2) push({ at: +(s.t1 + TAIL).toFixed(2), ...REST })
  }
  // back to the whole frame before the loop restarts
  if (shots[shots.length - 1].zoom !== 1) push({ at: +Math.max(0, act.d - 1.2).toFixed(2), ...REST })
  return shots
}
if (process.argv[2]) {
  const act = JSON.parse(fs.readFileSync(process.argv[2]))
  const s = shotsFrom(act)
  console.log(JSON.stringify(s))
}
