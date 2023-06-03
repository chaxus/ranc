export const isArr = Array.isArray

export const initArray = (arr: unknown): Array<unknown> => (!arr ? [] : isArr(arr) ? arr : [arr]);

export const isStr = (s: unknown): s is string => s instanceof String

export const isNothing = (s: string | boolean | null | undefined): boolean => {
    const list = [null, 'null', undefined, 'undefined', '', false, 'false']
    return list.includes(s)
}

export const noop = (): void => { }