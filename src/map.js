import { TSL as $ } from 'three/webgpu'

//
// Smootherstep
//

/**
 * Smootherstep interpolation function.
 *
 * Maps input `k` between `edge0` and `edge1` to a smooth curve in [0, 1],
 * with continuous first and second derivatives at the boundaries.
 *
 * @param {*} edge0 - Lower edge (`float/vec2/vec3/vec4`).
 * @param {*} edge1 - Upper edge (`float/vec2/vec3/vec4`).
 * @param {*} k - Input value (`float/vec2/vec3/vec4`).
 * @returns {*} Output in [0, 1], same type as k.
 */
export const smootherstep = $.Fn(([edge0, edge1, k]) => {
  const diff = edge1.sub(edge0)
  k = k.sub(edge0).div(diff.abs()).clamp(0, 1)
  const poly01 = k.pow3().mul(k.mul(k.mul(6).sub(15)).add(10))
  const is_reversed = diff.lessThan(0)
  const interpolated01 = $.select(is_reversed, poly01.oneMinus(), poly01)
  return interpolated01
})

//
// Mirrored repeat
//

/**
 * Mirrored repeat ramp with output normalized to [0, 1].
 *
 * @param {*} k - Input value (`float/vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Output in [0, 1], same type as k.
 */
export const mirrored_repeat01 = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const ramp01 = k.mod(half_period).div(half_period)
  const is_odd_half = k.div(half_period).mod(2).floor()
  const mirrored01 = $.select(is_odd_half, ramp01.oneMinus(), ramp01)
  return mirrored01
})

/**
 * Mirrored repeat ramp with mirrored output values.
 *
 * @param {*} k - Input value (`float/vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Mirrored output, same type as k.
 */
export const mirrored_repeat = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const mirrored01 = mirrored_repeat01(k, half_period)
  return mirrored01.mul(half_period)
})

/**
 * Mirrored repeat ramp with output normalized to [0, 1], using smoothstep easing.
 *
 * @param {*} k - Input value (`float/vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Output in [0, 1] with soft transitions, same type as k.
 */
export const mirrored_repeat_smooth01 = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const ramp01 = $.smoothstep(0, half_period, k.mod(half_period))
  const is_odd_half = k.div(half_period).mod(2).floor()
  const mirrored01 = $.select(is_odd_half, ramp01.oneMinus(), ramp01)
  return mirrored01
})

/**
 * Mirrored repeat ramp with mirrored output values, using smoothstep easing.
 *
 * @param {*} k - Input value (`float/vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Mirrored output with soft transitions, same type as k.
 */
export const mirrored_repeat_smooth = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const mirrored01 = mirrored_repeat_smooth01(k, half_period)
  return mirrored01.mul(half_period)
})

/**
 * Mirrored repeat ramp with output normalized to [0, 1], using smootherstep easing.
 *
 * @param {*} k - Input value (`float/vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Output in [0, 1] with smoother transitions (continuous derivatives), same type as k.
 */
export const mirrored_repeat_smoother01 = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const ramp01 = smootherstep(0, half_period, k.mod(half_period))
  const is_odd_half = k.div(half_period).mod(2).floor()
  const mirrored01 = $.select(is_odd_half, ramp01.oneMinus(), ramp01)
  return mirrored01
})

/**
 * Mirrored repeat ramp with mirrored output values, using smootherstep easing.
 *
 * @param {*} k - Input value (`float/vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Mirrored output with smoother transitions (continuous derivatives), same type as k.
 */
export const mirrored_repeat_smoother = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const mirrored01 = mirrored_repeat_smoother01(k, half_period)
  return mirrored01.mul(half_period)
})

//
// 2D Cartesian <-> 2D Polar
//

