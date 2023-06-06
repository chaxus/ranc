import { describe, expect, it } from 'vitest'
import { createEffect, createMemo, createSignal } from '@/signal'

describe('signal', () => {
  it('createEffect, createMemo, createSignal', () => {
    const [name, setName] = createSignal('a')
    const fullName = createMemo(() => {
      return 'c-' + name()
    })
    createEffect(() => console.log(name(), fullName()))
    setName('b')
    expect(name()).toEqual('b')
  })
})
