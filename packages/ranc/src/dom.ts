import type { Attributes, DOM, FC, Fiber, FreElement } from './type'
import { TAG } from './reconcile'
import { initArray, isArr, isNothing, isStr } from './utils'

const defaultObj = {}

const jointIter = <P extends Attributes>(
    aProps: Partial<P>,
    bProps: P,
    callback: (name: string, a: any, b: any) => void
) => {
    aProps = aProps || defaultObj
    bProps = bProps || defaultObj
    Object.keys(aProps).forEach(k => callback(k, aProps[k], bProps[k]))
    Object.keys(bProps).forEach(k => !Object.hasOwnProperty.bind(aProps, k) && callback(k, undefined, bProps[k]))
}

export const updateElement = <P extends Attributes>(dom: DOM, aProps: Partial<P>, bProps: P): void => {
    jointIter(aProps, bProps, (name, a, b) => {
        if (a === b || name === 'children') {
        } else if (name === 'style' && !isStr(b)) {
            jointIter(a, b, (styleKey, aStyle, bStyle) => {
                if (aStyle !== bStyle) {
                    dom[name][styleKey] = bStyle || ''
                }
            })
        } else if (name[0] === 'o' && name[1] === 'n') {
            name = name.slice(2).toLowerCase()
            if (a) dom.removeEventListener(name, a)
            dom.addEventListener(name, b)
        } else if (name in dom && !(dom instanceof SVGElement)) {
            dom[name] = b || ''
        } else if (isNothing(b)) {
            !(dom instanceof Text) && dom.removeAttribute(name)
        } else {
            !(dom instanceof Text) && dom.setAttribute(name, b)
        }
    })
}

export const createElement = (fiber: Fiber): HTMLElement | SVGElement | Text | false => {
    const dom =
        fiber.type === '#text'
            ? document.createTextNode('')
            : fiber.lane & TAG.SVG && isStr(fiber.type)
                ? document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    fiber.type
                )
                : isStr(fiber.type) && document.createElement(fiber.type)
    dom && updateElement(dom, {}, fiber.props)
    return dom
}

export const removeElement = (fiber: Fiber): void => {
    if (fiber.isComp) {
        fiber.hooks && fiber.hooks.list.forEach(e => e[2] && e[2]())
        fiber.kids.forEach(removeElement)
    } else {
        fiber.parentNode.removeChild(fiber.node)
        kidsRefer(fiber.kids)
        refer(fiber.ref, null)
    }
}


// for jsx2
export const h = (type, props: any, ...kids) => {
    props = props || {}
    kids = flat(initArray(props.children || kids))

    if (kids.length) props.children = kids.length === 1 ? kids[0] : kids

    const key = props.key || null
    const ref = props.ref || null

    if (key) props.key = undefined
    if (ref) props.ref = undefined

    return createVnode(type, props, key, ref)
}

const some = (x: unknown) => x != null && x !== true && x !== false

const flat = (arr: any[], target = []) => {
    arr.forEach(v => {
        isArr(v)
            ? flat(v, target)
            : some(v) && target.push(isStr(v) ? createText(v) : v)
    })
    return target
}

export const createVnode = (type: string, props: any, key: string, ref: any) => ({
    type,
    props,
    key,
    ref,
})

export const createText = (vnode: any) =>
    ({ type: '#text', props: { nodeValue: vnode + '' } } as FreElement)

export function Fragment(props) {
    return props.children
}

export function memo<T extends object>(fn: FC<T>, compare?: FC<T>['shouldUpdate']) {
    fn.memo = true
    fn.shouldUpdate = compare
    return fn
}

