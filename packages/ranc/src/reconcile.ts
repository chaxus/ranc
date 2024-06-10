import { HOST_ROOT, TAG } from '@/src/type'
import type { DOMElement, Effect, Fiber, FiberAction } from '@/src/type'
import { createElement, removeElement } from '@/src/dom'
import { resetCursor } from '@/src/hook'
import { schedule, shouldYield } from '@/src/schedule'
import { commit } from '@/src/commit'
import { initArray, isArray } from '@/src/utils'
import type {
  ComponentChild,
  ComponentChildren,
  FunctionComponent,
  VNode,
} from '@/src/vdom'

const CACHE_KEY_NODE: Record<string, Fiber> = {}

let key = 0

const resetKey = () => {
  key = 0
}

export const getCurrentKey = (): number => {
  return key++
}

/**
 * @description: 页面中显示的内容，reconcile.ts 负责 vdom 转 fiber
 */
let currentFiber: Fiber

let workInProgressFiber: Fiber

export const render = (vnode: VNode, node: HTMLElement | null): void => {
  if (vnode && node) {
    resetKey()
    const key = vnode.key || getCurrentKey()
    workInProgressFiber = {
      parentNode: node,
      tag: HOST_ROOT,
      type: vnode.type,
      dirty: true, // 当调用 setState 的时候，React 将标记其为 dirty，到每一个事件循环结束，React 会检查所有标记的 dirty 的 component 进行重绘。
      isComp: false,
      key,
      op: TAG.INSERT,
    }
    update(workInProgressFiber)
    // 缓存渲染的结果
    CACHE_KEY_NODE[key] = workInProgressFiber
  }
}

// update
export const update = (fiber: Fiber): void => {
  removeElement(fiber)
  fiber.dirty = true
  schedule(() => reconcile(fiber))
}

const reconcile = (fiber?: Fiber): boolean | Function => {
  // 如果有 fiber 且没到时间，fiber 等于
  while (fiber && !shouldYield()) fiber = capture(fiber)
  if (fiber) return reconcile.bind(null, fiber)
  return false
}

const capture = (fiber: Fiber): Fiber | undefined => {
  currentFiber = fiber
  if (!fiber.key) {
    fiber.key = getCurrentKey()
  }
  CACHE_KEY_NODE[fiber.key] = fiber
  fiber.isComp = isFn(fiber.type)
  if (fiber.isComp) {
    updateHook(fiber)
  } else {
    updateHost(fiber)
  }
  if (fiber.child) return fiber.child
  const sibling = getSibling(fiber)
  return sibling
}

const getSibling = (fiber?: Fiber): Fiber | undefined => {
  while (fiber) {
    bubble(fiber)
    if (fiber.dirty) {
      fiber.dirty = false
      commit(fiber)
    }
    if (fiber.sibling) return fiber.sibling
    fiber = fiber.parent
  }
  return undefined
}

const bubble = (fiber: Fiber) => {
  if (fiber.isComp && fiber.hooks) {
    // 同步执行 useLayout hooks
    side(fiber.hooks.layout)
    // 异步执行 useEffect hooks
    schedule(() => side(fiber.hooks?.effect))
  }
}

const shouldUpdate = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
) => {
  for (const i in a) if (!(i in b)) return true
  for (const i in b) if (a[i] !== b[i]) return true
}

const updateHook = (fiber: Fiber): void => {
  resetCursor()
  if (fiber.type instanceof Function) {
    const children = (fiber.type as FunctionComponent)(fiber.props || {})
    children &&
      reconcileChildren(fiber, isArray(children) ? children : [children])
    // fiber.props?.children && reconcileChildren(fiber, fiber.props.children)
  }
}

const updateHost = (fiber: Fiber): void => {
  currentFiber = fiber
  fiber.parentNode = getParentNode(fiber)
  if (!fiber.key) {
    fiber.key = getCurrentKey()
  }
  CACHE_KEY_NODE[fiber.key] = fiber
  if (!fiber.node) {
    const flag = createElement(fiber)
    if (flag) {
      fiber.node = flag
    }
  }
  fiber.props?.children && reconcileChildren(fiber, fiber.props.children)
}

export const getParentNode = (fiber: Fiber): DOMElement | undefined => {
  while (fiber && fiber.parent) {
    fiber = fiber.parent
    if (typeof fiber.type === 'string') {
      break
    }
  }
  return fiber.tag === HOST_ROOT ? fiber.parentNode : fiber.node
}

const noopStr = (x: any): string => {
  const arr = [null, undefined, false, '']
  if (arr.includes(x)) return ''
  return `${x}`
}

const reconcileChildren = (fiber: Fiber, children: ComponentChildren): void => {
  const { dirty, sibling } = fiber
  for (
    let i = 0, len = children.length, prev: Fiber | undefined = undefined;
    i < len;
    i++
  ) {
    const elm = children[i]
    if (typeof elm === 'object' && elm) {
      const { props, type, ref, text } = elm
      const key = elm.key || getCurrentKey()
      const childFiber: Fiber = {
        props,
        type,
        tag: 0,
        dirty,
        key,
        text,
        ref,
        siblingNode: sibling?.node,
        isComp: isFn(type),
        op: TAG.INSERT,
      }
      CACHE_KEY_NODE[key] = childFiber
      childFiber.parent = fiber
      if (i > 0 && prev) {
        // 构建 fiber 链表
        prev.sibling = childFiber
      } else {
        fiber.child = childFiber
      }
      // 给 prev 初始赋值
      prev = childFiber
    }
  }
}

const side = (effects?: Effect[]): void => {
  if (effects) {
    // 执行卸载的操作
    effects.forEach((e) => e[2] && e[2]())
    // 执行挂载的操作，同时返回卸载的操作
    effects.forEach((e) => (e[2] = e[0]()))
    effects.length = 0
  }
}

export const getCurrentFiber = (): Fiber => currentFiber
export const isFn = (x: unknown): x is Function => typeof x === 'function'
export const isStr = (s: unknown): s is number | string =>
  typeof s === 'number' || typeof s === 'string'

// currentFiber , workInProgressFiber , fiberRootNode

// React 更新 DOM 采用的是双缓存技术。React 中最多会存在两颗 Fiber 树：

// currentFiber：页面中显示的内容

// workInProgressFiber : 内存中正在重新构建的 Fiber 树。

// 双缓存中：当 workInProgressFiber 在内存中构建完成后，

// React 会直接用它 替换掉 currentFiber，这样能快速更新 DOM。

// 一旦 workInProgressFiber 树 渲染在页面上后，它就会变成 currentFiber 树，也就是说 fiberRootNode 会指向它。

// 在 currentFiber 中有一个属性 alternate 指向它对应的 workInProgressFiber，

// 同样，workInProgressFiber 也有一个属性 alternate 指向它对应的 currentFiber。也就是下面的这种结构：
