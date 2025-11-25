import { TSL as $ } from 'three/webgpu'

/**
 * Returns the 2D displacement in NDC space between the current and previous frame.
 *
 * Honors `positionNode` changes and per‑instance transforms.
 *
 * Note: This helper will merge the MRT with an additional `ndc_position2d` output.
 *
 * @param {*} pass - The `TSL.pass` node.
 * @returns The 2D displacement in NDC space. (vec2)
 *
 * @example
 * ```
 * const pass0 = pass(scene, camera)
 * pass0.setMRT(mrt({ output }))
 * postprocessing.outputNode = motionBlur(
 *   pass0.getTextureNode('output'),
 *   ndc_displacement2d(pass0)
 * )
 * ```
 */
export const ndc_displacement2d = (pass) => {
  const name = 'ndc_position2d'
  const clipspace_position = $.modelViewProjection.mul($.positionLocal).toConst()
  const ndc_position2d = clipspace_position.xy.div(clipspace_position.w)
  const additional_mrt = $.mrt({ [name]: ndc_position2d })
  pass.setMRT(pass.getMRT().merge(additional_mrt))
  const p0 = pass.getPreviousTextureNode(name)
  const p1 = pass.getTextureNode(name)
  return p1.xy.sub(p0.xy)
}
