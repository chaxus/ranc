import { insertBeforeElement, removeElement, updateElement } from '@/src/dom'
import { isFn } from '@/src/reconcile'
import { TAG } from '@/src/type';
import type { DOMElement, Fiber, FiberRef } from '@/src/type';
/**
 * @description: 操作具体 dom 和执行副作用
 * @param {Fiber} fiber
 * @return {*}
 */
export const commit = (fiber: Fiber): void => {
  if (!fiber) {
    return
  }
  const { op } = fiber.action || {}
  if (op & TAG.INSERT || op & TAG.MOVE) {
    if (fiber.isComp && fiber.child?.action) {
      fiber.child.action.op |= fiber.action.op
    } else {
      insertBeforeElement(fiber)
    }
  }
  if (op & TAG.UPDATE) {
    // insertBeforeElement(fiber)
    if (fiber.isComp && fiber.child?.action) {
      fiber.child.action.op |= fiber.action.op
    } else {
      fiber.node && updateElement(fiber.node, fiber.old?.props || {}, fiber.props || {})
    }
  }

  fiber.ref && refer(fiber.ref, fiber.node)
  fiber.action = null
  fiber.child && fiber.action && commit(fiber.child)
  // fiber.sibling && commit(fiber.sibling)
}

export const refer = (ref: FiberRef, dom?: DOMElement): void => {
  if (ref)
    isFn(ref) ? ref(dom) : ((ref as { current?: DOMElement })!.current = dom)
}

export const kidsRefer = (kids: Array<Fiber>): void => {
  // kids.forEach(kid => {
  //   kid.kids && kidsRefer(kid.kids)
  //   kid.ref && refer(kid.ref, undefined)
  // })
}

/**
 * @description: new code
 * @return {*}
 */

// commit 阶段还分为了 3 个小阶段：before mutation、mutation、layout。

// 具体操作 dom 的阶段是 mutation，操作 dom 之前是 before mutation，而操作 dom 之后是 layout。

// layout 阶段在操作 dom 之后，所以这个阶段是能拿到 dom 的，ref 更新是在这个阶段，useLayoutEffect 回调函数的执行也是在这个阶段。