/** Small math helpers shared by the hero scroll logic and the 3D scene. */

/** Clamp a value into [min, max] (default 0..1). */
export const cl = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

/** Linear interpolation. */
export const lp = (a: number, b: number, t: number) => a + (b - a) * t

/** Ease in-out cubic. Expects t in 0..1. */
export const ez = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
