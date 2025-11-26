import * as THREE from 'three/webgpu'
import { TSL as $ } from 'three/webgpu'
import { write_texture2d_kernel } from './compute.js'
import { central_difference_laplacian2d } from './difference.js'

/**
 * Builds a compute kernel for simulating 2D wave propagation using ping-pong storage textures.
 *
 * Notes:
 * - Wave states height/velocity range depends on settings, not normalized.
 * - All uv-related settings are measured in effective region uvspace,
 *   where effective region's edge length = (storage texture edge length − 2*padding).
 *
 * @param {*} options - Configuration object.
 * @param {*} options.states_for_read - Storage texture to read current wave state (vec2: height, velocity).
 * @param {*} options.states_for_write - Storage texture to write updated wave state.
 * @param {*} [options.padding=0] - Padding texels around the effective region to avoid boundary artifacts.
 * @param {*} [options.speed=0.5] - Wave propagation speed (uvspace units per second).
 * @param {*} [options.damping=0.1] - Damping factor (decay rate per second).
 * @param {*} [options.impulse_enabled=true] - Whether external impulses are applied.
 * @param {*} [options.impulse_strength=4] - Strength of the impulse force.
 * @param {*} [options.impulse_radius=0.1] - Radius of impulse influence (uvspace units).
 * @param {*} [options.impulse_position=(0,0)] - Position of impulse (uvspace coordinates).
 * @param {*} [options.timestep=0.016] - Simulation timestep in seconds. (clamped by 0.016 internally for stabiliity)
 * @returns {*} A compute kernel function that updates the wave state when dispatched.
 * @example
 * ```
 * const s0 = new THREE.StorageTexture(32, 32)
 * const s1 = new THREE.StorageTexture(32, 32)
 * s0.type = s1.type = THREE.FloatType
 * s0.generateMipmaps = s1.generateMipmaps = false
 * s0.minFilter = s1.minFilter = THREE.NearestFilter
 * s0.magFilter = s1.magFilter = THREE.NearestFilter
 *
 * const kernel = compute_wave2d_kernel({ states_for_read: s0, states_for_write: s1 })
 * renderer.compute(kernel)
 * ```
 * @private
 */
