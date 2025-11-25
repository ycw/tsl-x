import { TSL as $ } from 'three/webgpu'

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
    ).toConst()
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
    ).toConst()
    const uvw01 = index3d.div(bounds)
    const value = f(uvw01, index3d, size3d)
    $.textureStore(tex, $.uvec3(index3d), value)
  })().compute(tex.width * tex.height * tex.depth)
  return kernel
}
