interface SignalValue {
  execute: any
  deps: any
}

interface Subscriptions {
  execute: any
}

const context: SignalValue[] = []
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
  const subscriptions = new Set<Subscriptions>()
  const signal = {
    value,
    comparator: options?.equals,
  }
  const getter = () => {
    const running = context.pop()
    if (running) {
      subscriptions.add({
        execute: running.execute,
      })
      running.deps.add(subscriptions)
    }
    return signal.value
  }
  const updateSignal = (newValue: T) => {
    signal.value = newValue
    for (const sub of [...subscriptions]) {
      sub.execute()
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

const createEffect = (effect) => {
  const execute = () => {
    running.deps.clear()
    context.push(running)
    try {
      effect()
    } finally {
      context.pop(running)
    }
  }

  const running = {
    execute,
    deps: new Set(),
  }
  execute()
}

const createMemo = (fn:Function) => {
  const [memo, setMemo] = createSignal()
  createEffect(() => setMemo(fn()))
  return memo
}

const [name, setName] = createSignal('a')
const fullName = createMemo(() => {
  return 'c-' + name()
})
createEffect(() => console.log(name(), fullName()))
setName('b')
