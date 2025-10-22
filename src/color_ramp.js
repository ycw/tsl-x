import { TSL as $ } from 'three/webgpu'

let dispatched_count = 0

/**
 * Each `color_ramp` dispatches a standalone wgsl fn, so *reuse* if possible
 * @todo generic-ify after solving '.setLayout w/ arr inputs (wgsl backend)'
 * @example
 * ```js
 * const ramp = color_ramp([
 *  [float(0.0), color('red')],
 *  [float(0.3), color('lime')],
 *  [float(0.6), color('blue')],
 * ], 'constant')
 * material.colorNode = ramp(mx_noise_float(..))
 * ```
 * @param {Array} colorstops `[offset,color][]`
 * @param {'constant'|'linear'} [mode='linear'] Gradient mode
 * @returns A js fn accepting 'fac', returning interpolated color
 */
export default function color_ramp(colorstops, mode='linear') {
  return $.Fn(([fac]) => {
    const SIZE = colorstops.length
    const offsets = $.array(colorstops.map((x) => x[0])).toConst('offsets')
    const colors = $.array(colorstops.map((x) => x[1])).toConst('colors')
    const i_end = $.uint(SIZE).toVar('i_end')
    $.Loop(SIZE, ({ i }) => {
      $.If(fac.lessThanEqual(offsets.element(i)), () => {
        i_end.assign(i)
        $.Break()
      })
    })
    $.If(i_end.equal(0), () => colors.element(0))
    $.If(i_end.equal(SIZE), () => colors.element(SIZE - 1))
    const i_start = i_end.sub(1).toConst('i_start')
    const u_mode = $.uint({ linear: 0, constant: 1 }[mode])
    $.If(u_mode.equal(1), () => colors.element(i_start))
    return $.mix(
      colors.element(i_start),
      colors.element(i_end),
      fac.remap(offsets.element(i_start), offsets.element(i_end)),
    )
  }).setLayout({
    type: 'color',
    name: `color_ramp_dispatched${dispatched_count++}`,
    inputs: [ { name: 'fac', type: 'float' } ],
  })
}