const compute_wave2d_kernel = ({
  states_for_read,
  states_for_write,
  padding = 0,
  speed = 0.5,
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
  timestep = $.float(timestep) //.min(0.016).toConst()
  const working_size = states_for_read.width
  const effective_to_working_scale = $.float((working_size - 2 * padding) / working_size).toConst()
  const working_impulse_radius = impulse_radius.mul(effective_to_working_scale)
  const working_impulse_position = impulse_position.sub(0.5).mul(effective_to_working_scale).add(0.5)
  const working_speed = speed.mul(effective_to_working_scale)
  const h_sampler = (uv01) => $.texture(states_for_read, uv01).r
  const kernel = write_texture2d_kernel(states_for_write, (working_uv01) => {
    const laplacian_h = central_difference_laplacian2d(h_sampler, working_uv01, 1 / working_size)
    const accel_per_second = $.mul(working_speed.pow2(), laplacian_h, timestep)
    const impulse_fac = $.smoothstep(working_impulse_radius, 0, working_uv01.distance(working_impulse_position))
    const impulse_per_second = $.mul(impulse_fac, impulse_strength, timestep, impulse_enabled)
    const damping_per_second = $.exp(damping.mul(timestep).negate())
    const current_states = $.texture(states_for_read, working_uv01).toConst()
    const [h, v] = [current_states.r, current_states.g]
    const v1 = $.add(v, accel_per_second, impulse_per_second).mul(damping_per_second)
    const h1 = $.add(h, v1.mul(timestep))
    return $.vec2(h1, v1)
  })
  return kernel
}

/**
 * Creates a 2D wave simulation context using ping-pong storage textures and compute kernels.
 * Results are copied to a filterable texture for smooth wave output from low‑res working textures.
 *
 * Returns wave simulation context:
 * - update(timestep) = advances simulation by given elapsed time, internally split into fixed substeps (0.016s)
 * - sample(uv)       = samples the current wave state at given uv coordinates, returning a vec2(height, velocity)
 * - dispose()        = releases GPU resources associated with the simulation
 *
 * Notes:
 * - Wave states height/velocity range depends on settings, not normalized.
 * - All uv-related settings are measured in the effective region uvspace (padding ignored)
 *
 * @param {*} options - Configuration object.
 * @param {*} options.renderer - The renderer used to dispatch compute kernels.
 * @param {*} [options.size=32] - Edge length of the effective simulation region.
 * @param {*} [options.padding=4] - Extra texels added around the effective region to avoid boundary artifacts.
 * @param {*} [options.speed=0.1] - Wave propagation speed (uvspace units per second).
 * @param {*} [options.damping=0.1] - Damping factor (decay rate per second).
 * @param {*} [options.impulse_enabled=true] - Whether external impulses are applied.
 * @param {*} [options.impulse_strength=4] - Strength of the impulse force.
 * @param {*} [options.impulse_radius=0.1] - Radius of impulse influence (uvspace units).
 * @param {*} [options.impulse_position=(0,0)] - Position of impulse (uvspace coordinates).
 * @returns {*} Wave simulation context.
 *
 * @example
 * ```
 * const impulse_position = vec2(oscSine(time))
 * const wave = create_wave2d_context({ renderer, impulse_position })
 * mat.colorNode = wave.sample(uv()).r.remap(-1, 1, 0, 1)
 * renderer.setAnimationLoop(() => {
 *   wave.update()
 *   renderer.render(scene, camera)
 * })
 * ```
 */
export const create_wave2d_context = ({
  renderer,
  size = 32,
  padding = 4,
  speed = 0.5,
  damping = 0.1,
  impulse_enabled = true,
  impulse_strength = 4,
  impulse_radius = 0.1,
  impulse_position = $.vec2(0, 0)
}) => {
  // https://www.w3.org/TR/webgpu/#texture-format-caps
  const [texture_format, texture_type] = renderer.backend.device.features.has('texture-formats-tier1')
    ? [THREE.RGFormat, THREE.HalfFloatType]
    : [THREE.RGBAFormat, THREE.HalfFloatType]

  const working_size = size + 2 * padding
  const states0 = new THREE.StorageTexture(working_size, working_size)
  const states1 = new THREE.StorageTexture(working_size, working_size)
  states0.format = states1.format = texture_format
  states0.type = states1.type = texture_type
  states0.generateMipmaps = states1.generateMipmaps = false
  states0.minFilter = states1.minFilter = THREE.NearestFilter
  states0.magFilter = states1.magFilter = THREE.NearestFilter

  const effective_size = size
  const states = new THREE.StorageTexture(effective_size, effective_size)
  states.format = texture_format
  states.type = texture_type
  states.generateMipmaps = true
  states.minFilter = THREE.LinearFilter
  states.magFilter = THREE.LinearFilter

  const kernel_options = {
    padding,
    speed: $.uniform('float'),
    damping,
    impulse_enabled,
    impulse_strength,
    impulse_radius,
    impulse_position,
    timestep: $.uniform('float')
  }
  const ping = compute_wave2d_kernel({ ...kernel_options, states_for_read: states0, states_for_write: states1 })
  const pong = compute_wave2d_kernel({ ...kernel_options, states_for_read: states1, states_for_write: states0 })
  const effective_region = new THREE.Box2(
    new THREE.Vector2(padding, padding),
    new THREE.Vector2(padding + effective_size, padding + effective_size)
  )

  // CFL stability condition for explicit wave update:
  //   speed * dt / dx <= 1
  // Use a safety margin (0.34 < 1) to avoid edge‑case instability.
  //
  // Implementation detail:
  // - safe_speed = clamp user `speed` so CFL ratio never exceeds margin.
  // - if `speed` > safe_speed, split update into multiple substeps.
  //    Each substep uses safe_speed, so overall propagation matches `speed`.
  const CFL_MARGIN = 0.34
  let pingpong = 0
  const update = (timestep = 0.016) => {
    const safe_speed = Math.min(speed, CFL_MARGIN / (working_size * timestep))
    const repeat_count = Math.ceil(speed / safe_speed)
    kernel_options.timestep.value = timestep
    kernel_options.speed.value = safe_speed
    for (let i = 0; i < repeat_count; ++i) {
      pingpong ^= 1
      renderer.compute(pingpong ? ping : pong)
    }
    queueMicrotask(() => renderer.backend.copyTextureToTexture(pingpong ? states0 : states1, states, effective_region))
  }

  const sample = (uv) => {
    return $.texture(states, uv).rg
  }

  const dispose = () => {
    states0.dispose()
    states1.dispose()
    states.dispose()
  }

  return { update, dispose, sample }
}
