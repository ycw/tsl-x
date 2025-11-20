import { TSL as $ } from 'three/webgpu'
import { central_difference_laplacian2d_to_1d } from './difference.js'

/**
 * Creates a compute kernel that writes values into a 2D storage texture.
 *
 * The mapping function is invoked per texel as `f(uv01, index2d, size2d)`:
 * - uv01    = normalized UV coordinates in [0, 1] (vec2)
 * - index2d = the 2D texel index (vec2)
 * - size2d  = the texture dimensions (vec2)
 *
 * @param {*} tex - The 2D storage texture to write values into.
 * @param {*} f - A function mapping to the value to be written.
 * @returns {*} The compute kernel. Call `renderer.compute(kernel)` to dispatch.
 *
 * @example
 * ```
 * const tex = new THREE.StorageTexture(64, 64)
 * tex.format = THREE.RedFormat
 * tex.type = THREE.FloatType
 * const kernel = write_texture2d_kernel(tex, uv => mx_noise_float(uv))
 * renderer.compute(kernel)
 * ```
 */
export const write_texture2d_kernel = (tex, f) => {
  const size2d = $.vec2(tex.width, tex.height)
  const bounds = size2d.sub(1).max(1)
  const kernel = $.Fn(() => {
    const index2d = $.vec2(
      $.instanceIndex.mod(tex.width),
      $.instanceIndex.div(tex.width)
    )
    const uv01 = index2d.div(bounds)
    const value = f(uv01, index2d, size2d)
    $.textureStore(tex, $.uvec2(index2d), value)
  })().compute(tex.width * tex.height)
  return kernel
}

/**
 * Creates a compute kernel that writes values into a 3D storage texture.
 *
 * The mapping function is invoked per texel as `f(uv01, index3d, size3d)`:
 * - uvw01   = normalized UVW coordinates in [0, 1] (vec3)
 * - index3d = the 3D texel index (vec3)
 * - size3d  = the texture dimensions (vec3)
 *
 * @param {*} tex - The 3D storage texture to write values into.
 * @param {*} f - A function mapping to the value to be written.
 * @returns {*} The compute kernel. Call `renderer.compute(kernel)` to dispatch.
 *
 * @example
 * ```
 * const tex = new THREE.Storage3DTexture(32, 32, 32)
 * tex.format = THREE.RedFormat
 * tex.type = THREE.FloatType
 * const kernel = write_texture3d_kernel(tex, uvw => mx_noise_float(uvw))
 * renderer.compute(kernel)
 * ```
 */
export const write_texture3d_kernel = (tex, f) => {
  const size3d = $.vec3(tex.width, tex.height, tex.depth)
  const bounds = size3d.sub(1).max(1)
  const kernel = $.Fn(() => {
    const index3d = $.vec3(
      $.instanceIndex.mod(tex.width),
      $.instanceIndex.div(tex.width).mod(tex.height),
      $.instanceIndex.div(tex.width * tex.height)
    )
    const uvw01 = index3d.div(bounds)
    const value = f(uvw01, index3d, size3d)
    $.textureStore(tex, $.uvec3(index3d), value)
  })().compute(tex.width * tex.height * tex.depth)
  return kernel
}

/**
 * Creates a compute kernel that simulates 2D wave propagation in a storage texture.
 *
 * The kernel updates height and velocity per texel using a finite‑difference
 * approximation of the wave equation, with optional damping and impulse forces.
 *
 * @param {*} options - Configuration object.
 * @param {*} options.storage_texture_current - Current state texture (.r=height, .g=velocity).
 * @param {*} options.storage_texture_next - Target texture to write the next state into.
 * @param {*} [options.uvspace_propagation_per_second=0.05] - Wave propagation speed in UV space.
 * @param {*} [options.damping_per_second=0.05] - Damping factor per second.
 * @param {*} [options.impulse_enabled=true] - Whether to apply an impulse force.
 * @param {*} [options.impulse_per_second=0.5] - Impulse strength per second.
 * @param {*} [options.uvspace_impulse_radius=0.2] - Impulse radius in UV space.
 * @param {*} [options.uvspace_impulse_position=(0,0)] - Impulse position in UV space.
 * @param {*} [options.delta_time_in_seconds=deltaTime] - Simulation timestep (clamped to 0.016).
 * @returns {*} A compute kernel. Call `renderer.compute(kernel)` to advance the simulation.
 *
 * @example
 * ```js
 * const tex0 = new THREE.StorageTexture(64, 64)
 * tex0.type = THREE.FloatType
 * tex0.generateMipmaps = false
 * tex0.minFilter = THREE.NearestFilter
 * tex0.magFilter = THREE.NearestFilter
 * 
 * const tex1 = new THREE.StorageTexture(64, 64)
 * tex1.type = THREE.FloatType
 * tex1.generateMipmaps = false
 * tex1.minFilter = THREE.NearestFilter
 * tex1.magFilter = THREE.NearestFilter
 * 
 * const kernel = compute_wave2d_kernel({
 *   storage_texture_current: tex0,
 *   storage_texture_next: tex1
 * })
 * renderer.compute(kernel)
 * ```
 */
export const compute_wave2d_kernel = ({
  storage_texture_current,
  storage_texture_next,
  uvspace_propagation_per_second = 0.05,
  damping_per_second = 0.05,
  impulse_enabled = true,
  impulse_per_second = 0.5,
  uvspace_impulse_radius = 0.2,
  uvspace_impulse_position = $.vec2(0, 0),
  delta_time_in_seconds = $.deltaTime
}) => {
  uvspace_propagation_per_second = $.float(uvspace_propagation_per_second)
  damping_per_second = $.float(damping_per_second)
  impulse_enabled = $.bool(impulse_enabled)
  impulse_per_second = $.float(impulse_per_second)
  uvspace_impulse_radius = $.float(uvspace_impulse_radius)
  uvspace_impulse_position = $.vec2(uvspace_impulse_position)
  delta_time_in_seconds = $.float(delta_time_in_seconds).min(0.016)
  const kernel = write_texture2d_kernel(storage_texture_next, (uv01, _index2d, size2d) => {
    const sample_current = $.texture(storage_texture_current, uv01)
    const [h_current, velocity_current] = [sample_current.r, sample_current.g]
    const laplacian_h = central_difference_laplacian2d_to_1d(
      (k) => $.texture(storage_texture_current, k).r,
      uv01,
      size2d.reciprocal()
    )
    const impulse = $.smoothstep(uvspace_impulse_radius, 0, uv01.distance(uvspace_impulse_position))
      .mul(impulse_per_second, delta_time_in_seconds)
      .mul(impulse_enabled)
    const damping = $.exp(damping_per_second.mul(delta_time_in_seconds).negate())
    const velocity_next = velocity_current
      .add(laplacian_h.mul(uvspace_propagation_per_second.pow2(), delta_time_in_seconds))
      .add(impulse)
      .mul(damping)
    const h_next = h_current.add(velocity_next.mul(delta_time_in_seconds))
    return $.vec2(h_next, velocity_next)
  })
  return kernel
}
