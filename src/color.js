// import * as THREE from 'three/webgpu'
import { TSL as $ } from 'three/webgpu'

/**
 * Linearly interpolates between a series of color stops and returns
 * the sampled color at a given position.
 *
 * Stops are sorted by their position (0–1) before interpolation.
 * Each stop is a tuple `[pos, color]`.
 *
 * @example
 * ```js
 * // Ramp from red -> lime -> animated blue
 * mat.colorNode = color_ramp_linear([
 *   [0.1, 'red'],
 *   [0.7, 'lime'],
 *   [0.9, color(0, 0, time.sin().remap(-1, 1, 0, 1))]
 * ], uv().x)
 * ```
 *
 * @param {*} stops - Array of color stops `[position, color]`
 * @param {*} fac - The sample coordinate (e.g. `uv().x`)
 * @returns {*} Interpolated color node
 */
export const color_ramp_linear = (stops, fac) => {
  fac = $.float(fac)
  stops = stops.map((x) => [$.float(x[0]), $.color(x[1])])
  const sorted_stops = stops.toSorted((a, b) => a[0].value - b[0].value)
  const positions = sorted_stops.map((x) => x[0])
  const colors = sorted_stops.map((x) => x[1])
  let color = colors[0]
  for (let i = 0; i < stops.length - 1; ++i) {
    const p0 = positions[i]
    const p1 = positions[i + 1]
    const color1 = colors[i + 1]
    const t = fac.sub(p0).div(p1.sub(p0)).clamp(0, 1)
    color = $.mix(color, color1, t)
  }
  return color
}

/**
 * Samples a step-wise (step-start) color ramp defined by stops.
 *
 * Stops are sorted by their position (0–1) before evaluation.
 *
 * @example
 * ```js
 * mat.colorNode = color_ramp_step_start([
 *   [0.0, 'red'],
 *   [0.5, 'lime'],
 * ], uv().x)
 * ```
 *
 * @param {*} stops - Array of color stops `[position, color]`
 * @param {*} fac - The sample coordinate (e.g. `uv().x`)
 * @returns {*} The selected color node
 */
export const color_ramp_step_start = (stops, fac) => {
  fac = $.float(fac)
  stops = stops.map((x) => [$.float(x[0]), $.color(x[1])])
  const sorted_stops = stops.toSorted((a, b) => a[0].value - b[0].value)
  const positions = sorted_stops.map((x) => x[0])
  const colors = sorted_stops.map((x) => x[1])
  let color = colors[0]
  for (let i = 0; i < stops.length - 1; ++i) {
    const p0 = positions[i]
    const p1 = positions[i + 1]
    const color1 = colors[i + 1]
    const t = fac.sub(p0).div(p1.sub(p0))
    color = $.select(t.lessThan(1), color, color1)
  }
  return color
}

/**
 * Samples a step-wise (step-end) color ramp defined by stops.
 *
 * Stops are sorted by their position (0–1) before evaluation.
 *
 * @example
 * ```js
 * mat.colorNode = color_ramp_step_end([
 *   [0.5, 'lime'],
 *   [1.0, 'blue']
 * ], uv().x)
 * ```
 *
 * @param {*} stops - Array of color stops `[position, color]`
 * @param {*} fac - The sample coordinate (e.g. `uv().x`)
 * @returns {*} The selected color node
 */
export const color_ramp_step_end = (stops, fac) => {
  fac = $.float(fac)
  stops = stops.map((x) => [$.float(x[0]), $.color(x[1])])
  const sorted_stops = stops.toSorted((a, b) => a[0].value - b[0].value)
  const positions = sorted_stops.map((x) => x[0])
  const colors = sorted_stops.map((x) => x[1])
  let color = colors[0]
  for (let i = 0; i < stops.length - 1; ++i) {
    const p0 = positions[i]
    const p1 = positions[i + 1]
    const color1 = colors[i + 1]
    const t = fac.sub(p0).div(p1.sub(p0))
    color = $.select(t.greaterThan(0), color1, color)
  }
  return color
}

// @TODO: maybe
// export const color_ramp_linear_baked = (stops, renderer, size = 128) => {
//   const texture = new THREE.StorageTexture(size, 1)
//   if (stops.length === 0) return texture
//   const compute_node = $.Fn(() => {
//     const index = $.float($.globalId.x)
//     const fac = index.div(size - 1)
//     const color = color_ramp_linear(stops, fac)
//     $.textureStore(texture, $.uvec2(index, 0), $.vec4(color, 1))
//   })().compute(size, [256, 1, 1])
//   renderer.compute(compute_node)
//   return texture
// }
