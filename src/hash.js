import { TSL } from 'three/webgpu'

const { Fn, uint, uvec3, floatBitsToUint } = TSL

const rot = Fn(([x, k]) => {
  return uint(x).shiftLeft(k).bitOr(uint(x).shiftRight(uint(32).sub(k)))
}).setLayout({
  name: 'YCW_rot',
  type: 'uint',
  inputs: [
    { name: 'x', type: 'uint' },
    { name: 'k', type: 'uint' }
  ]
})

const jenkins_mix = Fn(([a, b, c]) => {
  const A = uint(a).toVar()
  const B = uint(b).toVar()
  const C = uint(c).toVar()
  A.subAssign(C)
  A.bitXorAssign(rot(C, 4))
  C.addAssign(B)
  B.subAssign(A)
  B.bitXorAssign(rot(A, 6))
  A.addAssign(C)
  C.subAssign(B)
  C.bitXorAssign(rot(B, 8))
  B.addAssign(A)
  A.subAssign(C)
  A.bitXorAssign(rot(C, 16))
  C.addAssign(B)
  B.subAssign(A)
  B.bitXorAssign(rot(A, 19))
  A.addAssign(C)
  C.subAssign(B)
  C.bitXorAssign(rot(B, 4))
  B.addAssign(A)
  return uvec3(A, B, C)
}).setLayout({
  name: 'YCW_jenkins_mix',
  type: 'uvec3',
  inputs: [
    { name: 'a', type: 'uint' },
    { name: 'b', type: 'uint' },
    { name: 'c', type: 'uint' }
  ]
})

const jenkins_final = Fn(([a, b, c]) => {
  const A = uint(a).toVar()
  const B = uint(b).toVar()
  const C = uint(c).toVar()
  C.bitXorAssign(B)
  C.subAssign(rot(B, 14))
  A.bitXorAssign(C)
  A.subAssign(rot(C, 11))
  B.bitXorAssign(A)
  B.subAssign(rot(A, 25))
  C.bitXorAssign(B)
  C.subAssign(rot(B, 16))
  A.bitXorAssign(C)
  A.subAssign(rot(C, 4))
  B.bitXorAssign(A)
  B.subAssign(rot(A, 14))
  C.bitXorAssign(B)
  C.subAssign(rot(B, 24))
  return uvec3(A, B, C)
}).setLayout({
  name: 'YCW_jenkins_final',
  type: 'uvec3',
  inputs: [
    { name: 'a', type: 'uint' },
    { name: 'b', type: 'uint' },
    { name: 'c', type: 'uint' }
  ]
})

const jenkins_fold1 = Fn(([kx]) => {
  const a = uint().toVar()
  const b = uint().toVar()
  const c = uint().toVar()
  c.assign(uint(0xdeadbeef).add(uint(1).shiftLeft(2)).add(13))
  b.assign(c)
  a.assign(b)
  a.addAssign(kx)
  return jenkins_final(a, b, c).z
}).setLayout({
  name: 'YCW_jenkins_fold1',
  type: 'uint',
  inputs: [
    { name: 'kx', type: 'uint' }
  ]
})

const jenkins_fold2 = Fn(([kx, ky]) => {
  const a = uint().toVar()
  const b = uint().toVar()
  const c = uint().toVar()
  c.assign(uint(0xdeadbeef).add(uint(2).shiftLeft(2)).add(13))
  b.assign(c)
  a.assign(b)
  b.addAssign(ky)
  a.addAssign(kx)
  return jenkins_final(a, b, c).z
}).setLayout({
  name: 'YCW_jenkins_fold2',
  type: 'uint',
  inputs: [
    { name: 'kx', type: 'uint' },
    { name: 'ky', type: 'uint' }
  ]
})

const jenkins_fold3 = Fn(([kx, ky, kz]) => {
  const a = uint().toVar()
  const b = uint().toVar()
  const c = uint().toVar()
  c.assign(uint(0xdeadbeef).add(uint(3).shiftLeft(2)).add(13))
  b.assign(c)
  a.assign(b)
  c.addAssign(kz)
  b.addAssign(ky)
  a.addAssign(kx)
  return jenkins_final(a, b, c).z
}).setLayout({
  name: 'YCW_jenkins_fold3',
  type: 'uint',
  inputs: [
    { name: 'kx', type: 'uint' },
    { name: 'ky', type: 'uint' },
    { name: 'kz', type: 'uint' }
  ]
})

