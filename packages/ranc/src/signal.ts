
const context: Function[] = []

/**
 * @description: 仅提供 value 时，（默认）是响应式的。
 * 在 options 设置 equals 为 false 时不管何时都是响应式。
 * equals 设置为函数，根据新值和旧值的关系来设置何时为响应式。
 * @return {*}
 */
export const createSignal = <T = unknown>(
  value?: T,
  options?: { equals?: boolean | ((prev: T | undefined, next: T) => boolean) },
): [() => T | undefined, (newValue: T) => void] => {
  const signal = {
    value,
    // 订阅者
    subscribers: new Set<Function>(),
    comparator: options?.equals,
  }
  const getter = () => {
    // 订阅
    const running = context[context.length - 1]
    if (running) {
      signal.subscribers.add(running)
    }
    return signal.value
  }
  const updateSignal = (newValue: T) => {
    if (signal.value !== newValue) {
      signal.value = newValue
      // 通知订阅者
      signal.subscribers.forEach((subscriber) => subscriber())
    }
  }
  const setter = (newValue: T) => {
    const { comparator } = signal
    if (comparator instanceof Function) {
      return !comparator(signal.value, newValue) && updateSignal(newValue)
    }
    if (comparator === undefined) {
      if (signal.value !== newValue) {
        updateSignal(newValue)
      }
    } else {
      !comparator && updateSignal(newValue)
    }
  }
  return [getter, setter]
}
/**
 * @description: 只能是 createSignal getter，或者 effect 中包括了 createSignal 的 getter，无须第二个参数也能是响应式
 * @param {*} effect 是订阅的函数，当 signal 的 setter 触发时，effect 会触发
 * @param {T} signal createSignal 的 getter
 * @return {*}
 */
export const createEffect = <T, D>(
  effect: (v?: T) => T,
  signal?: () => D,
): void => {
  const execute = () => {
    context.push(execute)
    try {
      if (signal instanceof Function) {
        signal()
      }
      effect()
    } finally {
      // 释放
      context.pop()
    }
  }
  execute()
}

export const createMemo = <T>(
  fn: Function,
  value?: T,
  options?: { equals?: boolean | ((prev: T | undefined, next: T) => boolean) },
): (() => T | undefined) => {
  const [memo, setMemo] = createSignal(fn(), options)
  if (value instanceof Function) {
    createEffect(() => setMemo(fn()), value())
  } else {
    createEffect(() => setMemo(fn()))
  }
  return memo
}

