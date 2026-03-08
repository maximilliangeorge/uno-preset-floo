import { describe, expect, it } from 'vitest'
import { parseFlooExpr, generateCalc, type BreakpointContext } from '../src/expression'

describe('parseFlooExpr', () => {
  it('parses scale expression', () => {
    expect(parseFlooExpr('100px')).toEqual({ type: 'scale', value: 100, unit: 'px' })
    expect(parseFlooExpr('16rem')).toEqual({ type: 'scale', value: 16, unit: 'rem' })
    expect(parseFlooExpr('1.5em')).toEqual({ type: 'scale', value: 1.5, unit: 'em' })
  })

  it('parses range expression', () => {
    expect(parseFlooExpr('100px-200px')).toEqual({ type: 'range', start: 100, end: 200, unit: 'px' })
    expect(parseFlooExpr('1rem-2rem')).toEqual({ type: 'range', start: 1, end: 2, unit: 'rem' })
  })

  it('parses dampened expression', () => {
    expect(parseFlooExpr('100px/2')).toEqual({ type: 'dampened', value: 100, unit: 'px', factor: 2 })
    expect(parseFlooExpr('100px/4')).toEqual({ type: 'dampened', value: 100, unit: 'px', factor: 4 })
    expect(parseFlooExpr('100px/1.5')).toEqual({ type: 'dampened', value: 100, unit: 'px', factor: 1.5 })
  })

  it('rejects mismatched units in range', () => {
    expect(parseFlooExpr('100px-200rem')).toBeNull()
  })

  it('rejects zero or negative dampening factor', () => {
    expect(parseFlooExpr('100px/0')).toBeNull()
  })

  it('rejects zero scale value', () => {
    expect(parseFlooExpr('0px')).toBeNull()
  })

  it('rejects identical range values', () => {
    expect(parseFlooExpr('100px-100px')).toBeNull()
  })

  it('rejects invalid expressions', () => {
    expect(parseFlooExpr('')).toBeNull()
    expect(parseFlooExpr('abc')).toBeNull()
    expect(parseFlooExpr('100')).toBeNull()
    expect(parseFlooExpr('100%')).toBeNull()
    expect(parseFlooExpr('px')).toBeNull()
  })
})

describe('generateCalc', () => {
  const mdCtx: BreakpointContext = { ideal: 768, start: 768, end: 1280 }
  const xlCtx: BreakpointContext = { ideal: 1440, start: 1440, end: undefined }

  it('generates scale calc', () => {
    const expr = parseFlooExpr('100px')!
    expect(generateCalc(expr, mdCtx)).toBe('calc(100px * 100vw / 768px)')
  })

  it('generates range calc', () => {
    const expr = parseFlooExpr('100px-200px')!
    expect(generateCalc(expr, mdCtx)).toBe('calc(100px + 100px * (100vw - 768px) / 512px)')
  })

  it('generates static value for range at last breakpoint', () => {
    const expr = parseFlooExpr('100px-200px')!
    expect(generateCalc(expr, xlCtx)).toBe('100px')
  })

  it('generates dampened calc', () => {
    const expr = parseFlooExpr('100px/2')!
    expect(generateCalc(expr, mdCtx)).toBe('calc(100px * (1 + (100vw - 768px) / 768px / 2))')
  })

  it('generates dampened calc with factor 4', () => {
    const expr = parseFlooExpr('100px/4')!
    expect(generateCalc(expr, mdCtx)).toBe('calc(100px * (1 + (100vw - 768px) / 768px / 4))')
  })
})
