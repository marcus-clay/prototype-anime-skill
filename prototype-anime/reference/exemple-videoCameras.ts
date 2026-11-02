/**
 * Camera shots of the recorded prototypes (VideoPlayer plays them through VideoCamera), by video path.
 * Each shot frames the point (x, y) of the video, in shares of its width and height, at `zoom`, from `at`
 * seconds; the first shot is the whole frame. Measured on each video (where the picture changes, and when):
 * a push-in on each burst of local activity (a field, a menu, a panel), back to the whole frame when the
 * whole screen changes and before the loop restarts. Tight crops and small recordings push in less (1.35 at
 * most). Videos that are already edited films (zooms or a finger already added) or diagrams have no entry.
 *
 * Two entries are enough to show the shape: replace them with the shots that `shots.mjs` (or `calm.mjs`)
 * computes for your own videos.
 */
export interface VideoShot {
  at: number
  x: number
  y: number
  zoom: number
}

export const VIDEO_CAMERAS: Record<string, VideoShot[]> = {
  // A short clip with one field to fill: one push-in on it, then the whole frame again
  '/videos/demo/filtre-liste.mp4': [
    { at: 0, x: 0.5, y: 0.5, zoom: 1 },
    { at: 2.55, x: 0.688, y: 0.313, zoom: 1.6 },
    { at: 3.75, x: 0.688, y: 0.4, zoom: 1.6 },
    { at: 5.3, x: 0.688, y: 0.313, zoom: 1.6 },
    { at: 6.5, x: 0.5, y: 0.5, zoom: 1 },
  ],
  // A longer clip with three separate actions: a push-in on each, the whole frame in between
  '/videos/demo/parcours-complet.mp4': [
    { at: 0, x: 0.5, y: 0.5, zoom: 1 },
    { at: 3.75, x: 0.63, y: 0.37, zoom: 1.35 },
    { at: 5.3, x: 0.5, y: 0.5, zoom: 1 },
    { at: 7.15, x: 0.63, y: 0.581, zoom: 1.35 },
    { at: 8.7, x: 0.5, y: 0.5, zoom: 1 },
    { at: 11.75, x: 0.37, y: 0.63, zoom: 1.35 },
    { at: 13.9, x: 0.5, y: 0.5, zoom: 1 },
  ],
}
