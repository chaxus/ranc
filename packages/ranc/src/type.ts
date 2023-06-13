/*
 * @Author: ran
 * @Date: 2023-06-05 10:29:01
 * @description: 分为几块类型：真实的DOM，虚拟DOM，Fiber，Hook，RECONCILE(调度器)，一个工具方法类型
 * @LastEditors: ran
 * @LastEditTime: 2023-06-13 16:19:54
 */

import type { VNode } from "@/src/vdom"

// DOM
export type DOMAttributes = NamedNodeMap

export type DOMElement = (Element | Text | HTMLElement) &
  Record<string | number | symbol, any>

// VIRTUAL DOM
export interface RancElement<P extends Attributes = Attributes, T = string> {
  type: T
  props: P
  children: RancNode[]
}

export type RancNode<P extends Attributes = Attributes, T = string> = {
  type: T
  props: P
  key: any
  ref: any
}

// Fiber
export type FiberProps = Attributes

export type RancText = string | number

export type Key = RancText
export interface RefObject<T> {
  current: T
}

export type RefCallback<T> = {
  (key: T | null): void
}

export type Ref<T = null> = RefCallback<T> | RefObject<T> | null

export interface FC<P extends Attributes = Attributes> {
  (props: P): RancNode
}

export interface Attributes extends Partial<DOMAttributes> {
  key?: Key
  ref?: Ref
  children?: Array<VNode>; 
  memo?: boolean
}

export type FiberRef = (
  e: DOMElement | undefined,
) => void | { current?: DOMElement }

// workTags.ts - 对应 fiber 节点的类型
export type WorkTag =
  | typeof FunctionComponent
  | typeof HostRoot
  | typeof HostComponent
  | typeof HostText

export const FunctionComponent = 0
export const HostRoot = 3 // Root Fiber 可以理解为根元素 ， 通过reactDom.render()产生的根元素

export const HostComponent = 5 // dom元素 比如 <div></div>
export const HostText = 6 // 文本类型 比如：<div>123</div>

export interface Fiber<P extends FiberProps = FiberProps> {
  tag: WorkTag // 组件的类型，判断函数式组件、类组件等（上述的tag）
  key?: string
  type: string | FC<P> // 与fiber关联的功能或类，如<div>,指向对应的类或函数
  parentNode?: DOMElement
  node: DOMElement // 真实的DOM节点
  kids?: Array<Fiber<P>> // 子节点数组
  dirty: boolean
  old?: Fiber<P> 
  // fiber 链表
  parent?: Fiber<P>
  sibling?: Fiber<P>
  child?: Fiber<P>

  done?: () => void
  ref?: FiberRef
  hooks?: Hook
  // 本次渲染所需要的 props
  props?: P
  // 上次渲染所需要的 props
  oldProps?: P
  // 应该执行什么操作
  action?: any
  lane: number // 优先级，用于调度
  isComp: boolean
  memo?: boolean
  shouldUpdate?: (newProps: Partial<P>, oldProps: Partial<P>) => boolean
}

export interface FiberAction {
  op: TAG
  elm?: Fiber
  before?: Fiber
}

// Hook
export type HookTypes = 'list' | 'effect' | 'layout'

export interface Hook {
  list: Effect[]
  layout: Effect[]
  effect: Effect[]
}

export type Effect = [any?, DependencyList?, Function?]

export type SetStateAction<S> = S | ((prevState: S) => S)
export type Dispatch<A> = (value: A, resume?: boolean) => void
export type Reducer<S, A> = (prevState: S, action: A | Dispatch<A>) => S
export type EffectCallback = () => void | undefined
export type DependencyList = Array<any>

// RECONCILE
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

// UTILS
export type Noop = () => void
