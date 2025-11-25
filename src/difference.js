import { TSL as $ } from 'three/webgpu'

//
// Gradient
//

/**
 * Approximates the 2D gradient of a scalar field using the central difference method.
 *
 * @param {*} f - Scalar field function that takes a vec2 and returns a float value.
 * @param {*} xy - The 2D coordinate at which to evaluate the gradient.
 * @param {*} [step=(0.001,0.001)] - Small offset step used for finite difference approximation.
 * @returns {*} The estimated gradient vector (df/dx, df/dy) at the given point.
 */
export const central_difference_gradient2d = (f, xy, step = $.vec2(0.001, 0.001)) => {
  xy = $.vec2(xy).toConst()
  step = $.vec2(step).toConst()
  const sample_1step_backward_x = f(xy.sub($.vec2(step.x, 0)))
  const sample_1step_forward_x = f(xy.add($.vec2(step.x, 0)))
  const sample_1step_backward_y = f(xy.sub($.vec2(0, step.y)))
  const sample_1step_forward_y = f(xy.add($.vec2(0, step.y)))
  const two_steps = step.mul(2).toConst()
  const dfdx = $.sub(sample_1step_forward_x, sample_1step_backward_x).div(two_steps.x)
  const dfdy = $.sub(sample_1step_forward_y, sample_1step_backward_y).div(two_steps.y)
  return $.vec2(dfdx, dfdy)
}

/**
 * Approximates the 3D gradient of a scalar field using the central difference method.
 *
 * @param {*} f - Scalar field function that takes a vec3 and returns a float value.
 * @param {*} xyz - The 3D coordinate at which to evaluate the gradient.
 * @param {*} [step=(0.001,0.001,0.001)] - Small offset step used for finite difference approximation.
 * @returns {*} The estimated gradient vector (df/dx, df/dy, df/dz) at the given point.
 */
export const central_difference_gradient3d = (f, xyz, step = $.vec3(0.001, 0.001, 0.001)) => {
  xyz = $.vec3(xyz).toConst()
  step = $.vec3(step).toConst()
  const sample_1step_backward_x = f(xyz.sub($.vec3(step.x, 0, 0)))
  const sample_1step_forward_x = f(xyz.add($.vec3(step.x, 0, 0)))
  const sample_1step_backward_y = f(xyz.sub($.vec3(0, step.y, 0)))
  const sample_1step_forward_y = f(xyz.add($.vec3(0, step.y, 0)))
  const sample_1step_backward_z = f(xyz.sub($.vec3(0, 0, step.z)))
  const sample_1step_forward_z = f(xyz.add($.vec3(0, 0, step.z)))
  const two_steps = step.mul(2)
  const dfdx = $.sub(sample_1step_forward_x, sample_1step_backward_x).div(two_steps.x)
  const dfdy = $.sub(sample_1step_forward_y, sample_1step_backward_y).div(two_steps.y)
  const dfdz = $.sub(sample_1step_forward_z, sample_1step_backward_z).div(two_steps.z)
  return $.vec3(dfdx, dfdy, dfdz)
}

//
// Laplacian
//

/**
 * Computes the second derivative along one axis using formula:
 *   (sample_1step_forward - 2 * sample + sample_1step_backward) / (step * step)
 *
 * Returns a scalar (float) indicating local curvature / smoothness:
 * - > 0 means center lower than neighbors (valley)
 * - < 0 means center higher than neighbors (peak)
 * - ~ 0 means center similar to neighbors (flat / smooth)
 *
 * @param {*} a - Previous sample value (float).
 * @param {*} b - Current sample value (float).
 * @param {*} c - Next sample value (float).
 * @param {*} step - Step size along the axis (float).
 * @returns {*} Approximation of the second derivative along the axis (float).
 * @private
 */
const laplacian_3point = (a, b, c, step) => {
  return c.sub(b.mul(2)).add(a).div(step.pow2())
}

/**
 * Approximates the 2D Laplacian of a scalar field at a point using central difference method.
 *
 * @param {*} f - Scalar field function that takes a vec2 and returns a float value.
 * @param {*} xy - The 2D coordinate at which to evaluate the Laplacian.
 * @param {*} [step=(0.001,0.001)] - Step size along each axis for finite difference approximation.
 * @returns {*} Scalar value (float) representing the Laplacian at the given point.
 */
export const central_difference_laplacian2d = (f, xy, step = $.vec2(0.001, 0.001)) => {
  xy = $.vec2(xy).toConst()
  step = $.vec2(step).toConst()
  const sample = f(xy)
  const sample_1step_backward_x = f(xy.sub($.vec2(step.x, 0)))
  const sample_1step_forward_x = f(xy.add($.vec2(step.x, 0)))
  const sample_1step_backward_y = f(xy.sub($.vec2(0, step.y)))
  const sample_1step_forward_y = f(xy.add($.vec2(0, step.y)))
  return $.add(
    laplacian_3point(sample_1step_backward_x, sample, sample_1step_forward_x, step.x),
    laplacian_3point(sample_1step_backward_y, sample, sample_1step_forward_y, step.y)
  )
}
