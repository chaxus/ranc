import type { Fiber, IRef } from './type';
import { updateElement } from './dom'
import { TAG, isFn } from './reconcile'


export const commit = (fiber: Fiber):void => {
  if (!fiber) {
    return
  }
  const { op, before, elm } = fiber.action || {}
  if (op & TAG.INSERT || op & TAG.MOVE) {
    if (fiber.isComp && fiber.child) {
      fiber.child.action.op |= fiber.action.op
    } else {
      fiber.parentNode.insertBefore(elm.node, before?.node)
    }
  }
  if (op & TAG.UPDATE) {
    if (fiber.isComp && fiber.child) {
      fiber.child.action.op |= fiber.action.op
    } else {
      updateElement(fiber.node, fiber.old.props || {}, fiber.props)
    }
  }

  refer(fiber.ref, fiber.node)

  fiber.action = null

  commit(fiber.child)
  commit(fiber.sibling)
}

export const refer = (ref: IRef, dom?: HTMLElement): void => {
  if (ref)
    isFn(ref) ? ref(dom) : ((ref as { current?: HTMLElement })!.current = dom)
}

export const kidsRefer = (kids: any): void => {
  kids.forEach(kid => {
    kid.kids && kidsRefer(kid.kids)
    refer(kid.ref, undefined)
  })
}

