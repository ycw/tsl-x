import { TSL } from 'three/webgpu'

const { Fn, mix } = TSL

export const mirrored_repeat = Fn(([k]) => {
  const k_floor = k.floor()
  const k_fract = k.fract()
  return mix(
    k_fract,
    k_fract.oneMinus(),
    k_floor.mod(2).greaterThan(0.5)
  )
}).setLayout({
  name: 'YCW_mirrored_repeat',
  type: 'vec3',
  inputs: [{ name: 'k', type: 'vec3' }]
})
