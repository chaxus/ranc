import { insertBeforeElement, updateElement } from './dom'
import { isFn } from './reconcile'
import { TAG } from '@/type';
import type { DOMElement, Fiber, FiberRef } from '@/type';


export const commit = (fiber: Fiber): void => {
  if (!fiber) {
    return
  }
  const { op } = fiber.action || {}
  if (op & TAG.INSERT || op & TAG.MOVE) {
    if (fiber.isComp && fiber.child) {
      fiber.child.action.op |= fiber.action.op
    } else {
      insertBeforeElement(fiber)
    }
  }
  if (op & TAG.UPDATE) {
    if (fiber.isComp && fiber.child) {
      fiber.child.action.op |= fiber.action.op
    } else {
      updateElement(fiber.node, fiber.old?.props || {}, fiber.props || {})
    }
  }

  fiber.ref && refer(fiber.ref, fiber.node)

  fiber.action = null

  fiber.child && commit(fiber.child)
  fiber.sibling && commit(fiber.sibling)
}

export const refer = (ref: FiberRef, dom?: DOMElement): void => {
  if (ref)
    isFn(ref) ? ref(dom) : ((ref as { current?: DOMElement })!.current = dom)
}

export const kidsRefer = (kids: Array<Fiber>): void => {
  kids.forEach(kid => {
    kid.kids && kidsRefer(kid.kids)
    kid.ref && refer(kid.ref, undefined)
  })
}

