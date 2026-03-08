export type FlooExpr =
  | { type: 'scale'; value: number; unit: string }
  | { type: 'range'; start: number; end: number; unit: string }
  | { type: 'dampened'; value: number; unit: string; factor: number }

export function parseFlooExpr(raw: string): FlooExpr | null {
  let m: RegExpMatchArray | null

  // Dampened: 100px/2
  m = raw.match(/^(\d+(?:\.\d+)?)(px|rem|em)\/(\d+(?:\.\d+)?)$/)
  if (m) {
    const factor = +m[3]
    if (factor <= 0) return null
    return { type: 'dampened', value: +m[1], unit: m[2], factor }
  }

  // Range: 100px-200px (backreference \2 ensures matching units)
  m = raw.match(/^(\d+(?:\.\d+)?)(px|rem|em)-(\d+(?:\.\d+)?)\2$/)
  if (m) {
    const start = +m[1]
    const end = +m[3]
    if (start === end) return null
    return { type: 'range', start, end, unit: m[2] }
  }

  // Scale: 100px
  m = raw.match(/^(\d+(?:\.\d+)?)(px|rem|em)$/)
  if (m) {
    const value = +m[1]
    if (value <= 0) return null
    return { type: 'scale', value, unit: m[2] }
  }

  return null
}

export interface BreakpointContext {
  ideal: number
  start: number
  end?: number
}

export function generateCalc(expr: FlooExpr, ctx: BreakpointContext): string | null {
  switch (expr.type) {
    case 'scale':
      return `calc(${expr.value}${expr.unit} * 100vw / ${ctx.ideal}px)`

    case 'range': {
      if (ctx.end == null) return `${expr.start}${expr.unit}`
      const valueDelta = expr.end - expr.start
      const bpRange = ctx.end - ctx.start
      return `calc(${expr.start}${expr.unit} + ${valueDelta}${expr.unit} * (100vw - ${ctx.start}px) / ${bpRange}px)`
    }

    case 'dampened':
      return `calc(${expr.value}${expr.unit} * (1 + (100vw - ${ctx.ideal}px) / ${ctx.ideal}px / ${expr.factor}))`
  }
}