const jenkins_fold4 = Fn(([kx, ky, kz, kw]) => {
  const a = uint().toVar()
  const b = uint().toVar()
  const c = uint().toVar()
  c.assign(uint(0xdeadbeef).add(uint(4).shiftLeft(2)).add(13))
  b.assign(c)
  a.assign(b)
  a.addAssign(kx)
  b.addAssign(ky)
  a.addAssign(kz)
  const mixed = jenkins_mix(a, b, c)
  const A = uint(mixed.x).toVar()
  const B = mixed.y
  const C = mixed.z
  A.addAssign(kw)
  return jenkins_final(A, B, C).z
}).setLayout({
  name: 'YCW_jenkins_fold4',
  type: 'uint',
  inputs: [
    { name: 'kx', type: 'uint' },
    { name: 'ky', type: 'uint' },
    { name: 'kz', type: 'uint' },
    { name: 'kw', type: 'uint' }
  ]
})

//
// Jenkins Hashs, [0,1]
//

export const jenkins_hash11 = Fn(([k]) => {
  return jenkins_fold1(floatBitsToUint(k))
    .toFloat()
    .div(0xffff_ffff)
}).setLayout({
  name: 'YCW_jenkins_hash11',
  type: 'float',
  inputs: [{ name: 'k', type: 'float' }]
})

export const jenkins_hash12 = Fn(([k]) => {
  return jenkins_fold2(floatBitsToUint(k.x), floatBitsToUint(k.y))
    .toFloat()
    .div(0xffff_ffff)
}).setLayout({
  name: 'YCW_jenkins_hash12',
  type: 'float',
  inputs: [{ name: 'k', type: 'vec2' }]
})

export const jenkins_hash13 = Fn(([k]) => {
  return jenkins_fold3(floatBitsToUint(k.x), floatBitsToUint(k.y), floatBitsToUint(k.z))
    .toFloat()
    .div(0xffff_ffff)
}).setLayout({
  name: 'YCW_jenkins_hash13',
  type: 'float',
  inputs: [{ name: 'k', type: 'vec3' }]
})

export const jenkins_hash14 = Fn(([k]) => {
  return jenkins_fold4(floatBitsToUint(k.x), floatBitsToUint(k.y), floatBitsToUint(k.z), floatBitsToUint(k.w))
    .toFloat()
    .div(0xffff_ffff)
}).setLayout({
  name: 'YCW_jenkins_hash14',
  type: 'float',
  inputs: [{ name: 'k', type: 'vec4' }]
})

//
// Wang Hashs, [0,1)
//

const wang_hash = Fn(([k]) => {
  const K = uint(k)
  K.assign(K.bitXor(61).bitXor(K.shiftRight(16)))
  K.mulAssign(9)
  K.bitXorAssign(K.shiftRight(4))
  K.mulAssign(0x27d4eb2d)
  K.bitXorAssign(K.shiftRight(15))
  return K.toFloat().div(0xffff_ffff + 1).fract()
}).setLayout({
  name: 'YCW_wang_hash_to_float',
  type: 'float',
  inputs: [{ name: 'k', type: 'uint' }]
})

export const wang_hash11 = Fn(([k]) => {
  return wang_hash(floatBitsToUint(k))
}).setLayout({
  name: 'YCW_wang_hash11',
  type: 'float',
  inputs: [{ name: 'k', type: 'float' }]
})

export const wang_hash12 = Fn(([k]) => {
  return wang_hash(
    jenkins_fold2(
      floatBitsToUint(k.x),
      floatBitsToUint(k.y)
    )
  )
}).setLayout({
  name: 'YCW_wang_hash12',
  type: 'float',
  inputs: [{ name: 'k', type: 'vec2' }]
})

export const wang_hash13 = Fn(([k]) => {
  return wang_hash(
    jenkins_fold3(
      floatBitsToUint(k.x),
      floatBitsToUint(k.y),
      floatBitsToUint(k.z)
    )
  )
}).setLayout({
  name: 'YCW_wang_hash13',
  type: 'float',
  inputs: [{ name: 'k', type: 'vec3' }]
})

export const wang_hash14 = Fn(([k]) => {
  return wang_hash(
    jenkins_fold4(
      floatBitsToUint(k.x),
      floatBitsToUint(k.y),
      floatBitsToUint(k.z),
      floatBitsToUint(k.w)
    )
  )
}).setLayout({
  name: 'YCW_wang_hash14',
  type: 'float',
  inputs: [{ name: 'k', type: 'vec4' }]
})