/**
 * Convert 2D Cartesian coordinates to 2D polar coordinates.
 *
 * 2D polar coordinates convention:
 * - x = radius, distance from origin
 * - y = angle in radians, measured counter-clockwise from the +X axis, range [-PI, PI]
 *
 * @param {*} cartesian2d - Input 2D Cartesian coordinates.
 * @param {*} [origin=(0,0)] - Origin of the polar system.
 * @returns {*} 2D polar coordinates.
 */
export const cartesian2d_to_polar2d = $.Fn(([cartesian2d, origin = $.vec2(0, 0)]) => {
  cartesian2d = $.vec2(cartesian2d)
  origin = $.vec2(origin)
  const offset = cartesian2d.sub(origin)
  const radius = $.length(offset)
  const theta = $.atan(offset.y, offset.x)
  const polar2d = $.vec2(radius, theta)
  return polar2d
})

/**
 * Convert 2D polar coordinates to 2D Cartesian coordinates.
 *
 * 2D polar coordinates convention:
 * - x = radius, distance from origin
 * - y = angle in radians, measured counter‑clockwise from the +X axis, range [-PI, PI]
 *
 * @param {*} polar2d - Input 2D polar coordinates.
 * @param {*} [origin=(0,0)] - Origin of the Cartesian system.
 * @returns {*} 2D Cartesian coordinates.
 */
export const polar2d_to_cartesian2d = $.Fn(([polar2d, origin = $.vec2(0, 0)]) => {
  polar2d = $.vec2(polar2d)
  origin = $.vec2(origin)
  const radius = polar2d.x
  const theta = polar2d.y
  const x = $.cos(theta).mul(radius)
  const y = $.sin(theta).mul(radius)
  const cartesian2d = $.vec2(x, y).add(origin)
  return cartesian2d
})

/**
 * Convert 2D Cartesian coordinates to 2D polar coordinates with normalized angle.
 *
 * 2D polar coordinates with normalized angle convention:
 * - x = radius, distance from origin
 * - y = angle in [0, 1], obtained by remapping radians from [-PI, PI]
 *
 * @param {*} cartesian2d - Input 2D Cartesian coordinates.
 * @param {*} [origin=(0,0)] - Origin of the polar system.
 * @returns {*} 2D polar coordinates with normalized angle.
 */
export const cartesian2d_to_polar2d01 = $.Fn(([cartesian2d, origin = $.vec2(0, 0)]) => {
  cartesian2d = $.vec2(cartesian2d)
  origin = $.vec2(origin)
  const polar2d = cartesian2d_to_polar2d(cartesian2d, origin)
  const radius = polar2d.x
  const theta01 = polar2d.y.remap(-Math.PI, Math.PI, 0, 1)
  const polar2d01 = $.vec2(radius, theta01)
  return polar2d01
})

/**
 * Convert 2D polar coordinates with normalized angle to 2D Cartesian coordinates.
 *
 * 2D polar coordinates with normalized angle convention:
 * - x = radius, distance from origin
 * - y = angle in [0, 1], obtained by remapping radians from [-PI, PI]
 *
 * @param {*} polar2d - Input 2D polar coordinates with normalized angle.
 * @param {*} [origin=(0,0)] - Origin of the Cartesian system.
 * @returns {*} 2D Cartesian coordinates
 */
export const polar2d01_to_cartesian2d = $.Fn(([polar2d01, origin = $.vec2(0, 0)]) => {
  polar2d01 = $.vec2(polar2d01)
  origin = $.vec2(origin)
  const radius = polar2d01.x
  const theta = polar2d01.y.remap(0, 1, -Math.PI, Math.PI)
  const polar2d = $.vec2(radius, theta)
  const cartesian2d = polar2d_to_cartesian2d(polar2d)
  return cartesian2d
})

//
// 3D Cartesian <-> 3D Spherical
//

/**
 * Convert 3D Cartesian coordinates to 3D spherical coordinates.
 *
 * 3D spherical coordinates convention:
 * - x = radius, distance from origin
 * - y = azimuth, angle in xz-plane from +Z toward +X, range [-PI, PI]
 * - z = inclination, angle down from +Y axis, range [0, PI]
 *
 * @param {*} cartesian3d - Input 3D Cartesian coordinates.
 * @param {*} [origin=(0,0,0)] - Origin of the spherical system.
 * @returns {*} 3D spherical coordinates.
 */
