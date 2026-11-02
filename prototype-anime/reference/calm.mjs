// Calm framing: one framing per clip, held from start to end (the interface over the whole clip, edges at
// the 10th / 90th percentile so a passing toast does not widen it), and at most one push-in on the main
// action (the longest compact burst of local activity, 1.5 s or more), then back to the same framing.
import fs from 'fs'
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))] }
export function calmShots(cnt, act, { ZMAX = 1.8, FILL = 0.94, PUSH = 0.45, MIN_LEN = 1.5 } = {}) {
  const boxes = cnt.rows.filter((r) => r.box).map((r) => r.box)
  const box = boxes.length ? [pct(boxes.map((b) => b[0]), 0.1), pct(boxes.map((b) => b[1]), 0.1), pct(boxes.map((b) => b[2]), 0.9), pct(boxes.map((b) => b[3]), 0.9)] : [0, 0, 1, 1]
  const fit = (bw, bh, fill) => Math.max(1, Math.min(ZMAX, fill / Math.max(bw, bh, 0.05)))
  const clamp = (c, z) => Math.min(1 - 0.5 / z, Math.max(0.5 / z, c))
  const z0 = +fit(box[2] - box[0], box[3] - box[1], FILL).toFixed(2)
  const base = { x: +clamp((box[0] + box[2]) / 2, z0).toFixed(3), y: +clamp((box[1] + box[3]) / 2, z0).toFixed(3), zoom: z0 }
  const shots = [{ at: 0, ...base }]
  // bursts of compact local activity
  const segs = []
  let cur = null
  for (const r of act.rows ?? []) {
    const local = r.box && r.n > 6 && (r.box[2] - r.box[0]) * (r.box[3] - r.box[1]) < 0.12
    if (local && cur && r.t - cur.t1 <= 0.6) { cur.t1 = r.t; cur.box = [Math.min(cur.box[0], r.box[0]), Math.min(cur.box[1], r.box[1]), Math.max(cur.box[2], r.box[2]), Math.max(cur.box[3], r.box[3])] }
    else if (local) { if (cur) segs.push(cur); cur = { t0: r.t, t1: r.t, box: [...r.box] } }
  }
  if (cur) segs.push(cur)
  const best = segs.filter((s) => s.t1 - s.t0 >= MIN_LEN && s.t0 > 0.8 && s.t1 < cnt.d - 1.5).sort((a, b) => (b.t1 - b.t0) - (a.t1 - a.t0))[0]
  if (best) {
    const u = best.box
    const z = +Math.min(ZMAX, Math.max(base.zoom + 0.2, fit(Math.max(0.4, u[2] - u[0]), Math.max(0.4, u[3] - u[1]), 0.8))).toFixed(2)
    if (z >= base.zoom + 0.2) {
      // centred between the action and the framing, so the context stays in view
      const x = +clamp((base.x + (u[0] + u[2]) / 2) / 2, z).toFixed(3), y = +clamp((base.y + (u[1] + u[3]) / 2) / 2, z).toFixed(3)
      shots.push({ at: +Math.max(0.5, best.t0 - PUSH).toFixed(2), x, y, zoom: z })
      shots.push({ at: +(best.t1 + 0.8).toFixed(2), ...base })
    }
  }
  return shots
}
