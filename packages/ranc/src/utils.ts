import type { Fiber, FiberProps } from "./type";
import type { ErrorInfo, VNode } from '@/src/vdom'

export const isArr = Array.isArray

export const initArray = (arr?: Fiber<FiberProps>[]): [] | Fiber<FiberProps>[] => (!arr ? [] : isArr(arr) ? arr : [arr]);

export const isStr = (s: unknown): s is string => s instanceof String

export const isNothing = (s: string | boolean | null | undefined): boolean => {
    const list = [null, 'null', undefined, 'undefined', '', false, 'false']
    return list.includes(s)
}

export const noop = (): void => { }

export const EMPTY_OBJ = {};
export const EMPTY_ARR = [];
export const IS_NON_DIMENSIONAL =
    /acit|ex(?:[sgnp]|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;


export const isArray = Array.isArray;

/**
 * Assign properties from `props` to `obj`
 * @template O, P The obj and props types
 * @param {O} obj The object to copy properties to
 * @param {P} props The object to copy properties from
 * @returns {O & P}
 */
export function assign<O, P>(obj: O, props: P): O & P {
    // @ts-ignore We change the type of `obj` to be `O & P`
    for (const i in props) obj[i] = props[i];
    // @ts-ignore We change the type of `obj` to be `O & P`
    return obj
}

/**
 * Remove a child node from its parent if attached. This is a workaround for
 * IE11 which doesn't support `Element.prototype.remove()`. Using this function
 * is smaller than including a dedicated polyfill.
 * @param {Node} node The node to remove
 */
export function removeNode(node: Node): void {
    const parentNode = node.parentNode;
    if (parentNode) parentNode.removeChild(node);
}

export const slice = EMPTY_ARR.slice;

interface VNodeError {
    _parent: VNode,
    _component: VNode
}

/**
 * Find the closest error boundary to a thrown error and call it
 * @param {object} error The thrown value
 * @param {import('../internal').VNode} vnode The vnode that threw
 * the error that was caught (except for unmounting when this parameter
 * is the highest parent that was being unmounted)
 * @param {import('../internal').VNode} [oldVNode]
 * @param {import('../internal').ErrorInfo} [errorInfo]
 */
export function _catchError(error: object, vnode: any, oldVNode: VNode, errorInfo: ErrorInfo): any {
    /** @type {import('../internal').Component} */
    let component, ctor, handled;

    for (; (vnode = vnode._parent);) {
        if ((component = vnode._component) && !component._processingException) {
            try {
                ctor = component.constructor;

                if (ctor && ctor.getDerivedStateFromError != null) {
                    component.setState(ctor.getDerivedStateFromError(error));
                    handled = component._dirty;
                }

                if (component.componentDidCatch != null) {
                    component.componentDidCatch(error, errorInfo || {});
                    handled = component._dirty;
                }

                // This is an error boundary. Mark it as having bailed out, and whether it was mid-hydration.
                if (handled) {
                    return (component._pendingError = component);
                }
            } catch (e) {
                error = e;
            }
        }
    }

    throw error;
}