export const cartesian3d_to_spherical3d = $.Fn(([cartesian3d, origin = $.vec3(0, 0, 0)]) => {
  cartesian3d = $.vec3(cartesian3d)
  origin = $.vec3(origin)
  const offset = cartesian3d.sub(origin)
  const radius = $.length(offset)
  const azimuth = $.atan(offset.x, offset.z)
  const inclination = $.acos(offset.y.div(radius))
  const spherical3d = $.vec3(radius, azimuth, inclination)
  return spherical3d
})

/**
 * Convert 3D spherical coordinates to 3D Cartesian coordinates.
 *
 * 3D spherical coordinates convention:
 * - x = radius, distance from origin
 * - y = azimuth, angle in xz-plane from +Z toward +X, range [-PI, PI]
 * - z = inclination, angle down from +Y axis, range [0, PI]
 *
 * @param {*} spherical3d - Input 3D spherical coordinates.
 * @param {*} [origin=(0,0,0)] - Origin of the Cartesian system.
 * @returns {*} 3D Cartesian coordinates.
 */
export const spherical3d_to_cartesian3d = $.Fn(([spherical3d, origin = $.vec3(0, 0, 0)]) => {
  spherical3d = $.vec3(spherical3d)
  origin = $.vec3(origin)
  const radius = spherical3d.x
  const azimuth = spherical3d.y
  const inclination = spherical3d.z
  const y = radius.mul($.cos(inclination))
  const x = radius.mul($.sin(inclination)).mul($.sin(azimuth))
  const z = radius.mul($.sin(inclination)).mul($.cos(azimuth))
  const cartesian3d = $.vec3(x, y, z).add(origin)
  return cartesian3d
})

/**
 * Convert 3D Cartesian coordinates to 3D spherical coordinates with normalized angles.
 *
 * 3D spherical coordinates with normalized angles convention:
 * - x = radius, distance from origin
 * - y = azimuth, normalized angle in xz-plane from -Z toward -X, range [0, 1] obtained by remapping radians from [-PI, PI]
 * - z = inclination, normalized angle down from +Y axis, range [0, 1] obtained by remapping radians from [0, PI]
 *
 * @param {*} cartesian3d - Input 3D Cartesian coordinates.
 * @param {*} [origin=(0,0,0)] - Origin of the spherical system.
 * @returns {*} 3D spherical coordinates with normalized angles.
 */
export const cartesian3d_to_spherical3d01 = $.Fn(([cartesian3d, origin = $.vec3(0, 0, 0)]) => {
  cartesian3d = $.vec3(cartesian3d)
  origin = $.vec3(origin)
  const spherical3d = cartesian3d_to_spherical3d(cartesian3d, origin)
  const radius = spherical3d.x
  const azimuth01 = spherical3d.y.remap(-Math.PI, Math.PI, 0, 1)
  const inclination01 = spherical3d.z.remap(0, Math.PI, 0, 1)
  const spherical3d01 = $.vec3(radius, azimuth01, inclination01)
  return spherical3d01
})

/**
 * Convert 3D spherical coordinates with normalized angles to 3D Cartesian coordinates.
 *
 * 3D spherical coordinates with normalized angles convention:
 * - x = radius, distance from origin
 * - y = azimuth, normalized angle in xz-plane from -Z toward -X, range [0, 1] obtained by remapping radians from [-PI, PI]
 * - z = inclination, normalized angle down from +Y axis, range [0, 1] obtained by remapping radians from [0, PI]
 *
 * @param {*} spherical3d01 - Input 3D spherical coordinates.
 * @param {*} [origin=(0,0,0)] - Origin of the Cartesian system.
 * @returns {*} 3D Cartesian coordinates.
 */
