import { TSL } from 'three/webgpu'

const { vec2, tangentLocal, bitangentLocal, normalLocal, faceDirection, transformNormalToView, vec3 } = TSL

/**
 * Computes a perturbed surface normal in view space using a scalar displacement field.
 *
 * This function wraps {@link bump_localspace}, transforming the local-space
 * perturbed normal into view space so it can be directly assigned to
 * `mat.normalNode` for bump/displacement shading.
 *
 * @example
 * ```js
 * const f = (xy) => mx_noise_float(xy)
 * const k = uv()
 * mat.positionNode = positionLocal.add(normalLocal.mul(f(k)))
 * mat.normalNode = bump(f, k)
 * ```
 *
 * @param {function(vec2): number} f - Scalar field function that takes a vec2 (e.g. UV) and returns a float value (height).
 * @param {vec2} k - The 2D coordinate at which to evaluate the bump gradient.
 * @param {number} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {vec3} View-space perturbed normal vector suitable for shading.
 */
export const bump = (f, k, eps = 0.001) => {
  return transformNormalToView(bump_localspace(f, k, eps))
}

/**
 * Computes a perturbed surface normal in local space using a scalar displacement field.
 *
 * The function estimates the gradient of the scalar field with finite differences
 * in tangent and bitangent directions, then constructs a new normal by crossing
 * the displaced tangent vectors. The result is suitable for bump/displacement shading.
 * 
 * @param {function(vec2): number} f - Scalar field function that takes a vec2 (e.g. UV) and returns a float value (height).
 * @param {vec2} k - The 2D coordinate at which to evaluate the bump gradient.
 * @param {number} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {vec3} Local-space perturbed normal vector, adjusted by face orientation.
 */
export const bump_localspace = (f, k, eps = 0.001) => {
  const df = forward_difference_gradient(f, k, eps)
  const dpds = tangentLocal.add(normalLocal.mul(df.s))
  const dpdt = bitangentLocal.add(normalLocal.mul(df.t))
  const localspace_normal = dpds.cross(dpdt).normalize()
  return localspace_normal.mul(faceDirection)
}

/**
 * Approximates the 2D gradient of a scalar field using the forward difference method.
 * 
 * @param {function(vec2): number} f - Scalar field function that takes a vec2 and returns a float value.
 * @param {vec2} k - The 2D coordinate at which to evaluate the bump gradient.
 * @param {number} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {vec2} The estimated gradient vector (df/ds, df/dt) at the given point.
 */
export const forward_difference_gradient = (f, k, eps = 0.001) => {
  const h = f(k)
  const h_s = f(k.add(vec2(eps, 0)))
  const h_t = f(k.add(vec2(0, eps)))
  const dfds = h_s.sub(h).div(eps)
  const dfdt = h_t.sub(h).div(eps)
  return vec2(dfds, dfdt)
}
