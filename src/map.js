import { TSL as $ } from 'three/webgpu'

//
// Smootherstep
//

/**
 * Smootherstep interpolation function.
 *
 * Maps input `k` between `edge0` and `edge1` to a smooth curve in [0,1],
 * with continuous first and second derivatives at the boundaries.
 *
 * @param {*} edge0 - Lower edge (`float` or `vec2/vec3/vec4`).
 * @param {*} edge1 - Upper edge (`float` or `vec2/vec3/vec4`).
 * @param {*} k - Input value (`float` or `vec2/vec3/vec4`).
 * @returns {*} Output in [0,1], same type as k.
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
 * Mirrored repeat ramp with output normalized to [0,1].
 *
 * @param {*} k - Input value (`float` or `vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Output in [0,1], same type as k.
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
 * @param {*} k - Input value (`float` or `vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Mirrored output, same type as k.
 */
export const mirrored_repeat = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const mirrored01 = mirrored_repeat01(k, half_period)
  return mirrored01.mul(half_period)
})

/**
 * Mirrored repeat ramp with output normalized to [0,1], using smoothstep easing.
 *
 * @param {*} k - Input value (`float` or `vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Output in [0,1] with soft transitions, same type as k.
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
 * @param {*} k - Input value (`float` or `vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Mirrored output with soft transitions, same type as k.
 */
export const mirrored_repeat_smooth = $.Fn(([k, half_period = 1]) => {
  half_period = $.float(half_period)
  const mirrored01 = mirrored_repeat_smooth01(k, half_period)
  return mirrored01.mul(half_period)
})

/**
 * Mirrored repeat ramp with output normalized to [0,1], using smootherstep easing.
 *
 * @param {*} k - Input value (`float` or `vec2/vec3/vec4`).
 * @param {*} [half_period=1] - Distance to the turning point where the ramp flips direction.
 * @returns {*} Output in [0,1] with smoother transitions (continuous derivatives), same type as k.
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
 * @param {*} k - Input value (`float` or `vec2/vec3/vec4`).
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
 * @param {*} coordinate - Input Vec2 (x, y) in Cartesian space.
 * @param {*} [origin=(0, 0)] - Origin of the polar system.
 * @returns {*} Vec2 (r, theta)
 *   - r: radius, distance from origin
 *   - theta: angle in radians, measured counter‑clockwise from the +x axis, range [-PI, PI]
 */
export const cartesian2d_to_polar2d = $.Fn(([coordinate, origin = $.vec2(0, 0)]) => {
  coordinate = $.vec2(coordinate)
  origin = $.vec2(origin)
  const offset = coordinate.sub(origin)
  const r = $.length(offset)
  const theta = $.atan(offset.y, offset.x)
  return $.vec2(r, theta)
})

/**
 * Convert 2D polar coordinates to 2D Cartesian coordinates.
 *
 * @param {*} coordinate - Input Vec2 (r, theta) in polar space.
 *   - r: radius, distance from origin
 *   - theta: angle in radians, measured counter‑clockwise from the +x axis, range [-PI, PI]
 * @param {*} [origin=(0, 0)] - Origin of the Cartesian system.
 * @returns {*} Vec2 (x, y) in Cartesian space
 */
export const polar2d_to_cartesian2d = $.Fn(([coordinate, origin = $.vec2(0, 0)]) => {
  coordinate = $.vec2(coordinate)
  origin = $.vec2(origin)
  const r = coordinate.x
  const theta = coordinate.y
  const x = $.cos(theta).mul(r)
  const y = $.sin(theta).mul(r)
  return $.vec2(x, y).add(origin)
})

/**
 * Convert 2D Cartesian coordinates to polar coordinates with normalized angle.
 *
 * @param {*} coordinate - Input Vec2 (x, y) in Cartesian space.
 * @param {*} [origin=(0, 0)] - Origin of the polar system.
 * @returns {*} Vec2 (r, theta01)
 *   - r: radius, distance from origin
 *   - theta01: normalized angle, range 0 to 1 corresponds to -PI to +PI
 */
