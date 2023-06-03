export type Key = FreText
export interface RefObject<T> {
  current: T
}

export type RefCallback<T> = {
  (key: T | null): void
}

export type Ref<T = null> =  RefCallback<T> | RefObject<T> | null


export interface Attributes extends NamedNodeMap {
  key?: Key
  children?: FreNode
  ref?: Ref
}

export interface FC<P extends Attributes> {
  (props: P): FreElement<P> | null
  fiber?: Fiber
  type?: string
  memo?: boolean
  shouldUpdate?: (newProps: P, oldProps: P) => boolean
}

export interface FreElement<P extends Attributes, T = string> {
  type: T
  props: P
  key: string
}

export type HookTypes = 'list' | 'effect' | 'layout'

export interface IHook {
  list: Effect[]
  layout: Effect[]
  effect: Effect[]
}

export type IRef = (
  e: HTMLElement | undefined
) => void | { current?: HTMLElement }

export interface Fiber<P extends Attributes = Attributes > {
  key?: string
  type: string | FC<P>
  parentNode: DOMElement
  node: DOMElement
  kids?: any
  dirty:boolean,
  parent?: Fiber<P>
  sibling?: Fiber<P>
  child?: Fiber<P>
  done?: () => void
  ref: IRef
  hooks: IHook
  oldProps: P
  action: any
  props: P
  lane: number
  isComp: boolean
}

export type DOMElement = HTMLElement
export type Effect = [Function, DependencyList, Function?]

export type FreText = string | number
export type FreNode =
  | FreText
  | FreElement
  | FreNode[]
  | boolean
  | null
  | undefined

export type SetStateAction<S> = S | ((prevState: S) => S)
export type Dispatch<A> = (value: A, resume?: boolean) => void
export type Reducer<S, A> = (prevState: S, action: A) => S
export type Noop = () => void
export type EffectCallback = () => void | (Noop | undefined)
export type DependencyList = Array<any>

export interface PropsWithChildren {
  children?: FreNode
}

export type TaskCallback = ((time: boolean) => boolean) | null

export interface ITask {
  callback?: TaskCallback
  fiber: Fiber
}

export type DOM = HTMLElement | SVGElement | Text
