import { TSL as $ } from 'three/webgpu'

/**
 * Apply mirrored repeat, mapping input into [0,1] with symmetry.
 *
 * @param {*} coordinate - Float or Vec2/Vec3/Vec4
 * @returns {*} Same type as input, mirrored into [0,1]
 */
export const mirrored_repeat = (coordinate) => {
  return coordinate.mod(2).sub(1).abs().oneMinus()
}

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
