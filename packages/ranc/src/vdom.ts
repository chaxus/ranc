import { _catchError, slice } from '@/src/utils'

type Key = string | number | any

type RefObject<T> = { current: T | null }
type RefCallback<T> = (instance: T | null) => void
type Ref<T> = RefObject<T> | RefCallback<T> | null
// Component

type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>
 
// Function Component
interface FunctionComponent<P = {}> {
  (props: RenderableProps<P>, context?: any): VNode<any> | null
  displayName?: string
  defaultProps?: Partial<P> | undefined
}

export interface ErrorInfo {
  componentStack?: string
}
// class Component
interface Component<P = {}, S = {}> {
  componentWillMount?(): void
  componentDidMount?(): void
  componentWillUnmount?(): void
  getChildContext?(): object
  componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void
  shouldComponentUpdate?(
    nextProps: Readonly<P>,
    nextState: Readonly<S>,
    nextContext: any,
  ): boolean
  componentWillUpdate?(
    nextProps: Readonly<P>,
    nextState: Readonly<S>,
    nextContext: any,
  ): void
  getSnapshotBeforeUpdate?(oldProps: Readonly<P>, oldState: Readonly<S>): any
  componentDidUpdate?(
    previousProps: Readonly<P>,
    previousState: Readonly<S>,
    snapshot: any,
  ): void
  componentDidCatch?(error: any, errorInfo: ErrorInfo): void
}

interface ComponentClass<P = {}, S = {}> {
  new (props: P, context?: any): Component<P, S>
  displayName?: string
  defaultProps?: Partial<P>
  contextType?: Context<any>
  getDerivedStateFromProps?(
    props: Readonly<P>,
    state: Readonly<S>,
  ): Partial<S> | null
  getDerivedStateFromError?(error: any): Partial<S> | null
}
// Context
interface Consumer<T>
  extends FunctionComponent<{
    children: (value: T) => ComponentChildren
  }> {}

interface Provider<T>
  extends FunctionComponent<{
    value: T
    children: ComponentChildren
  }> {}

interface Context<T> {
  Consumer: Consumer<T>
  Provider: Provider<T>
  displayName?: string
}

interface RancProvider<T> extends Provider<T> {}
type ContextType<C extends Context<any>> = C extends Context<infer T>
	? T
	: never;

interface RancContext<T> extends Context<T> {}

// function createContext<T>(defaultValue: T): Context<T>;
// VNode 

export interface VNode<P = {}> {
  type: ComponentType<P> | string
  props: P & { children: ComponentChildren }
  key: Key
  /**
   * ref is not guaranteed by React.ReactElement, for compatibility reasons
   * with popular react libs we define it as optional too
   */
  ref?: Ref<any> | null
  /**
   * The time this `vnode` started rendering. Will only be set when
   * the devtools are attached.
   * Default value: `0`
   */
  startTime?: number
  /**
   * The time that the rendering of this `vnode` was completed. Will only be
   * set when the devtools are attached.
   * Default value: `-1`
   */
  endTime?: number
}

type ComponentChild =
  | VNode<any>
  | object
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
type ComponentChildren = ComponentChild[] | ComponentChild

interface Attributes {
  key?: Key | undefined
  jsx?: boolean | undefined
}

type RenderableProps<P, RefType = any> = P &
  Readonly<Attributes & { children?: ComponentChildren; ref?: Ref<RefType> }>

const options: any = {
  _catchError,
}

let vnodeId = 0

/**
 * Create an virtual node (used for JSX)
 * @param {import('./internal').VNode["type"]} type The node name or Component
 * constructor for this virtual node
 * @param {object | null | undefined} [props] The properties of the virtual node
 * @param {Array<import('.').ComponentChildren>} [children] The children of the virtual node
 * @returns {import('./internal').VNode}
 */
export function createElement(
  type: any,
  props: Record<string, string | number | null> | null | undefined = {},
  children: Array<ComponentChildren>,
): VNode {
  const normalizedProps: Record<string, unknown> = {}
  let key: any, ref: any, i
  if (props) {
    for (i in props) {
      if (i === 'key') key = props[i]
      else if (i === 'ref') ref = props[i]
      else normalizedProps[i] = props[i]
    }
  }
  if (arguments.length > 2) {
    normalizedProps.children =
      arguments.length > 3 ? slice.call(arguments, 2) : children
  }

  // If a Component VNode, check for and apply defaultProps
  // Note: type may be undefined in development, must never error here.
  if (typeof type === 'function' && type.defaultProps != null) {
    for (i in type.defaultProps) {
      if (normalizedProps[i] === undefined) {
        normalizedProps[i] = type.defaultProps[i]
      }
    }
  }

  return createVNode(type, normalizedProps, key, ref, null)
}

/**
 * Create a VNode (used internally by Preact)
 * @param {VNode["type"]} type The node name or Component
 * Constructor for this virtual node
 * @param {object | string | number | null} props The properties of this virtual node.
 * If this virtual node represents a text node, this is the text of the node (string or number).
 * @param {string | number | null} key The key for this virtual node, used when
 * diffing it against its children
 * @param {VNode["ref"]} ref The ref property that will
 * receive a reference to its created child
 * @returns {VNode}
 */
export function createVNode(
  type: VNode['type'],
  props: object | string | number | null,
  key: string | number | null,
  ref: VNode['ref'],
  original: null,
): VNode<any> {
  // V8 seems to be better at detecting type shapes if the object is allocated from the same call site
  // Do not inline into createElement and coerceToVNode!
  const vnode = {
    type,
    props,
    key,
    ref,
    _children: null,
    _parent: null,
    _depth: 0,
    _dom: null,
    // _nextDom must be initialized to undefined b/c it will eventually
    // be set to dom.nextSibling which can return `null` and it is important
    // to be able to distinguish between an uninitialized _nextDom and
    // a _nextDom that has been set to `null`
    _nextDom: undefined,
    _component: null,
    _hydrating: null,
    constructor: undefined,
    _original: original == null ? ++vnodeId : original,
  }

  // Only invoke the vnode hook if this was *not* a direct copy:
  if (original == null && options.vnode != null) options.vnode(vnode)

  return vnode
}

export function createRef<T = any>(): RefObject<T> {
  return { current: null }
}

export function Fragment(props: RenderableProps<{}>): ComponentChildren {
  return props.children
}

/**
 * Check if a the argument is a valid Preact VNode.
 * @param {*} vnode
 * @returns {Boolean}
 */
export const isValidElement = (vnode: VNode): Boolean =>
  vnode != null && vnode.constructor === undefined
