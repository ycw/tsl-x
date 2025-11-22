import { TSL as $ } from 'three/webgpu'
import { central_difference_laplacian2d } from './difference.js'

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
 * Builds a compute kernel for simulating 2D wave propagation using ping-pong storage textures.
 *
 * Notes:
 * - The range of sampled height and velocity values is not fixed; it varies depending on
 *   damping and impulse configuration.
 * - The timestep is clamped internally for stability (~0.016s by default).
 *
 * @param {*} options - Configuration object.
 * @param {*} options.states_for_read - Storage texture to read current wave state (vec2: height, velocity).
 * @param {*} options.states_for_write - Storage texture to write updated wave state.
 * @param {*} [options.padding=0] - Padding texels around the working area to avoid boundary artifacts.
 * @param {*} [options.speed=0.05] - Wave propagation speed (uvspace units per second).
 * @param {*} [options.damping=0.05] - Damping factor (decay rate per second).
 * @param {*} [options.impulse_enabled=true] - Whether external impulses are applied.
 * @param {*} [options.impulse_strength=0.5] - Strength of the impulse force.
 * @param {*} [options.impulse_radius=0.2] - Radius of impulse influence (uvspace units).
 * @param {*} [options.impulse_position=(0,0)] - Position of impulse in uvspace coordinates.
 * @param {*} [options.timestep=0.016] - Simulation timestep in seconds (clamped internally).
 *
 * @returns {*} A compute kernel function that updates the wave state when dispatched.
 *
 * @example
 * ```js
 * const states0 = new THREE.StorageTexture(32, 32)
 * const states1 = new THREE.StorageTexture(32, 32)
 * states0.type = states1.type = THREE.FloatType
 * states0.generateMipmaps = states1.generateMipmaps = false
 * states0.minFilter = states1.minFilter = THREE.NearestFilter
 * states0.magFilter = states1.magFilter = THREE.NearestFilter
 *
 * const kernel = compute_wave2d_kernel({ states0, states1 })
 * renderer.compute(kernel)
 * ```
 */
export const compute_wave2d_kernel = ({
  states_for_read,
  states_for_write,
  padding = 0,
  speed = 0.1,
  damping = 0.1,
  impulse_enabled = true,
  impulse_strength = 4,
  impulse_radius = 0.1,
  impulse_position = $.vec2(0, 0),
  timestep = 0.016
}) => {
  speed = $.float(speed)
  damping = $.float(damping)
  impulse_enabled = $.bool(impulse_enabled)
  impulse_strength = $.float(impulse_strength)
  impulse_radius = $.float(impulse_radius)
  impulse_position = $.vec2(impulse_position)
  timestep = $.float(timestep).min(0.016)
  const scale = states_for_read.width / (states_for_read.width + 2 * padding)
  const scaled_wave_speed = speed.mul(scale)
  const scaled_impulse_radius = impulse_radius.mul(scale)
  const scaled_impulse_position = impulse_position.sub(0.5).mul(scale).add(0.5)
  const kernel = write_texture2d_kernel(states_for_write, (uv01, _, size2d) => {
    const h_sampler = (xy) => $.texture(states_for_read, xy).r
    const laplacian = central_difference_laplacian2d(h_sampler, uv01, size2d.reciprocal())
      .mul(scaled_wave_speed.pow2(), timestep)
    const impulse = $.smoothstep(scaled_impulse_radius, 0, uv01.distance(scaled_impulse_position))
      .mul(impulse_strength, timestep)
      .mul(impulse_enabled)
    const damping_term = $.exp(damping.mul(timestep).negate())
    const states = $.texture(states_for_read, uv01)
    const [h, v] = [states.r, states.g]
    const v1 = $.add(v, laplacian, impulse).mul(damping_term)
    const h1 = h.add(v1.mul(timestep))
    return $.vec2(h1, v1)
  })
  return kernel
}
