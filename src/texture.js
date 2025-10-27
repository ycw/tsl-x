import { TSL } from 'three/webgpu'

const { mix } = TSL

/**
 *
 * @param {*} coordinates vec[234]
 * @returns Mirrored repeat coordinates
 */
export const mirrored_repeat = (coordinates) => {
  const i = coordinates.floor()
  const f = coordinates.fract()
  return mix(f, f.oneMinus(), i.mod(2).greaterThan(0.5))
}


