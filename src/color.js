// import * as THREE from 'three/webgpu'
import { TSL as $ } from 'three/webgpu'

/**
 * Linearly interpolates between color stops and samples the color at a given position.
 *
 * Stops are `[position, color]` pairs. Positions can be any numbers.
 * Most cases use ascending order, but array order is respected.
 *
 * @param {*} stops - Array of `[position, color]` stops
 * @param {*} position - Sample position (float)
 * @returns {*} Interpolated color node
 *
 * @example
 * ```
 * mat.colorNode = color_ramp_linear([
 *   [0.1, 'red'],
 *   [0.7, 'lime'],
 *   [0.9, color(0, 0, oscSine(time))]
 * ], uv().x)
 * ```
 */
export const color_ramp_linear = (stops, position) => {
  stops = stops.map((x) => [$.float(x[0]), $.color(x[1])])
  position = $.float(position)
  let color = stops[0][1]
  for (let i = 0; i < stops.length - 1; ++i) {
    const position0 = stops[i][0]
    const position1 = stops[i + 1][0]
    const color1 = stops[i + 1][1]
    const t = position.sub(position0).div(position1.sub(position0)).clamp(0, 1)
    color = $.mix(color, color1, t)
  }
  return color
}

/**
 * Samples a step-wise (step-start) color ramp defined by stops.
 *
 * Stops are `[position, color]` pairs. Positions can be any numbers.
 * Most cases use ascending order, but array order is respected.
 *
 * @param {*} stops - Array of `[position, color]` stops
 * @param {*} position - Sample position (float)
 * @returns {*} Interpolated color node
 * 
 * @example
 * ```
 * mat.colorNode = color_ramp_step_start([
 *   [0.0, 'red'],
 *   [0.5, 'lime'],
 * ], uv().x)
 * ```
 */
export const color_ramp_step_start = (stops, position) => {
  stops = stops.map((x) => [$.float(x[0]), $.color(x[1])])
  position = $.float(position)
  let color = stops[0][1]
  for (let i = 0; i < stops.length - 1; ++i) {
    const position0 = stops[i][0]
    const position1 = stops[i + 1][0]
    const color1 = stops[i + 1][1]
    const t = position.sub(position0).div(position1.sub(position0))
    color = $.select(t.lessThan(1), color, color1)
  }
  return color
}

/**
 * Samples a step-wise (step-end) color ramp defined by stops.
 *
 * Stops are `[position, color]` pairs. Positions can be any numbers.
 * Most cases use ascending order, but array order is respected.
 *
 * @param {*} stops - Array of `[position, color]` stops
 * @param {*} position - Sample position (float)
 * @returns {*} Interpolated color node
 * 
 * @example
 * ```
 * mat.colorNode = color_ramp_step_end([
 *   [0.5, 'lime'],
 *   [1.0, 'blue']
 * ], uv().x)
 * ```
 */
export const color_ramp_step_end = (stops, position) => {
  stops = stops.map((x) => [$.float(x[0]), $.color(x[1])])
  position = $.float(position)
  let color = stops[0][1]
  for (let i = 0; i < stops.length - 1; ++i) {
    const position0 = stops[i][0]
    const position1 = stops[i + 1][0]
    const color1 = stops[i + 1][1]
    const t = position.sub(position0).div(position1.sub(position0))
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