export const cartesian2d_to_polar2d01 = $.Fn(([coordinate, origin = $.vec2(0, 0)]) => {
  coordinate = $.vec2(coordinate)
  origin = $.vec2(origin)
  const polar2d = cartesian2d_to_polar2d(coordinate, origin)
  const r = polar2d.x
  const theta01 = polar2d.y.remap(-Math.PI, Math.PI, 0, 1)
  return $.vec2(r, theta01)
})

/**
 * Convert 2D polar coordinates with normalized angle to 2D Cartesian coordinates.
 *
 * @param {*} coordinate - Input Vec2 (r, theta01) in normalized polar space.
 *   - r: radius, distance from origin
 *   - theta01: normalized angle, range 0 to 1 corresponds to -PI to +PI
 * @param {*} [origin=(0, 0)] - Origin of the Cartesian system.
 * @returns {*} Vec2 (x, y) in Cartesian space
 */
export const polar2d01_to_cartesian2d = $.Fn(([coordinate, origin = $.vec2(0, 0)]) => {
  coordinate = $.vec2(coordinate)
  origin = $.vec2(origin)
  const r = coordinate.x
  const theta = coordinate.y.remap(0, 1, -Math.PI, Math.PI)
  const polar2d = $.vec2(r, theta)
  return polar2d_to_cartesian2d(polar2d)
})

//
// 3D Cartesian <-> 3D Spherical
//

/**
 * Convert 3D Cartesian coordinates to 3D spherical coordinates.
 *
 * @param {*} coordinate - Input Vec3 in Cartesian space (x, y, z).
 * @param {*} [origin=(0,0,0)] - Origin of the spherical system.
 * @returns {*} Vec3 (r, azimuth, inclination)
 *   - r: radius, distance from origin
 *   - azimuth: angle in xz-plane from +z toward +x, range [-PI, PI]
 *   - inclination: angle down from +y axis, range [0, PI]
 */
export const cartesian3d_to_spherical3d = $.Fn(([coordinate, origin = $.vec3(0, 0, 0)]) => {
  coordinate = $.vec3(coordinate)
  origin = $.vec3(origin)
  const offset = coordinate.sub(origin)
  const r = $.length(offset)
  const azimuth = $.atan(offset.x, offset.z)
  const inclination = $.acos(offset.y.div(r))
  return $.vec3(r, azimuth, inclination)
})

/**
 * Convert 3D spherical coordinates to 3D Cartesian coordinates.
 *
 * @param {*} coordinate - Input Vec3 (r, azimuth, inclination)
 *   - r: radius, distance from origin
 *   - azimuth: angle in xz-plane from +z toward +x, range [-PI, PI]
 *   - inclination: angle down from +y axis, range [0, PI]
 * @param {*} [origin=(0,0,0)] - Origin of the Cartesian system
 * @returns {*} Vec3 (x, y, z) in Cartesian space
 */
export const spherical3d_to_cartesian3d = $.Fn(([coordinate, origin = $.vec3(0, 0, 0)]) => {
  coordinate = $.vec3(coordinate)
  origin = $.vec3(origin)
  const r = coordinate.x
  const azimuth = coordinate.y
  const inclination = coordinate.z
  const y = r.mul($.cos(inclination))
  const x = r.mul($.sin(inclination)).mul($.sin(azimuth))
  const z = r.mul($.sin(inclination)).mul($.cos(azimuth))
  return $.vec3(x, y, z).add(origin)
})

/**
 * Convert 3D Cartesian to 3D spherical coordinates with normalized angles.
 *
 * @param {*} coordinate - Input Vec3 in Cartesian space (x, y, z).
 * @param {*} [origin=(0,0,0)] - Origin of the spherical system.
 * @returns {*} Vec3 (r, azimuth01, inclination01)
 *   - r: radius
 *   - azimuth01: normalized azimuth, [0,1] maps to [-PI, PI]
 *   - inclination01: normalized inclination, [0,1] maps to [0, PI]
 */
