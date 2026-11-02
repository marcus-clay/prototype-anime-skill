// Content-aware camera: always frame the interface (the part of the picture that is not the dark canvas),
// and push in further on bursts of local activity. Input: cnt/<name>.json (content box) and the activity
// file. Output: shots [{ at, x, y, zoom }] in shares of the frame.
import fs from 'fs'
export function frameShots(cnt, act, { ZMAX = 1.8, FILL = 0.92, ACT_FILL = 0.7, ACT_MIN = 0.42 } = {}) {
  const aspect = cnt.w / cnt.h
  const clampC = (c, z) => Math.min(1 - 0.5 / z, Math.max(0.5 / z, c))
  // zoom so that a box (bw wide, bh high, in shares) fits the frame
  const fit = (bw, bh, fill) => Math.max(1, Math.min(ZMAX, fill / Math.max(bw, bh, 0.05)))
  const target = (t) => {
    const r = cnt.rows.reduce((a, x) => (x.t <= t ? x : a), cnt.rows[0])
    const box = r.box ?? [0, 0, 1, 1]
    let z = fit(box[2] - box[0], box[3] - box[1], FILL)
    let cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2
    // local activity around t (from 0.4s before to 1.2s after): push in on it, inside the content
    const near = act.rows.filter((a) => a.box && a.n > 6 && a.t >= t - 0.4 && a.t <= t + 1.2)
    const local = near.filter((a) => (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) < 0.3)
    if (local.length && local.length >= near.length * 0.6) {
      const u = local.reduce((b, a) => [Math.min(b[0], a.box[0]), Math.min(b[1], a.box[1]), Math.max(b[2], a.box[2]), Math.max(b[3], a.box[3])], [1, 1, 0, 0])
      const bw = Math.max(ACT_MIN, u[2] - u[0]), bh = Math.max(ACT_MIN, u[3] - u[1])
      const za = fit(bw, bh, ACT_FILL)
      if (za > z + 0.15) { z = za; cx = (cx + (u[0] + u[2]) / 2) / 2; cy = (cy + (u[1] + u[3]) / 2) / 2 }
    }
    return { x: +clampC(cx, z).toFixed(3), y: +clampC(cy, z).toFixed(3), zoom: +z.toFixed(2) }
  }
  const shots = []
  const STEP = 0.25
  let last = null, pending = null
  for (let t = 0; t < cnt.d - 1.2; t += STEP) {
    const s = target(t)
    const far = !last || Math.abs(s.zoom - last.zoom) > 0.12 || Math.abs(s.x - last.x) > 0.05 || Math.abs(s.y - last.y) > 0.05
    if (!far) { pending = null; continue }
    // a new framing is taken only once it has held for 0.75s (no jitter), and announced 0.4s early
    if (!pending || Math.abs(pending.s.zoom - s.zoom) > 0.12 || Math.abs(pending.s.x - s.x) > 0.05 || Math.abs(pending.s.y - s.y) > 0.05) { pending = { t, s }; if (last) continue }
    if (!last || t - pending.t >= 0.75) {
      const at = last ? +Math.max(0, pending.t - 0.4).toFixed(2) : 0
      if (!last || at > shots[shots.length - 1].at + 0.8) { shots.push({ at, ...pending.s }); last = pending.s }
      pending = null
    }
  }
  // the first frame of the loop: same framing at the end, so the loop restarts without a jump
  const first = shots[0]
  if (last && (Math.abs(last.zoom - first.zoom) > 0.05 || Math.abs(last.x - first.x) > 0.03)) shots.push({ at: +(cnt.d - 1.1).toFixed(2), x: first.x, y: first.y, zoom: first.zoom })
  return shots
}
if (process.argv[2]) {
  const name = process.argv[2]
  const cnt = JSON.parse(fs.readFileSync(`cnt/${name}.json`))
  const act = JSON.parse(fs.readFileSync(`act/${name}.json`))
  console.log(JSON.stringify(frameShots(cnt, act)))
}