export const spherical3d01_to_cartesian3d = $.Fn(([spherical3d01, origin = $.vec3(0, 0, 0)]) => {
  spherical3d01 = $.vec3(spherical3d01)
  origin = $.vec3(origin)
  const radius = spherical3d01.x
  const azimuth = spherical3d01.y.remap(0, 1, -Math.PI, Math.PI)
  const inclination = spherical3d01.z.remap(0, 1, 0, Math.PI)
  const spherical3d = $.vec3(radius, azimuth, inclination)
  const cartesian3d = spherical3d_to_cartesian3d(spherical3d, origin)
  return cartesian3d
})

//
// 3D Cartesian <-> 2D Octahedral
//  Ref: https://jcgt.org/published/0003/02/01/ (Full-Text PDF, Page 13)
//

/**
 * Return the sign of each component of a 2D vector, treating zero as positive.
 *
 * Used internally for octahedral encoding/decoding helpers.
 *
 * @param {*} v - Input 2D vector.
 * @returns {*} 2D vector with components in { -1, 1 }.
 * @private
 */
const sign_not_zero = $.Fn(([v]) => {
  v = $.vec2(v)
  return $.vec2(
    $.select(v.x.greaterThanEqual(0), 1, -1),
    $.select(v.y.greaterThanEqual(0), 1, -1)
  )
})

/**
 * Encode a normalized 3D Cartesian vector into 2D octahedral coordinates.
 *
 * Input must be a normalized 3D vector (length = 1).
 * Output is a 2D vector in the range [-1, 1] for each component,
 * representing the octahedral mapping of the input direction.
 *
 * This encoding is commonly used for storing normals in 2D textures
 * with minimal distortion.
 *
 * @param {*} v - Normalized 3D vector in Cartesian coordinates (length = 1).
 * @returns {*} Octahedral-encoded 2D vector in [-1, 1]^2.
 *
 * @example
 * ```
 * const uv01s = cartesian3d01_to_octahedral2d01s(dir) // snorm [-1, 1]
 * ```
 */
export const cartesian3d01_to_octahedral2d01s = $.Fn(([v]) => {
  v = $.vec3(v)
  const p = v.xy.mul(
    v.x.abs().add(v.y.abs()).add(v.z.abs()).reciprocal()
  )
  return $.select(
    v.z.lessThanEqual(0),
    p.yx.abs().oneMinus().mul(sign_not_zero(p)),
    p
  )
})

/**
 * Decode a 2D octahedral-encoded vector back into a normalized 3D Cartesian vector.
 *
 * Input must be a 2D vector in the range [-1, 1]^2,
 * representing an octahedral encoding of a unit vector.
 * Output is a normalized 3D vector (length = 1) in Cartesian coordinates.
 *
 * This decoding is commonly used to reconstruct normals stored in octahedral form.
 *
 * @param {*} e - Octahedral-encoded 2D vector in [-1, 1]^2.
 * @returns {*} Normalized 3D vector in Cartesian coordinates (length = 1).
 *
 * @example
 * ```
 * const dir = octahedral2d01s_to_cartesian3d01(uv01s) // normalized 3D vector
 * ```
 */
export const octahedral2d01s_to_cartesian3d01 = $.Fn(([e]) => {
  e = $.vec2(e)
  const v = $.vec3(e.xy, $.float(1.0).sub(e.x.abs()).sub(e.y.abs()))
  const xy = $.select(
    v.z.lessThan(0),
    v.yx.abs().oneMinus().mul(sign_not_zero(v.xy)),
    v.xy
  )
  const cartesian3d01 = $.vec3(xy, v.z).normalize()
  return cartesian3d01
})

