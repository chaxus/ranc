export { createElement, Fragment, createElement as h, createRef } from '@/src/vdom'
export { render } from '@/src/reconcile'
export {
  useState,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useLayout,
  useLayout as useLayoutEffect,
  useContext,
  createContext,
} from '@/src/hook'
export { shouldYield, schedule as startTranstion } from '@/src/schedule'
export * from '@/src/type'

/**
 * @description: new code
 * @return {*}
 */

// 渲染流程整体分为两个大阶段： render 阶段和 commit 阶段。

// render 阶段也就是 reconcile 的 vdom 转 fiber 的过程:

// commit 阶段就是具体操作 dom，以及执行副作用函数的过程: ./commit.ts
