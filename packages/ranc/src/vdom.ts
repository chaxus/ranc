import { isArr, isStr } from "@/utils"
import type { Attributes, RancNode } from "@/type"

// TODO: props type 
// 创建虚拟 DOM
export const createVirtualDom = (type: string, props: any, ...children: RancNode[]):RancNode => {
    children = flat(initArray(props.children || children || []))
    const key = props.key || null
    const ref = props.ref || null
  
    if (key) props.key = undefined
    if (ref) props.ref = undefined
    props.children = children
    return {
        type,
        props,
        key,
        ref
    }
}

export function Fragment(props: Attributes): RancNode[] {
    return props.children
}

const initArray = (arr?: RancNode[]): [] | RancNode[] => (!arr ? [] : isArr(arr) ? arr : [arr]);

const some = (x: unknown): boolean => x != null && x !== true && x !== false

const flat = (arr: RancNode[], target: RancNode[] = []) => {
    arr.forEach(v => {
        isArr(v)
            ? flat(v, target)
            : some(v) && target.push(isStr(v) ? createText(v) : v)
    })
    return target
}


const createText = (dom: RancNode): any =>
    ({ type: '#text', props: { nodeValue: dom + '' } })