/**
 * Encode a normalized 3D Cartesian vector into 2D octahedral coordinates in [0,1]^2.
 *
 * Input must be a normalized 3D vector (length = 1).
 * Output is a 2D vector in the range [0,1] for each component,
 * suitable for storage in textures.
 *
 * @param {*} v - Normalized 3D vector in Cartesian coordinates (length = 1).
 * @returns {*} Octahedral-encoded 2D vector in [0,1]^2.
 *
 * @example
 * ```
 * const uv01 = cartesian3d01_to_octahedral2d01(dir) // norm [0, 1]
 * ```
 */
export const cartesian3d01_to_octahedral2d01 = $.Fn(([v]) => {
  v = $.vec3(v)
  const octahedral2d01s = cartesian3d01_to_octahedral2d01s(v)
  const octahedral2d01 = octahedral2d01s.remap(-1, 1, 0, 1)
  return octahedral2d01
})

/**
 * Decode a 2D octahedral-encoded vector in [0,1]^2 back into a normalized 3D Cartesian vector.
 *
 * Input must be a 2D vector in the range [0,1]^2,
 * representing an octahedral encoding of a unit vector.
 * Output is a normalized 3D vector (length = 1) in Cartesian coordinates.
 *
 * @param {*} e - Octahedral-encoded 2D vector in [0,1]^2.
 * @returns {*} Normalized 3D vector in Cartesian coordinates (length = 1).
 *
 * @example
 * ```
 * const dir = octahedral2d01_to_cartesian3d01(uv01) // normalized 3D vector
 * ```
 */
export const octahedral2d01_to_cartesian3d01 = $.Fn(([e]) => {
  e = $.vec2(e)
  const octahedral2d01s = e.remap(0, 1, -1, 1)
  const cartesian3d = octahedral2d01s_to_cartesian3d01(octahedral2d01s)
  return cartesian3d
})

//
// 2D Cartesian <-> 4D Hemisphere (normal, signed distance)
//

/**
 * Convert normalized 2D Cartesian coordinates into 4D hemisphere vector.
 *
 * 4D hemisphere vector convention:
 * - xyz = normalized hemisphere normal pointing towards +Z
 * - w   = signed distance in [-1, inf) from the unit circle boundary in the XY-plane
 *         (w < 0 means inside; xyz corresponds to the boundary normal if outside)
 *
 * @param {*} cartesian2d01 - Input normalized 2D Cartesian coordinates.
 * @returns {*} 4D hemisphere vector.
 */
export const cartesian2d01_to_hemisphere4d = $.Fn(([cartesian2d01]) => {
  cartesian2d01 = $.vec2(cartesian2d01)
  const uv01s = cartesian2d01.remap(0, 1, -1, 1)
  const r_sq = $.lengthSq(uv01s) // x^2 + y^2
  const r_sq_clamped = r_sq.min(1)
  const z = $.sqrt(r_sq_clamped.oneMinus()) // since x^2 + y^2 + z^2 = 1 (unit sphere)
  const normal = $.vec3(uv01s, z).normalize() // ensure precision
  const r = r_sq.sqrt()
  const signed_distance = r.sub(1)
  const hemisphere4d = $.vec4(normal, signed_distance)
  return hemisphere4d
})

/**
 * Convert a 4D hemisphere vector back into normalized 2D Cartesian coordinates.
 *
 * 4D hemisphere vector convention:
 * - xyz = normalized hemisphere normal pointing towards +Z
 * - w   = signed distance in [-1, inf) from the unit circle boundary in the XY-plane
 *         (w < 0 means inside; xyz corresponds to the boundary normal if outside)
 *
 * @param {*} hemisphere4d - Input 4D hemisphere vector.
 * @returns {*} Normalized 2D Cartesian coordinates.
 */
export const hemisphere4d_to_cartesian2d01 = $.Fn(([hemisphere4d]) => {
  hemisphere4d = $.vec4(hemisphere4d)
  const r = hemisphere4d.w.add(1)
  const dir = hemisphere4d.xy.normalize()
  const cartesian2d01 = r.mul(dir).remap(-1, 1, 0, 1)
  return cartesian2d01
})
