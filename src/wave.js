import * as THREE from 'three/webgpu'
import { TSL as $ } from 'three/webgpu'
import { compute_wave2d_kernel } from './compute.js'

/**
 * Creates a 2D wave simulation context backed by storage textures.
 *
 * The returned context object exposes:
 * - `update()`   = advances the simulation (with substeps).
 * - `sample(uv)` = sample the latest wave state (.r = height, .g = velocity).
 * - `dispose()`  = releases GPU resources.
 *
 * @param {*} options - Configuration object.
 * @param {*} options.renderer - The compute‑capable renderer instance.
 * @param {*} [options.resolution=[64,64]] - Texture resolution [width, height].
 * @param {*} [options.substeps=4] - Number of simulation substeps per update.
 * @param {*} [options.uvspace_propagation_per_second=0.1] - Wave propagation speed in UV space.
 * @param {*} [options.damping_per_second=0.1] - Damping factor per second.
 * @param {*} [options.impulse_enabled=true] - Whether to apply an impulse force.
 * @param {*} [options.impulse_per_second=4] - Impulse strength per second.
 * @param {*} [options.uvspace_impulse_radius=0.1] - Impulse radius in UV space.
 * @param {*} [options.uvspace_impulse_position=(0,0)] - Impulse position in UV space.
 * @param {*} [options.delta_time_in_seconds=0.016] - Simulation timestep in seconds.
 * @returns {*} A wave simulation context object.
 *
 * @example
 * ```
 * const uvspace_impulse_position = vec2(oscSine(time))
 * const ctx = create_wave2d_context({ renderer, uvspace_impulse_position })
 * const h = texture(wave_ctx.texture, uv()).r
 * mat.colorNode = h.remap(-1, 1, 0, 1)   // in-range depends on damping and impulse
 * renderer.setAnimationLoop(() => {
 *   ctx.update()
 *   renderer.render(scene, camera)
 * })
 * ```
 */
export const create_wave2d_context = ({
  renderer,
  resolution = [64, 64],
  substeps = 4,
  uvspace_propagation_per_second = 0.1,
  damping_per_second = 0.1,
  impulse_enabled = true,
  impulse_per_second = 4,
  uvspace_impulse_radius = 0.1,
  uvspace_impulse_position = $.vec2(0, 0),
  delta_time_in_seconds = 0.016
}) => {
  const storage_texture_current = new THREE.StorageTexture(...resolution)
  storage_texture_current.type = THREE.FloatType
  storage_texture_current.generateMipmaps = false
  storage_texture_current.minFilter = THREE.NearestFilter
  storage_texture_current.magFilter = THREE.NearestFilter

  const storage_texture_next = new THREE.StorageTexture(...resolution)
  storage_texture_next.type = THREE.FloatType
  storage_texture_next.generateMipmaps = false
  storage_texture_next.minFilter = THREE.NearestFilter
  storage_texture_next.magFilter = THREE.NearestFilter

  const storage_texture_next_filterable = new THREE.StorageTexture(...resolution)
  storage_texture_next_filterable.type = THREE.FloatType
  storage_texture_next_filterable.generateMipmaps = true
  storage_texture_next_filterable.minFilter = THREE.LinearFilter
  storage_texture_next_filterable.magFilter = THREE.LinearFilter

  const wave2d_kernel = compute_wave2d_kernel({
    storage_texture_current,
    storage_texture_next,
    uvspace_propagation_per_second,
    damping_per_second,
    impulse_enabled,
    impulse_per_second,
    uvspace_impulse_radius,
    uvspace_impulse_position,
    delta_time_in_seconds
  })
  const update = () => {
    for (let i = 0; i < substeps; ++i) {
      renderer.compute(wave2d_kernel)
      renderer.backend.copyTextureToTexture(storage_texture_next, storage_texture_current)
    }
    queueMicrotask(() => {
      renderer.backend.copyTextureToTexture(storage_texture_next, storage_texture_next_filterable)
    })
  }
  const dispose = () => {
    storage_texture_current.dispose()
    storage_texture_next.dispose()
    storage_texture_next_filterable.dispose()
  }
  const sample = (uv) => {
    const uv_bias = $.vec2(1 / resolution[0], 1 / resolution[1])
    return $.texture(storage_texture_next_filterable, uv.sub(uv_bias))
  }
  return { update, dispose, sample }
}
