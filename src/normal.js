import { TSL } from 'three/webgpu'

const { vec2, tangentLocal, bitangentLocal, normalLocal, faceDirection, transformNormalToView } = TSL

/**
 * @example
 * ```js
 * const H = (xy) => mx_noise_float(xy).remap(-1, 1, 0, 0.2)
 * const xy = uv().mul(4)
 * mat.positionNode = positionLocal.add(normalLocal.mul(H(xy)))
 * mat.normalNode = bump(H, xy)
 * ```
 * @param {*} H Height fn (jsfunc), accepting vec2 returning float
 * @param {*} xy vec2, sample point of H
 * @param {*} [eps=0.001] Finite diff. used as xy offset
 * @returns view-space normal applied bump fx
 */
export const bump = (H, xy, eps = 0.0001) => {
  const h = H(xy)
  const hU = H(xy.add(vec2(eps, 0)))
  const hV = H(xy.add(vec2(0, eps)))
  const dhdu = hU.sub(h).div(eps)
  const dhdv = hV.sub(h).div(eps)
  const gradU = tangentLocal.add(normalLocal.mul(dhdu))
  const gradV = bitangentLocal.add(normalLocal.mul(dhdv))
  const localspace_normal = gradU.cross(gradV).normalize().mul(faceDirection)
  return transformNormalToView(localspace_normal)
}
