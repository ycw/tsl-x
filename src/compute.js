import { TSL as $ } from 'three/webgpu'

/**
 * Create a compute kernel that writes values into a 2D storage texture.
 *
 * @param {*} tex - The 2D storage texture to write values into.
 * @param {*} f - A function mapping normalized UV coordinates to the value to be written.
 * @returns {*} The compute kernel. Call `renderer.compute(kernel)` to dispatch.
 *
 * @example
 * ```
 * const tex = new THREE.StorageTexture(128, 128)
 * tex.format = THREE.RedFormat
 * tex.type = THREE.FloatType
 * const kernel = write_texture2d_kernel(tex, uv => mx_noise_float(uv))
 * renderer.compute(kernel)
 * ```
 */
export const write_texture2d_kernel = (tex, f) => {
  const bounds = $.vec2(tex.width, tex.height).sub(1).max(1)
  const kernel = $.Fn(() => {
    const index2d = $.vec2(
      $.instanceIndex.mod(tex.width),
      $.instanceIndex.div(tex.width)
    )
    const uv01 = index2d.div(bounds)
    const value = f(uv01)
    $.textureStore(tex, $.uvec2(index2d), value)
  })().compute(tex.width * tex.height)
  return kernel
}

/**
 * Create a compute kernel that writes values into a 3D storage texture.
 *
 * @param {*} tex - The 3D storage texture to write values into.
 * @param {*} f - A function mapping normalized UVW coordinates to the value to be written.
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
  const bounds = $.vec3(tex.width, tex.height, tex.depth).sub(1).max(1)
  const kernel = $.Fn(() => {
    const index3d = $.vec3(
      $.instanceIndex.mod(tex.width),
      $.instanceIndex.div(tex.width).mod(tex.height),
      $.instanceIndex.div(tex.width * tex.height)
    )
    const uvw01 = index3d.div(bounds)
    const value = f(uvw01)
    $.textureStore(tex, $.uvec3(index3d), value)
  })().compute(tex.width * tex.height * tex.depth)
  return kernel
}
