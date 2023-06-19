import { TAG } from '@/src/type'
import type { Attributes, DOMElement, Fiber } from '@/src/type'
import { kidsRefer, refer } from '@/src/commit'
import { isNothing, isStr } from '@/src/utils'

const SVG_ORG = 'http://www.w3.org/2000/svg'
const CHILDREN = 'children'
const STYLE = 'style'
const O = 'o'
const N = 'n'

const defaultObj = {}

const jointIter = <P extends Attributes>(
  aProps: Partial<P> & Record<string, any>,
  bProps: Partial<P> & Record<string, any>,
  callback: (name: string, a: any, b: any) => void,
) => {
  aProps = aProps || defaultObj
  bProps = bProps || defaultObj
  Object.keys(aProps).forEach((k) => callback(k, aProps[k], bProps[k]))
  Object.keys(bProps).forEach(
    (k) =>
      !Object.hasOwnProperty.bind(aProps, k) &&
      callback(k, undefined, bProps[k]),
  )
}
/**
 * @description: 更新元素
 * @param {*} P
 */
export const updateElement = <P = {}>(
  dom: DOMElement,
  aProps: Partial<P>,
  bProps: Partial<P & Record<string, any>>,
): void => {
  jointIter(aProps, bProps, (name, a, b) => {
    if (a === b || name === CHILDREN) {
    } else if (name === STYLE && !isStr(b)) {
      jointIter(a, b, (styleKey, aStyle, bStyle) => {
        if (aStyle !== bStyle) {
          dom[name][styleKey] = bStyle || ''
        }
      })
    } else if (name[0] === O && name[1] === N) {
      name = name.slice(2).toLowerCase()
      if (a) dom.removeEventListener(name, a)
      dom.addEventListener(name, b)
    } else if (name in dom && !(dom instanceof SVGElement)) {
      dom[name] = b || ''
    } else if (isNothing(b)) {
      !(dom instanceof Text) && dom.removeAttribute(name)
    } else {
      !(dom instanceof Text) && dom.setAttribute(name, b)
    }
  })
}
/**
 * @description: 创建元素
 * @param {Fiber} fiber
 */
export const createElement = (
  fiber: Fiber,
): Text | HTMLElement | SVGElement | undefined => {
  let dom = undefined
  debugger;
  if (fiber.type === '#text') {
    dom = document.createTextNode('')
  } else if (fiber.lane & TAG.SVG && fiber.type === 'svg') {
    dom = document.createElementNS(SVG_ORG, fiber.type)
  } else if (isStr(fiber.type)) {
    dom = document.createElement(fiber.type)
  }
  dom && updateElement(dom, {}, fiber.props || {})
  return dom
}
/**
 * @description: 删除元素
 * @param {Fiber} fiber
 */
export const removeElement = (fiber: Fiber): void => {
  // if (fiber.isComp) {
  // fiber.hooks && fiber.hooks.list.forEach(e => e[2] && e[2]())
  // fiber.kids && fiber.kids?.forEach(removeElement)
  // } else {
  fiber.parentNode && fiber.node && fiber.parentNode.removeChild(fiber.node)
  // fiber.kids && kidsRefer(fiber.kids)
  fiber.ref && refer(fiber.ref)
  // }
}
/**
 * @description: 插入元素
 * @param {Fiber} fiber
 * @return {*}
 */
export const insertBeforeElement = (fiber: Fiber): void => {
  const { before } = fiber.action || {}
  fiber.parentNode && fiber.node && fiber.parentNode.insertBefore(fiber.node, before?.node || null)
}

// TODO:
// 1.应该在 diff 生成 actions 之前，处理 vdom 成 fiber
// 2.createElement 的第三个参数，可能是一个表达式
// 3.createElement 的第一个参数，可能是一个函数，表示子组件
