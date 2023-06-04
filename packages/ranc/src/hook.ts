import { getCurrentFiber, isFn, update } from "./reconcile"
import type {
    DependencyList,
    Dispatch,
    Effect,
    EffectCallback,
    Fiber,
    HookTypes,
    RancNode,
    Reducer,
    RefObject,
    SetStateAction,
} from "./type"
import { noop } from './utils'

const EMPTY_ARR: [] = []

let cursor = 0

export const resetCursor = (): void => {
    cursor = 0
}

export const useState = <T>(initState: T): [T, Dispatch<SetStateAction<T>>] => {
    return useReducer(undefined, initState)
}

export const useReducer = <S, A>(
    reducer?: Reducer<S, A>,
    initState?: S
): [S, Dispatch<A>] => {
    const [hook, current]: [any, Fiber] = getHook(cursor++)
    if (hook.length === 0) {
        hook[0] = initState
        hook[1] = (value: A | Dispatch<A>) => {
            hook[0] = reducer
                ? reducer(hook[0], value as any)
                : isFn(value)
                    ? value(hook[0])
                    : value
            update(current)
        }
    }
    return hook
}

export const useEffect = (cb: EffectCallback, deps?: DependencyList): void => {
    return effectImpl(cb, deps!, "effect")
}

export const useLayout = (cb: EffectCallback, deps?: DependencyList): void => {
    return effectImpl(cb, deps!, "layout")
}

const effectImpl = (
    cb: EffectCallback,
    deps: DependencyList,
    key: HookTypes
): void => {
    const [hook, current] = getHook(cursor++)
    if (isChanged(hook[1], deps)) {
        hook[0] = cb
        hook[1] = deps
        if (current.hooks) {
            current.hooks[key].push(hook)
        }
    }
}

export const useMemo = <S = Function>(
    cb: () => S,
    deps: DependencyList = []
): S => {
    const hook = getHook(cursor++)[0]
    if (isChanged(hook[1], deps!)) {
        hook[1] = deps
        return (hook[0] = cb())
    }
    return hook[0]
}

export const useCallback = (
    cb: Function,
    deps: DependencyList = []
): Function => {
    return useMemo(() => cb, deps)
}

export const useRef = <T>(current: T): RefObject<T> => {
    return useMemo(() => ({ current }), [])
}

export const getHook = (
    cursor: number
): [Effect, Fiber] => {
    const current: Fiber = getCurrentFiber()
    const hooks = current.hooks || (current.hooks = { list: [], effect: [], layout: [] })
    if (cursor >= hooks.list.length) {
        hooks.list.push([noop, []])
    }
    return [hooks.list[cursor], current]
}

export type ContextType<T> = {
    ({ value, children }: { value: T, children: Array<RancNode> }): Array<RancNode>;
    initialValue: T;
}

type SubscriberCb = () => void;

export const createContext = <T>(initialValue: T): ContextType<T> => {
    const contextComponent: ContextType<T> = ({ value, children }) => {
        const valueRef = useRef(value)
        const subscribers = useMemo(() => new Set<SubscriberCb>(), EMPTY_ARR)

        if (valueRef.current !== value) {
            valueRef.current = value;
            subscribers.forEach((subscriber) => subscriber())
        }

        return children
    }
    contextComponent.initialValue = initialValue;
    return contextComponent;
}

export const useContext = <T>(contextType: ContextType<T>): Effect | T => {
    let subscribersSet: Set<Function>

    const triggerUpdate = useReducer(undefined, null)[1]

    useEffect(() => {
        return () => subscribersSet && subscribersSet.delete(triggerUpdate)
    }, EMPTY_ARR);

    let contextFiber = getCurrentFiber().parent
    // while (contextFiber && contextFiber.type !== contextType) {
    //     contextFiber = contextFiber.parent
    // }
    const hooks = contextFiber?.hooks?.list
    if (contextFiber && hooks) {
        const [value, subscribers] = hooks;

        // subscribersSet = subscribers.add(triggerUpdate)

        return value
    } else {
        return contextType.initialValue
    }
}

export const isChanged = (a: DependencyList, b: DependencyList): boolean => {
    return !a || a.length !== b.length || b.some((arg, index) => !Object.is(arg, a[index]))
}
