import { getCurrentFiber, isFn, update } from "./reconcile"
import { schedule } from "./schedule"
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
    SetStateAction
} from "./type"

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
    // 获取当前 fiber 节点上的 hook list 中 cursor 项
    // 如果没有的话就创建一个空
    const [hook, current]: [any, Fiber] = getHook(cursor++)
    if (hook.length === 0) {
        hook[0] = initState
        hook[1] = (value: A | Dispatch<A>) => {
            hook[0] = reducer
                ? reducer(hook[0], value)
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
    const [hook, current]: [any, Fiber] = getHook(cursor++)
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
    const hook: any = getHook(cursor++)[0]
    if (isChanged(hook[1], deps)) {
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
): [Effect | [], Fiber] => {
    const current: Fiber = getCurrentFiber()
    const hooks = current.hooks || (current.hooks = { list: [], effect: [], layout: [] })
    if (cursor >= hooks.list.length) {
        hooks.list.push([])
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

    const contextFiber = getCurrentFiber().parent
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

/**
 * @description: new code
 * @return {*}
 */

// hooks 的数据保存在 fiber 的节点上，比如 useState 的 state，useRef 的 ref 等。

// hook 的 api 就是在 fiber 的 memoizedState 链表上存取数据的。第一次调用 useApi 时会构建这个链表

// useRef：

// 第一次使用 useRef 会走到 mountRef：

// 在 mountRef 里可以看到它创建了一个 hook 节点，然后设置了 memoizedState 属性为有 current 属性的对象，也就是 ref 对象。

const mountWorkInProgressHook = () => {
    const hook = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        Queue: null,
        next: null
    }
    // 如果是第一次执行这个 hook 
    if (workInProgressHook === null) {
        currentFiberHook.memoizedState = workInProgressHook = hook
    } else {
        // 如果不是第一次执行 hook，将这个 hook 添加到列表的最后
        workInProgressHook = workInProgressHook.next = hook
    }
    return workInProgressHook
}

// 第一次会走到 mountRef，第二次使用会走到 updateRef，但因为是 Ref，所以会直接取出 hook 的 momorizedState 的值直接返回了

const updateRef = () => {
    const hook = updateWorkInProgressHook()
    return hook.memoizedState
}

// 保证 ref 的不变

// useMemo:

// useMemo 也是分为 mountMemo 和 updateMemo

// 创建 hook，然后执行传入的 create 函数，把值设置到 hook.memoizedState 属性上
const mountMemo = (nextCreate, deps) => {
    const hook = mountWorkInProgressHook()
    const nextDeps = deps === undefined ? null : deps
    const nextValue = nextCreate()
    hook.memoizedState = [nextValue, nextDeps]
    return hook
}

// update 的时候会判断依赖有没有变, 
// 如果依赖数组都没变，那就返回之前的值，否则创建新的值更新到 hook.memoizedState。
const updateMemo = (nextCreate, deps) => {
    const hook = mountWorkInProgressHook()
    const nextDeps = deps === undefined ? null : deps
    const prevState = hook.memoizedState
    if (prevState !== null) {
        if (nextDeps !== null) {
            const prevDeps = prevState[1]
            // 对比新旧依赖，如果没有变化，返回旧的值
            if (areHookInputEqual(nextDeps, prevDeps)) {
                return prevState[0]
            }
        }
    }
    const nextValue = nextCreate()
    hook.memoizedState = [nextValue, nextDeps]
    return hook
}

// useCallback 的实现是分为 mountCallback 和 updateCallback 的：

// hook 的数据是存放在 fiber 的 memoizedState 属性的链表上的，

// 每个 hook 对应一个节点，

// 第一次执行 useXxx 的 hook 会走 mountXxx 的逻辑来创建 hook 链表，之后会走 updateXxx 的逻辑。

// useEffect同样分了 mountEffect 和 updateEffect 两个阶段：

// mountEffect 里执行了一个 pushEffect 的函数：

// 在 updateEffect 里也是，只是多了依赖数组变化的检测逻辑：

// pushEffect 里面创建了 effect 对象并把它放到了 fiber.updateQueue 上：


const pushEffect = (tag, create, destroy, deps) => {
    const effect = {
        tag,
        create,
        destroy,
        deps,
        next: null
    }
    let componentUpdateQueue = currentFiber.updateQueue
    if (componentUpdateQueue === null) {
        currentFiber.updateQueue = componentUpdateQueue.lastEffect = componentUpdateQueue = effect
    } else {
        const lastEffect = componentUpdateQueue.lastEffect
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect
        } else {
            lastEffect.next = effect
        }
    }
}

// updateQueue 是个环形链表，有个 lastEffect 来指向最后一个 effect。

// 方便插入新的 effect ，直接设置 lastEffect.next 就行。

// 也就是说我们执行完 useEffect 之后，就把 effect 串联起来放到了 fiber.updateQueue 上。

// 是在 commit 最开始的时候，异步处理的 effect 列表：

// 具体处理的过程就是取出 fiber.updateQueue，然后从 lastEffect.next 开始循环处理

// 遍历完一遍 fiber 树，处理完每个 fiber.updateQueue 就处理完了所有的 useEffect 的回调：

// 不在 before mutation、mutation、layout 阶段执行有啥好处呢？异步执行不阻塞渲染呀！

// useEffect 的 hook 在 render 阶段会把 effect 放到 fiber 的 updateQueue 中，

// 这是一个  lastEffect.next 串联的环形链表，然后 commit 阶段会异步执行所有 fiber 节点的 updateQueue 中的 effect。

// useLayoutEffect 和 useEffect 差不多，区别只是它是在 commit 阶段的 layout 阶段同步执行所有 fiber 节点的 updateQueue 中的 effect。

// useState

// 同样要分为 mountState 和 updateState 来看：

// 它把 initialState 设置到了 hook.baseState 上，这是 state 最终保存的地方。

const mountState = (initialState) => {
    const hook = mountWorkInProgressHook()
    if (typeof initialState === 'function') {
        initialState = initialState()
    }
    hook.memoizedState = hook.baseState = initialState
    const queue = {
        pending: null,
        interleaved: null,
        lanes: null,
        dispatch: null,
        lastRenderedReducer: baseStateReducer,
        lastRenderedState: initialState
    }
    hook.queue = queue
    const dispatch = queue.dispatch = dispatchSetState.bind(null, currentFiber, queue)
    return [hook.memoizedState, dispatch]
}
// 创建了一个 queue，这个是用于多个 setState 的时候记录每次更新的。

// 返回的第二个值是 dispatch 函数，给他绑定了当前的 fiber 还有那个 queue。

// 这样，当你再执行返回的 setXxx 函数的时候就会走到 dispatch 逻辑：

// 这时候前两个参数 fiber 和 queue 都是 bind 的值，只有第三个参数是传入的新 state，当然，现在还叫 action：
const dispatchSetState = (fiber, queue, action) => {
    // 它会创建一个 update 对象，然后标记 fiber 节点，之后调度下次渲染：
    const lane = requestUpdateLane(fiber)
    const update = {
        lane: null,
        action: null,
        hasEagerState: null,
        eagerState: null,
        next: null
    }
    const root = enQueueConCurrentHookUpdate(fiber, queue, update, lane)
    scheduleUpdateOnFiber(root, fiber, lane, eventTime)
}

// updateState 会调用 updateReducer，选出最终的 state 来返回做渲染：

// 怎么决定 state 要更新成啥呢？

// 自然也是根据优先级，这里会根据 lane 来比较，然后做 state 的合并，最后返回一个新的 state：

// useState 同样分为 mountState 和 updateState 两个阶段：

// mountState 会返回 state 和 dispatch 函数，

//dispatch 函数里会记录更新到 hook.queue，然后标记当前 fiber 到根 fiber 的 lane 需要更新，之后调度下次渲染。

// 再次渲染的时候会执行 updateState，会取出 hook.queue，根据优先级确定最终的 state 返回，这样渲染出的就是最新的结果。
