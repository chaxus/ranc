import { TAG } from './type'
import type {
  DOMElement,
  Effect,
  Fiber,
  FiberAction,
  FiberProps,
  FC,
} from './type'
import { createElement, createText, removeElement } from './dom'
import { resetCursor } from './hook'
import { schedule, shouldYield } from './schedule'
import { commit } from './commit'
import { initArray } from './utils'

let currentFiber: Fiber

export const render = (fiber: Fiber, node: DOMElement | null): void => {
  if (node) {
    const rootFiber: Fiber = {
      node,
      child: fiber,
      dirty: false,
      type: 'root',
      isComp: false,
      lane: TAG.UPDATE,
    }
    update(rootFiber)
  }
}

export const update = (fiber: Fiber): void => {
  if (!fiber.dirty) {
    // 标记为 dirty 表示更新过了
    fiber.dirty = true
    schedule(() => reconcile(fiber))
  }
}

const reconcile = (fiber?: Fiber): boolean => {
  // 如果有 fiber 且没到时间，fiber 等于
  while (fiber && !shouldYield()) fiber = capture(fiber)
  if (fiber) return reconcile(fiber)
  return false
}

const memo = (fiber: Fiber) => {
  if (fiber.memo && fiber.old?.props) {
    const scu = fiber.shouldUpdate || shouldUpdate
    // 当前组件是否需要更新，不需要的话返回兄弟节点
    if (!scu(fiber.props || {}, fiber.old.props)) {
      // fast-fix
      return getSibling(fiber)
    }
  }
  return null
}

const capture = (fiber: Fiber): Fiber | undefined => {
  // 是不是自定义的组件
  fiber.isComp = isFn(fiber.type)
  if (fiber.isComp) {
    const memoFiber = memo(fiber)
    if (memoFiber) {
      return memoFiber
    }
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
}

const bubble = (fiber: Fiber) => {
  if (fiber.isComp) {
    if (fiber.hooks) {
      // 同步执行 useLayout hooks
      side(fiber.hooks.layout)
      // 异步执行 useEffect hooks
      schedule(() => side(fiber.hooks?.effect))
    }
  }
}

const shouldUpdate = (a: Partial<FiberProps>, b: Partial<FiberProps>) => {
  for (const i in a) if (!(i in b)) return true
  for (const i in b) if (a[i] !== b[i]) return true
}

const updateHook = (fiber: Fiber): void => {
  resetCursor()
  currentFiber = fiber
  if (fiber.type instanceof Function) {
    const children = fiber.type(fiber.props || {})
    fiber.props?.children && reconcileChildren(fiber, fiber.props.children)
  }
}

const updateHost = (fiber: Fiber): void => {
  fiber.parentNode = getParentNode(fiber)
  if (!fiber.node) {
    const flag = createElement(fiber)
    if (flag) {
      fiber.node = flag
    }
  }
  fiber.props?.children && reconcileChildren(fiber, fiber.props.children)
}

const simpleVnode = (type: string | FC) =>
  isStr(type) ? createText(type) : type

const getParentNode = (fiber: Fiber): DOMElement | undefined => {
  while (fiber.parent && (fiber = fiber.parent)) {
    if (!fiber.isComp) return fiber.node
  }
}

const reconcileChildren = (fiber: Fiber, children: Array<Fiber>): void => {
  const aCh = fiber.kids || [],
    bCh = (fiber.kids = initArray(children))
  const actions = diff(aCh, bCh)

  for (
    let i = 0, prev: Fiber | undefined = undefined, len = bCh.length;
    i < len;
    i++
  ) {
    const child = bCh[i]
    child.action = actions[i]
    if (fiber.lane & TAG.SVG) {
      child.lane |= TAG.SVG
    }
    child.parent = fiber
    if (i > 0 && prev) {
      // 构建 fiber 链表
      prev.sibling = child
    } else {
      fiber.child = child
    }
    // 给 prev 初始赋值
    prev = child
  }
}

function clone(a: Fiber, b: Fiber) {
  b.hooks = a.hooks
  b.ref = a.ref
  b.node = a.node // 临时修复
  b.kids = a.kids
  b.old = a
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
// a 是原来的数组
// b 是新的数组
// 对比两者的差异，在原来的数组，即 a 数组，打上需要如何操作的标识
const diff = function (
  a: Fiber<FiberProps>[] | [],
  b: Fiber<FiberProps>[] | [],
) {
  const actions: Array<FiberAction> = [],
    aIdx: Record<string, number> = {},
    bIdx: Record<string, number> = {},
    key = (v: Fiber) => v.key || '' + v.type
  let i, j
  // 配置 a 的映射 key + type，映射到 index
  for (i = 0; i < a.length; i++) {
    aIdx[key(a[i])] = i
  }
  // 配置 b 的映射 key + type，映射到 index
  for (i = 0; i < b.length; i++) {
    bIdx[key(b[i])] = i
  }
  // 双指针遍历 a 和 b ，直到有一方结束
  for (i = j = 0; i !== a.length || j !== b.length; ) {
    const aElm = a[i],
      bElm = b[j]
    if (aElm == null) {
      i++
      // 如果 j 大于 b 数组
      // 如果 b 元素上没有元素了，那说明此元素被删除，移除 a 元素
    } else if (b.length <= j) {
      // 移除 a 元素，i++
      removeElement(a[i])
      i++
      // 如果 a 元素没有了，说明需要新增，打上新增的标记
    } else if (a.length <= i) {
      actions.push({ op: TAG.INSERT, elm: bElm, before: a[i] })
      j++
      // 如果两个元素的 key 和 type 类型相等，则进行更新
    } else if (key(aElm) === key(bElm)) {
      clone(aElm, bElm)
      actions.push({ op: TAG.UPDATE })
      i++
      j++
    } else {
      // a 元素是否在 b 元素中，不在即删除
      const curElmInNew = bIdx[key(aElm)]
      // b 元素是否在 a 元素中，不在即新增，在即复用
      const wantedElmInOld = aIdx[key(bElm)]
      if (curElmInNew === undefined) {
        removeElement(a[i])
        i++
      } else if (wantedElmInOld === undefined) {
        actions.push({ op: TAG.INSERT, elm: bElm, before: a[i] })
        j++
      } else {
        clone(a[wantedElmInOld], bElm)
        actions.push({ op: TAG.MOVE, elm: a[wantedElmInOld], before: a[i] })
        delete a[wantedElmInOld]
        j++
      }
    }
  }
  return actions
}

export const getCurrentFiber = (): Fiber => currentFiber
export const isFn = (x: unknown): x is Function => typeof x === 'function'
export const isStr = (s: unknown): s is number | string =>
  typeof s === 'number' || typeof s === 'string'
