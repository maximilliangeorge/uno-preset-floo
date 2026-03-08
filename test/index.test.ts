import { createGenerator, type Preset } from '@unocss/core'
import { presetMini } from 'unocss'
import { describe, expect, it } from 'vitest'
import { presetFloo, type FlooTheme } from '../src/index'

const breakpoints = { sm: '640px', md: '768px', lg: '1280px', xl: '1440px' }

function createUno(opts = {}) {
  return createGenerator({
    theme: { breakpoints },
    presets: [presetMini() as Preset<FlooTheme>, presetFloo(opts)],
  })
}

describe('presetFloo', () => {
  it('loads without error', () => {
    const uno = createGenerator({ presets: [presetFloo()] })
    expect(uno).toBeDefined()
  })

  it('throws when ideals key is not in breakpoints', async () => {
    await expect(
      createGenerator({
        theme: { breakpoints },
        presets: [presetFloo({ ideals: { xxl: '1920px' } })],
      })
    ).rejects.toThrow(/"xxl"/)
  })

  it('does not throw when ideals keys match breakpoints', async () => {
    await expect(
      createGenerator({
        theme: { breakpoints },
        presets: [presetFloo({ ideals: { sm: '390px', md: '768px' } })],
      })
    ).resolves.toBeDefined()
  })
})

describe('floo expressions', () => {
  it('generates scale calc for md:text-size-[~100px]', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:text-size-[~100px]')
    expect(css).toContain('font-size:calc(100px * 100vw / 768px)')
    expect(css).toContain('@media (min-width: 768px)')
  })

  it('generates range calc for md:text-size-[~100px-200px]', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:text-size-[~100px-200px]')
    expect(css).toContain('font-size:calc(100px + 100px * (100vw - 768px) / 512px)')
  })

  it('generates dampened calc for md:text-size-[~100px/2]', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:text-size-[~100px/2]')
    expect(css).toContain('font-size:calc(100px * (1 + (100vw - 768px) / 768px / 2))')
  })

  it('works with width utility', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:w-[~100px]')
    expect(css).toContain('width:calc(100px * 100vw / 768px)')
  })

  it('works with padding utility', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:p-[~24px]')
    expect(css).toContain('padding:calc(24px * 100vw / 768px)')
  })

  it('works with gap utility', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:gap-[~16px]')
    expect(css).toContain('gap:calc(16px * 100vw / 768px)')
  })

  it('uses correct ideal for sm breakpoint', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('sm:text-size-[~100px]')
    expect(css).toContain('calc(100px * 100vw / 390px)')
  })

  it('uses correct ideal for xl breakpoint', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('xl:text-size-[~100px]')
    expect(css).toContain('calc(100px * 100vw / 1440px)')
  })

  it('uses correct range for lg breakpoint', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('lg:text-size-[~100px-200px]')
    // lg starts at 1280px, xl starts at 1440px, range = 160px
    expect(css).toContain('calc(100px + 100px * (100vw - 1280px) / 160px)')
  })

  it('drops floo value without breakpoint variant', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('text-size-[~100px]')
    expect(css).not.toContain('calc(')
    expect(css).not.toContain('~')
  })

  it('drops invalid floo expression', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:text-size-[~abc]')
    expect(css).not.toContain('~abc')
  })

  it('supports rem units', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('md:text-size-[~1.5rem]')
    expect(css).toContain('calc(1.5rem * 100vw / 768px)')
  })

  it('supports custom ideals', async () => {
    const uno = await createUno({ ideals: { md: '800px' } })
    const { css } = await uno.generate('md:text-size-[~100px]')
    expect(css).toContain('calc(100px * 100vw / 800px)')
  })

  it('generates scale calc for *:text-size-[~100px]', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('*:text-size-[~100px]')
    expect(css).toContain('font-size:calc(100px * 100vw / 375px)')
    expect(css).toContain('@media (min-width: 0px)')
  })

  it('generates range calc for *:text-size-[~100px-200px]', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('*:text-size-[~100px-200px]')
    // default: start=0, end=640 (sm breakpoint)
    expect(css).toContain('calc(100px + 100px * (100vw - 0px) / 640px)')
  })

  it('generates dampened calc for *:text-size-[~100px/2]', async () => {
    const uno = await createUno()
    const { css } = await uno.generate('*:text-size-[~100px/2]')
    expect(css).toContain('calc(100px * (1 + (100vw - 375px) / 375px / 2))')
  })

  it('supports custom default ideal', async () => {
    const uno = await createUno({ ideals: { _: '360px' } })
    const { css } = await uno.generate('*:text-size-[~100px]')
    expect(css).toContain('calc(100px * 100vw / 360px)')
  })
})
