import { TSL as $ } from 'three/webgpu'
import { central_difference_gradient2d, central_difference_gradient3d } from './difference.js'

/**
 * Computes a perturbed surface normal in view space using a 2D scalar displacement field.
 *
 * This function wraps {@link bump_field2d_localspace}, transforming the local-space
 * perturbed normal into view space so it can be directly assigned to
 * `mat.normalNode` for bump/displacement shading.
 *
 * @example
 * ```js
 * const f = (k) => mx_noise_float(k)
 * const k = uv()
 *
 * // Geometry unchanged; only normals are perturbed
 * mat.positionNode = positionLocal
 * mat.normalNode   = bump_field2d(f, k, strength)
 *
 * // Geometry displaced by height; bump strength affects only normals
 * mat.positionNode = positionLocal.add(normalLocal.mul(f(k)))
 * mat.normalNode   = bump_field2d(f, k, strength)
 *
 * // Geometry displacement also scaled by strength for consistency
 * mat.positionNode = positionLocal.add(normalLocal.mul(f(k).mul(strength)))
 * mat.normalNode   = bump_field2d(f, k, strength)
 * ```
 *
 * @param {*} f - Scalar field function that takes a vec2 (e.g. UV) and returns a float value (height).
 * @param {*} k - The 2D coordinate at which to evaluate the bump gradient.
 * @param {*} [strength=1.0] - Multiplier for gradient magnitude (controls bump strength).
 * @param {*} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {*} View-space perturbed normal vector suitable for shading.
 */
export const bump_field2d = (f, k, strength = 1.0, eps = 0.001) => {
  k = $.vec2(k)
  strength = $.float(strength)
  eps = $.float(eps)
  const localspace_normal = bump_field2d_localspace(f, k, strength, eps)
  const viewspace_normal = $.transformNormalToView(localspace_normal)
  return viewspace_normal
}

/**
 * Computes a perturbed surface normal in local space using a scalar displacement field.
 *
 * The function estimates the gradient of the scalar field with finite differences
 * in tangent and bitangent directions, then constructs a new normal by crossing
 * the displaced tangent vectors. The result is suitable for bump/displacement shading.
 *
 * @param {*} f - Scalar field function that takes a vec2 (e.g. UV) and returns a float value (height).
 * @param {*} k - The 2D coordinate at which to evaluate the bump gradient.
 * @param {*} [strength=1.0] - Multiplier for gradient magnitude (controls bump strength).
 * @param {*} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {*} Local-space perturbed normal vector, adjusted by face orientation.
 */
export const bump_field2d_localspace = (f, k, strength = 1.0, eps = 0.001) => {
  k = $.vec2(k)
  strength = $.float(strength)
  eps = $.float(eps)
  const df = central_difference_gradient2d(f, k, eps).mul(strength).toConst()
  const dpds = $.tangentLocal.add($.normalLocal.mul(df.s))
  const dpdt = $.bitangentLocal.add($.normalLocal.mul(df.t))
  const localspace_normal = dpds.cross(dpdt).mul($.faceDirection)
  return localspace_normal.normalize()
}

/**
 * Computes a perturbed surface normal in view space using a 3D scalar displacement field.
 *
 * This function wraps {@link bump_field3d_localspace}, transforming the local-space
 * perturbed normal into view space so it can be directly assigned to
 * `mat.normalNode` for bump/displacement shading.
 *
 * @example
 * ```js
 * const f = (k) => mx_noise_float(k)
 * const k = positionLocal
 *
 * // Geometry unchanged; only normals are perturbed
 * mat.positionNode = positionLocal
 * mat.normalNode   = bump_field3d(f, k, strength)
 *
 * // Geometry displaced by height; bump strength affects only normals
 * mat.positionNode = positionLocal.add(normalLocal.mul(f(k)))
 * mat.normalNode   = bump_field3d(f, k, strength)
 *
 * // Geometry displacement also scaled by strength for consistency
 * mat.positionNode = positionLocal.add(normalLocal.mul(f(k).mul(strength)))
 * mat.normalNode   = bump_field3d(f, k, strength)
 * ```
 *
 * @param {*} f - Scalar field function that takes a vec3 and returns a float value (height).
 * @param {*} k - The 3D coordinate at which to evaluate the bump gradient.
 * @param {*} [strength=1.0] - Multiplier for gradient magnitude (controls bump strength).
 * @param {*} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {*} View-space perturbed normal vector suitable for shading.
 */
export const bump_field3d = (f, k, strength = 1.0, eps = 0.001) => {
  k = $.vec3(k)
  strength = $.float(strength)
  eps = $.float(eps)
  const localspace_normal = bump_field3d_localspace(f, k, strength, eps)
  const viewspace_normal = $.transformNormalToView(localspace_normal)
  return viewspace_normal
}

/**
 * Computes a perturbed surface normal in local space using a 3D scalar displacement field.
 *
 * This function estimates the gradient of the scalar field around the sample point,
 * projects it onto the tangent plane, and perturbs the local-space normal accordingly.
 *
 * @param {*} f - Scalar field function that takes a vec3 and returns a float value (height).
 * @param {*} k - The 3D coordinate at which to evaluate the bump gradient.
 * @param {*} [strength=1.0] - Multiplier for gradient magnitude (controls bump strength).
 * @param {*} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {*} Local-space perturbed normal vector.
 */
export const bump_field3d_localspace = (f, k, strength = 1.0, eps = 0.001) => {
  k = $.vec3(k)
  strength = $.float(strength)
  eps = $.float(eps)
  const n = $.normalLocal.normalize().toConst()
  const grad3 = central_difference_gradient3d(f, k, eps).toConst()
  const grad_tangent = grad3.sub(n.mul(grad3.dot(n)))
  const localspace_normal = n.sub(grad_tangent.mul(strength))
  return localspace_normal.normalize()
}
