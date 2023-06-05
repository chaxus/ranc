
// DOM TYPE

export type DOMAttributes = NamedNodeMap

export type DOMElement = (Element | Text | HTMLElement) & Record<string | number | symbol, any>

// RANC TYPE

export type FiberProps = Attributes & { children: Array<Fiber>, memo: boolean }

export type Key = RancText
export interface RefObject<T> {
  current: T
}

export type RefCallback<T> = {
  (key: T | null): void
}

export type Ref<T = null> = RefCallback<T> | RefObject<T> | null


export interface FC<P extends Partial<FiberProps> = Partial<FiberProps>> {
  (props: P): RancNode
}


export interface Attributes extends Partial<DOMAttributes> {
  key?: Key
  children?: Array<RancNode>
  ref?: Ref
}

export interface RancElement<P extends Attributes = Attributes, T = string> {
  type: T
  props: P
  key: string
}

export type HookTypes = 'list' | 'effect' | 'layout'


export interface Hook {
  list: Effect[]
  layout: Effect[]
  effect: Effect[]
}

export type FiberRef = (
  e: DOMElement | undefined
) => void | { current?: DOMElement }


export interface Fiber<P extends FiberProps = FiberProps> {
  key?: string
  type: string | FC<Partial<P>>
  parentNode?: DOMElement
  node: DOMElement
  kids?: Array<Fiber<P>>
  dirty: boolean,
  old?: Fiber<P>,
  parent?: Fiber<P>
  sibling?: Fiber<P>
  child?: Fiber<P>
  done?: () => void
  ref?: FiberRef
  hooks?: Hook
  oldProps?: P
  action?: any
  props?: P
  lane: number
  isComp: boolean,
  memo?: boolean,
  shouldUpdate?: (newProps: Partial<P>, oldProps: Partial<P>) => boolean
}

export type Effect = [any?, DependencyList?, Function?]

export type RancText = string | number
export type RancNode = RancText | RancElement

export type SetStateAction<S> = S | ((prevState: S) => S)
export type Dispatch<A> = (value: A, resume?: boolean) => void
export type Reducer<S, A> = (prevState: S, action: A | Dispatch<A>) => S
export type Noop = () => void
export type EffectCallback = () => void | (Noop | undefined)
export type DependencyList = Array<any>

export interface PropsWithChildren {
  children?: Array<RancNode>
}

export type TaskCallback = ((...arg: any) => any) | Function

export interface Task {
  callback?: TaskCallback
  fiber?: Fiber
}

export const enum TAG {
  UPDATE = 1 << 1,
  INSERT = 1 << 2,
  REMOVE = 1 << 3,
  SVG = 1 << 4,
  DIRTY = 1 << 5,
  MOVE = 1 << 6,
  REPLACE = 1 << 7,
}

export interface FiberAction {
  op: TAG,
  elm?: Fiber,
  before?: Fiber
}