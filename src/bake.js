import { TSL as $ } from 'three/webgpu'

/**
 * Bake a 2D function into a texture using a compute shader.
 *
 * Each invocation corresponds to one texel in the target texture.
 * The callback `value_fn` receives a normalized UV coordinate (vec2 in [0,1]^2),
 * and should return the value to be stored at that texel.
 * 
 * Note: `target_texture` must have a minimum size of 1x1 (width >= 1, height >= 1).
 *
 * @param {*} renderer - The compute renderer used to dispatch the kernel.
 * @param {*} target_texture - The texture to store the baked values into.
 * @param {*} value_fn - A function mapping normalized UV coordinates to the value to be written
 *
 * @example
 * ```
 * const noise_texture = new THREE.StorageTexture(512, 512)
 * noise_texture.format = THREE.RedFormat
 * noise_texture.type = THREE.HalfFloatType
 * bake_texture2d(renderer, noise_texture, (uv) => {
 *   uv = uv.mul(4).fract()
 *   return mx_noise_float(uv)
 * })
 * ```
 */
export const bake_texture2d = (renderer, target_texture, value_fn) => {
  const texture_bounds = $.vec2(target_texture.width - 1, target_texture.height - 1)
  const kernel = $.Fn(() => {
    const index2d = $.vec2(
      $.instanceIndex.mod(target_texture.width), 
      $.instanceIndex.div(target_texture.width)
    )
    const uv01 = index2d.div(texture_bounds.max(1))
    const value = value_fn(uv01)
    $.textureStore(target_texture, $.uvec2(index2d), value)
  })().compute(target_texture.width * target_texture.height)
  renderer.compute(kernel)
}
