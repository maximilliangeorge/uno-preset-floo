import type { Preset } from '@unocss/core'
import { parseFlooExpr, generateCalc, type BreakpointContext } from './expression'

export type { FlooExpr, BreakpointContext } from './expression'
export { parseFlooExpr, generateCalc } from './expression'

export interface FlooTheme {
  breakpoints?: Record<string, string>
  ideals?: Record<string, string>
}

export interface PresetFlooOptions {
  /**
   * Ideal frame widths — the Figma frame width where each breakpoint looks its best.
   * Merges with the defaults if provided.
   */
  ideals?: Record<string, string>
}

const defaultIdeals: Record<string, string> = {
  _: '375px',
  sm: '390px',
  md: '768px',
  lg: '1280px',
  xl: '1440px',
}

function parsePx(value: string): number {
  return parseFloat(value)
}

export function presetFloo(options: PresetFlooOptions = {}): Preset<FlooTheme> {
  const bpContextMap = new Map<string, BreakpointContext>()

  return {
    name: 'unocss-preset-floo',

    preprocess: [
      (matcher: string) => {
        if (matcher.startsWith('*:') && matcher.includes('[~')) {
          return 'floo-default:' + matcher.slice(2)
        }
        return matcher
      },
    ],

    variants: [
      {
        name: 'floo-default',
        match(matcher: string) {
          if (!matcher.startsWith('floo-default:')) return
          return {
            matcher: matcher.slice('floo-default:'.length),
            handle: (input: any, next: any) => next({
              ...input,
              parent: `${input.parent ? `${input.parent} $$ ` : ''}@media (min-width: 0px)`,
            }),
          }
        },
      },
    ],

    postprocess(util) {
      for (const entry of util.entries) {
        const value = entry[1]
        if (typeof value !== 'string' || !value.startsWith('~')) continue

        const raw = value.slice(1)
        const expr = parseFlooExpr(raw)
        if (!expr) {
          entry[1] = undefined
          continue
        }

        const bpMatch = util.parent?.match(/@media\s*\(min-width:\s*([\d.]+)px\)/)
        const ctx = bpMatch ? bpContextMap.get(bpMatch[1]) : bpContextMap.get('0')
        if (!ctx) {
          entry[1] = undefined
          continue
        }

        entry[1] = generateCalc(expr, ctx) ?? undefined
      }
    },

    extendTheme(theme) {
      const mergedIdeals = {
        ...defaultIdeals,
        ...options.ideals,
      }

      if (theme.breakpoints) {
        const idealKeys = Object.keys(mergedIdeals).filter(k => k !== '_')
        const breakpointKeys = Object.keys(theme.breakpoints)
        const unknown = idealKeys.filter(k => !breakpointKeys.includes(k))
        if (unknown.length > 0) {
          throw new Error(
            `[unocss-preset-floo] ideals contains keys not found in breakpoints: ${unknown.map(k => `"${k}"`).join(', ')}.\n` +
            `  Breakpoint keys: ${breakpointKeys.map(k => `"${k}"`).join(', ')}`
          )
        }

        const sorted = Object.entries(theme.breakpoints)
          .map(([name, value]) => ({ name, px: parsePx(value as string) }))
          .sort((a, b) => a.px - b.px)

        // Default breakpoint: 0 → first breakpoint
        const defaultIdeal = mergedIdeals['_']
        if (defaultIdeal) {
          bpContextMap.set('0', {
            ideal: parsePx(defaultIdeal),
            start: 0,
            end: sorted[0]?.px,
          })
        }

        for (let i = 0; i < sorted.length; i++) {
          const { name, px } = sorted[i]
          const idealValue = mergedIdeals[name]
          const ideal = idealValue ? parsePx(idealValue) : px
          const end = sorted[i + 1]?.px
          bpContextMap.set(String(px), { ideal, start: px, end })
        }
      }

      theme.ideals = mergedIdeals
    },
  }
}
