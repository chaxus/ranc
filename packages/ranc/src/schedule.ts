import type { Task } from '@/src/type'
import { noop } from '@/src/utils'

// 待任务队列
const queue: Task[] = []
// 一个任务执行的最长时间
const threshold: number = 5
// 开始执行的任务队列
const transitions: Array<() => void> = []
let deadline: number = 0

export const startTransition = (cb: () => void): void => {
  // 将回调添加到 transitions 数组
  // 又将任务从 transitions 中取出来，但是包装了一层，执行任务
  transitions.push(cb) && translate()
}

export const schedule = (callback: Function): void => {
  // 将回调函数添加到数组中
  // 添加任务
  queue.push({ callback })
  // 开始执行任务
  startTransition(flush)
}

// 根据 queueMicrotask， MessageChannel，setTimeout 包装任务
const task = (pending: boolean) => {
  // 取出 transitions 数组中第一个执行回调函数
  const cb = () => transitions.splice(0, 1).forEach(c => c())
  // 根据 queueMicrotask， MessageChannel，setTimeout 进行执行任务
  // pending 为 false 时，不执行 queueMicrotask ，防止无限制的插入微任务，导致页面卡死
  if (!pending && typeof queueMicrotask !== 'undefined') {
    return () => queueMicrotask(cb)
  }
  if (typeof MessageChannel !== 'undefined') {
    const { port1, port2 } = new MessageChannel()
    port1.onmessage = cb
    return () => port2.postMessage(null)
  }
  return () => setTimeout(cb)
}
// 通过 queueMicrotask， MessageChannel，setTimeout 封装任务
let translate = task(false)

// 执行 queue 中的任务
const flush = (): void => {
  deadline = getTime() + threshold
  // 取出 queue 中的第一项
  let job = peek(queue)
  // 
  while (job && !shouldYield()) {
    const { callback = noop } = job
    job.callback = undefined
    const next = callback()
    if (next) {
      job.callback = next
    } else {
      queue.shift()
    }
    job = peek(queue)
  }
  job && (translate = task(shouldYield())) && startTransition(flush)
}

export const shouldYield = (): boolean => {
  return getTime() >= deadline
}

export const getTime = (): number => performance.now()

const peek = (queue: Task[]) => queue[0]