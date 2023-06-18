import { HOST_ROOT, TAG } from '@/src/type'
import type {
  DOMElement,
  Effect,
  Fiber,
  FiberAction,
} from '@/src/type'
import { createElement, removeElement } from '@/src/dom'
import { resetCursor } from '@/src/hook'
import { schedule, shouldYield } from '@/src/schedule'
import { commit } from '@/src/commit'
import { initArray, isArray } from '@/src/utils'
import type { ComponentChild, ComponentChildren, FunctionComponent, VNode } from '@/src/vdom'

interface RootNode {
  node: Element
  props: {
    children: Array<VNode>
  }
}

const ROOT_NODE = 'div'

/**
 * @description: 页面中显示的内容，reconcile.ts 负责 vdom 转 fiber
 */
let currentFiber: Fiber
/**
 * @description: 内存中正在重新构建的 Fiber树。
 * @return {*}
 */
let workInProgressFiber: Fiber

export const render = (vnode: VNode, node: HTMLElement | null): void => {
  if (vnode && node) {
    const root = {
      node,
      props: { children: [vnode] },
    }
    update(root)
  }
}
/**
 * @description:
 * @param {*} current 在视图层渲染的树
 * @param {*} workInProgress 它就是在整个内存中所构建的 Fiber树，所有的更新都发生在workInProgress中，所以这个树是最新状态的，之后它将替换给current
 * @param {*} renderLanes 跟优先级有关
 * @return {*}
 */
// const beginWork = (current, workInProgress, renderLanes) => { }

/**
 * @description: 创建 FiberNode
 * @return {*}
 */
const createFiber = () => { }

/**
 * @description: 创建 FiberRootNode ，并指向真正的 root
 * @return {*}
 */
const createFiberRoot = () => { }

// update
export const update = (root: RootNode): void => {
  const { node } = root
  const { type, props, key, ref } = root.props.children[0]
  workInProgressFiber = {
    tag: HOST_ROOT,
    type,
    key,
    parentNode: node,
    props,
    dirty: true,
    lane: TAG.UPDATE,
    isComp: false,
    alternate: currentFiber
  }
  // schedule 是调度器
  // 将优先级高的任务推进 reconcile
  // reconcile 将 vdom 转换成 fiber，新的 VDOM 和 旧的 Fiber 进行 diff 对比，并同时打上进行什么操作的 tag
  // render 渲染成 dom
  schedule(() => reconcile(workInProgressFiber))
  console.log('workInProgressFiber', workInProgressFiber)
}

const reconcile = (fiber?: Fiber): boolean | Function => {
  // 如果有 fiber 且没到时间，fiber 等于
  while (fiber && !shouldYield()) fiber = capture(fiber)
  if (fiber) return reconcile.bind(null, fiber)
  return false
}

const memo = (fiber: Fiber) => {
  if (fiber.memo && fiber.old?.props) {
    const scu = fiber.shouldUpdate || shouldUpdate
    // 当前组件是否需要更新，不需要的话返回兄弟节点
    if (!scu(fiber.props || {}, fiber.old.props)) {
      return getSibling(fiber)
    }
  }
  return null
}

const capture = (fiber: Fiber): Fiber | undefined => {
  // 是不是自定义的组件
  debugger;
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

const shouldUpdate = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
) => {
  for (const i in a) if (!(i in b)) return true
  for (const i in b) if (a[i] !== b[i]) return true
}

const updateHook = (fiber: Fiber): void => {
  resetCursor()
  currentFiber = fiber
  if (fiber.type instanceof Function) {
    const children = (fiber.type as FunctionComponent)(fiber.props || {})
    children && reconcileChildren(fiber, isArray(children) ? children : [children])
  } else {
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

const getParentNode = (fiber: Fiber): DOMElement | undefined => {
  while (fiber.parent && (fiber = fiber.parent)) { }
  return fiber.tag === HOST_ROOT ? fiber.parentNode : fiber.node
}

const reconcileChildren = (fiber: Fiber, children: ComponentChildren): void => {
  const aCh = fiber.kids || [],
    bCh = (fiber.kids = initArray(children))
  const actions = diff(aCh, bCh)
  for (let i = 0, len = bCh.length, prev: Fiber | undefined = undefined; i < len; i++) {
    const child = bCh[i]
    if (typeof child === 'object' && child) {
      const { props, type, key } = child
      const childFiber: Fiber = {
        props, type, key,
        tag: 0,
        dirty: true,
        lane: 0,
        isComp: false
      }
      childFiber.action = actions[i]
      if (fiber.lane & TAG.SVG) {
        childFiber.lane |= TAG.SVG
      }
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

// 更新 b 节点的数据
function clone(a: VNode, b: VNode) {
  // b.hooks = a.hooks
  b.ref = a.ref
  // b.node = a.node // 临时修复
  // b.kids = a.kids
  // b.old = a
  b.type = a.type
  // b.props = a.props
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
function diff(a: ComponentChildren, b: ComponentChildren) {
  const actions: Array<FiberAction> = [],
    aIdx: Record<string, number> = {},
    bIdx: Record<string, number> = {},
    key = (v: ComponentChild) => {
      if (typeof v === 'object') {
        const { key = '', type = '' } = v || {}
        return key || `${type}`
      }
      return `${v}`
    }
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
  for (i = j = 0; i != a.length || j != b.length;) {
    const aElm = a[i],
      bElm = b[j]
    if (b.length <= j) {
      // 移除 a 元素，i++
      actions.push({ op: TAG.REMOVE, elm: aElm })
      // removeElement(a[i])
      i++
      // 如果 a 元素没有了，说明需要新增，打上新增的标记
    } else if (a.length <= i) {
      actions.push({ op: TAG.INSERT, elm: bElm, before: a[i] })
      j++
      // 如果两个元素的 key 和 type 类型相等，则进行更新
    } else if (key(aElm) === key(bElm)) {
      // clone(aElm, bElm)
      actions.push({ op: TAG.UPDATE, elm: bElm, before: a[i] })
      i++
      j++
    } else {
      // a 元素是否在 b 元素中，不在即删除
      const curElmInNew = bIdx[key(aElm)]
      // b 元素是否在 a 元素中，不在即新增，在即复用
      const wantedElmInOld = aIdx[key(bElm)]
      if (curElmInNew === undefined) {
        actions.push({ op: TAG.REMOVE, elm: aElm })
        // removeElement(a[i])
        i++
      } else if (wantedElmInOld === undefined) {
        actions.push({ op: TAG.INSERT, elm: bElm, before: a[i] })
        j++
      } else {
        // clone(a[wantedElmInOld], bElm)
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

// currentFiber , workInProgressFiber , fiberRootNode

// React 更新DOM 采用的是双缓存技术。React 中最多会存在两颗 Fiber树：

// currentFiber：页面中显示的内容

// workInProgressFiber : 内存中正在重新构建的 Fiber树。

// 双缓存中：当 workInProgressFiber 在内存中构建完成后，

// React 会直接用它 替换掉 currentFiber，这样能快速更新 DOM。

// 一旦 workInProgressFiber树 渲染在页面上后，它就会变成 currentFiber 树，也就是说 fiberRootNode 会指向它。

// 在 currentFiber 中有一个属性 alternate 指向它对应的 workInProgressFiber，

// 同样，workInProgressFiber 也有一个属性 alternate 指向它对应的 currentFiber。也就是下面的这种结构：
