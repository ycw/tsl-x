import { TSL as $ } from 'three/webgpu'

/**
 * Approximates the 2D gradient of a scalar field using the forward difference method.
 *
 * @param {*} f - Scalar field function that takes a vec2 and returns a float value.
 * @param {*} k - The 2D coordinate at which to evaluate the bump gradient.
 * @param {*} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {*} The estimated gradient vector (df/dx, df/dy) at the given point.
 */
export const forward_difference_gradient2d = (f, k, eps = 0.001) => {
  k = $.vec2(k)
  eps = $.float(eps)
  const h = f(k)
  const dfdx = f(k.add($.vec2(eps, 0))).sub(h).div(eps)
  const dfdy = f(k.add($.vec2(0, eps))).sub(h).div(eps)
  return $.vec2(dfdx, dfdy)
}

/**
 * Approximates the gradient of a scalar field in 3D using forward finite differences.
 *
 * This helper samples the scalar field at small offsets along each axis and
 * returns the gradient vector (df/dx, df/dy, df/dz).
 *
 * @param {*} f - Scalar field function that takes a vec3 and returns a float value (height).
 * @param {*} k - The 3D coordinate at which to evaluate the gradient.
 * @param {*} [eps=0.001] - Small offset step used for finite difference approximation.
 * @returns {*} Gradient vector of the scalar field at the sample point.
 */
export const forward_difference_gradient3d = (f, k, eps = 0.001) => {
  k = $.vec3(k)
  eps = $.float(eps)
  const h = f(k)
  const dfdx = f(k.add($.vec3(eps, 0.0, 0.0))).sub(h).div(eps)
  const dfdy = f(k.add($.vec3(0.0, eps, 0.0))).sub(h).div(eps)
  const dfdz = f(k.add($.vec3(0.0, 0.0, eps))).sub(h).div(eps)
  return $.vec3(dfdx, dfdy, dfdz)
}

/**
 * Central difference Laplacian in 2D.
 *
 * Measures how different the center value is compared to its four neighbors.
 * Returns a scalar (float) indicating local curvature / smoothness.
 *
 * Positive value = center lower than neighbors (valley).
 * Negative value = center higher than neighbors (peak).
 * Near zero      = center similar to neighbors (flat / smooth).
 *
 * @param {*} f Sampling function returning scalar at given 2D position.
 * @param {*} k 2D position (vec2) to evaluate.
 * @param {*} eps2d Step size for finite difference.
 * @returns {*} Scalar Laplacian value (float).
 */
export const central_difference_laplacian2d_to_1d = (f, k, eps2d = $.vec2(0.001, 0.001)) => {
  k = $.vec2(k)
  eps2d = $.vec2(eps2d)
  const h = f(k)
  const h_L = f(k.sub($.vec2(eps2d.x, 0)))
  const h_R = f(k.add($.vec2(eps2d.x, 0)))
  const h_T = f(k.add($.vec2(0, eps2d.y)))
  const h_B = f(k.sub($.vec2(0, eps2d.y)))
  const laplacian_x = h_L.add(h_R).sub(h.mul(2)).div(eps2d.x.pow2())
  const laplacian_y = h_T.add(h_B).sub(h.mul(2)).div(eps2d.y.pow2())
  return laplacian_x.add(laplacian_y)
}
