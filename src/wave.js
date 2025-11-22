import * as THREE from 'three/webgpu'
import { TSL as $ } from 'three/webgpu'
import { compute_wave2d_kernel } from './compute.js'

/**
 * Creates a 2D wave simulation context using ping-pong storage textures and compute kernels.
 *
 * Notes:
 * - The range of sampled height and velocity values is not fixed; it varies depending on
 *   damping and impulse configuration.
 *
 * @param {*} options - Configuration object.
 * @param {*} options.renderer - The renderer used to dispatch compute kernels.
 * @param {*} [options.substeps=2] - Number of simulation substeps per update call.
 * @param {*} [options.size=32] - Working texture size (simulation resolution).
 * @param {*} [options.padding=4] - Padding texels around the working area to avoid boundary artifacts.
 * @param {*} [options.speed=0.1] - Wave propagation speed (uvspace units per second).
 * @param {*} [options.damping=0.1] - Damping factor (decay rate per second).
 * @param {*} [options.impulse_enabled=true] - Whether external impulses are applied.
 * @param {*} [options.impulse_strength=4] - Strength of the impulse force.
 * @param {*} [options.impulse_radius=0.1] - Radius of impulse influence (uvspace units).
 * @param {*} [options.impulse_position=(0,0)] - Position of impulse in uvspace coordinates.
 * @param {*} [options.time_step=0.016] - Simulation timestep in seconds (clamped internally for stability).
 *
 * @returns {*} Wave simulation context.
 * @returns {*} return.update - Advances the simulation by `substeps` and copies results into the filterable texture.
 * @returns {*} return.sample - Samples the current wave state at given uv coordinates, returning a vec2(height, velocity).
 * @returns {*} return.dispose - Releases GPU resources associated with the simulation.
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
  substeps = 2,
  size = 32,
  padding = 4,
  speed = 0.1,
  damping = 0.1,
  impulse_enabled = true,
  impulse_strength = 4,
  impulse_radius = 0.1,
  impulse_position = $.vec2(0, 0),
  timestep = 0.016
}) => {
  const states0 = new THREE.StorageTexture(size + 2 * padding, size + 2 * padding)
  const states1 = new THREE.StorageTexture(size + 2 * padding, size + 2 * padding)
  states0.type = states1.type = THREE.FloatType
  states0.generateMipmaps = states1.generateMipmaps = false
  states0.minFilter = states1.minFilter = THREE.NearestFilter
  states0.magFilter = states1.magFilter = THREE.NearestFilter

  const states = new THREE.StorageTexture(size, size)
  states.type = THREE.FloatType
  states.generateMipmaps = true
  states.minFilter = THREE.LinearFilter
  states.magFilter = THREE.LinearFilter

  const c = { padding, speed, damping, impulse_enabled, impulse_strength, impulse_radius, impulse_position, timestep }
  const ping = compute_wave2d_kernel({ ...c, states_for_read: states0, states_for_write: states1 })
  const pong = compute_wave2d_kernel({ ...c, states_for_read: states1, states_for_write: states0 })
  const copy_region = new THREE.Box2(
    new THREE.Vector2(padding, padding),
    new THREE.Vector2(padding + size, padding + size)
  )

  let pingpong = 0
  const update = () => {
    for (let i = 0; i < substeps; ++i) {
      pingpong ^= 1
      renderer.compute(pingpong ? ping : pong)
    }
    queueMicrotask(() =>
      renderer.backend.copyTextureToTexture(
        pingpong ? states0 : states1,
        states,
        copy_region
      )
    )
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