export const cartesian3d_to_spherical3d01 = $.Fn(([coordinate, origin = $.vec3(0, 0, 0)]) => {
  coordinate = $.vec3(coordinate)
  origin = $.vec3(origin)
  const spherical_coordinate = cartesian3d_to_spherical3d(coordinate, origin)
  const r = spherical_coordinate.x
  const azimuth01 = spherical_coordinate.y.remap(-Math.PI, Math.PI, 0, 1)
  const inclination01 = spherical_coordinate.z.remap(0, Math.PI, 0, 1)
  return $.vec3(r, azimuth01, inclination01)
})

/**
 * Convert 3D spherical coordinates with normalized angles to 3D Cartesian coordinates.
 *
 * @param {*} coordinate - Input Vec3 (r, azimuth01, inclination01)
 *   - r: radius, distance from origin
 *   - azimuth01: normalized azimuth, [0,1] maps to [-PI, PI]
 *   - inclination01: normalized inclination, [0,1] maps to [0, PI]
 * @param {*} [origin=(0,0,0)] - Origin of the Cartesian system
 * @returns {*} Vec3 (x, y, z) in Cartesian space
 */
export const spherical3d01_to_cartesian3d = $.Fn(([coordinate, origin = $.vec3(0, 0, 0)]) => {
  coordinate = $.vec3(coordinate)
  origin = $.vec3(origin)
  const r = coordinate.x
  const azimuth = coordinate.y.remap(0, 1, -Math.PI, Math.PI)
  const inclination = coordinate.z.remap(0, 1, 0, Math.PI)
  return spherical3d_to_cartesian3d($.vec3(r, azimuth, inclination), origin)
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
 * const uv01s = cartesian3d01_to_octahedral2d01s(dir) // snorm [-1,1]
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
 * const uv01 = cartesian3d01_to_octahedral2d01(dir) // norm [0,1]
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
// 2D UV <-> 3D Hemisphere normal
//

/**
 * Convert [0,1] UV coordinates into a hemisphere normal (Z+).
 *
 * Returns a vec4 where:
 * - xyz = normalized hemisphere normal pointing towards +Z
 * - w   = signed distance from the unit circle boundary in the XY-plane
 *         (w < 0 means inside, w = 0 means on the boundary, w > 0 means outside)
 *
 * Notes:
 * - w is always greater than or equal to -1.
 * - When w is positive, xyz corresponds to the boundary normal.
 *
 * @param {*} uv01 - vec2, UV coordinates in [0,1] range
 * @returns {*} vec4, with xyz = hemisphere normal, w = signed distance
 */
export const uv01_to_hemisphere_normal4 = $.Fn(([uv01]) => {
  uv01 = $.vec2(uv01)
  const uv01s = uv01.remap(0, 1, -1, 1)
  const r_sq = $.lengthSq(uv01s) // x^2 + y^2
  const r_sq_clamped = r_sq.min(1)
  const z = $.sqrt(r_sq_clamped.oneMinus()) // since x^2 + y^2 + z^2 = 1 (unit sphere)
  const normal = $.vec3(uv01s, z).normalize() // ensure precision
  const r = r_sq.sqrt()
  const signed_distance = r.sub(1)
  return $.vec4(normal, signed_distance)
})

/**
 * Convert a hemisphere normal vec4 back into [0,1] UV coordinates.
 * - xyz = normalized hemisphere normal pointing towards +Z
 * - w   = signed distance from the unit circle boundary in the XY-plane
 *         (w < 0 means inside, w = 0 means on the boundary, w > 0 means outside)
 *
 * @param {*} normal4 - vec4, where xyz = hemisphere normal, w = signed distance
 * @returns {*} vec2, UV coordinates in [0,1] range
 */
export const hemisphere_normal4_to_uv01 = $.Fn(([normal4]) => {
  normal4 = $.vec4(normal4)
  const r = normal4.w.add(1)
  const dir = normal4.xy.normalize()
  const uv01 = r.mul(dir).remap(-1, 1, 0, 1)
  return uv01
})
