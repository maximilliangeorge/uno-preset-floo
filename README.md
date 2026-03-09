# unocss-preset-floo

A [UnoCSS](https://unocss.dev) preset for fluid responsive design. The preset provides a simple expression language that compiles to `calc()` functions for smooth, viewport-aware scaling — no complex media query math required.

[Try the playground](https://maximilliangeorge.github.io/unocss-preset-floo/)

## Install

```bash
pnpm add -D unocss-preset-floo
```

## Setup

```ts
// uno.config.ts
import { defineConfig, presetUno } from 'unocss'
import { presetFloo } from 'unocss-preset-floo'

export default defineConfig({
  presets: [presetUno(), presetFloo(sweetspots: {
    // Read more about sweetspots down below
  })],
})
```

## Rationale

Traditional responsive design relies on stepped breakpoints that snap between fixed layouts at arbitrary viewport widths. Floo takes a different approach: values scale smoothly with the viewport, so elements adapt fluidly rather than jumping between states.

Floo introduces the concept of **sweetspots** — the ideal width from your design file. When you write `md:text-[~48px]`, you're saying "this text should be 48px at the `md` _sweetspot_ width, and scale proportionally from there." This maps directly to how designers work: designs are made for a _sweetspot_ viewport width, usually a common screen size.

> Sweetspots and breakpoints are _not_ the same. Breakpoints define where a layout breaks and warrants a reflow. Sweetspots denote the viewport width the designer had in mind when working on the design.

Floo provides three intuitive expression patterns that cover most fluid design needs:

- Scale expressions (`~48px`) make values grow or shrink linearly with viewport width, based on the sweetspot.
- Dampened expressions (`~48px@0.5`) scale at a reduced rate for a throttled responsive behavior.
- Ranged expressions (`~16px-24px`) that interpolate between two values across a _breakpoint_ range.
- All three generate the appropriate `calc()` functions automatically, so you never have to write verbose viewport math by hand.

Because Floo works as a UnoCSS preset, it integrates seamlessly with your existing utility classes. Any utility that accepts arbitrary values—whether `w-`, `h-`, `p-`, `m-`, `gap-`, `text-`, or others—can use fluid expressions. This means you get fluid responsive behavior without learning a new API or changing how you write styles.

## Usage

Prefix any arbitrary value with `~` to create a fluid expression:

```html
<!-- Scale: value scales linearly with viewport -->
<h1 class="md:text-[~48px]">Fluid heading</h1>

<!-- Range: interpolate between two values across a breakpoint range -->
<p class="md:text-[~16px-24px]">Grows from 16px to 24px</p>

<!-- Dampened: scales at a reduced rate -->
<div class="md:p-[~32px@0.5]">Half-rate padding</div>
```

Works with any utility that accepts arbitrary values — `w-`, `h-`, `p-`, `m-`, `gap-`, `text-`, etc.

## Expressions

### Scale — `~{value}{unit}`

Scales linearly with viewport width relative to the sweetspot frame width.

```
md:text-[~48px]
→ calc(48px * 100vw / 768px)
```

### Range — `~{start}{unit}-{end}{unit}`

Interpolates between two values across the current breakpoint's range.

```
md:text-[~16px-24px]
→ calc(16px + 8px * (100vw - 768px) / 512px)
```

### Dampened — `~{value}{unit}@{factor}`

Scales at a reduced rate controlled by the dampening factor.

```
md:text-[~48px@0.5]
→ calc(48px * (1 + (100vw - 768px) / 768px * 0.5))
```

## Configuration

### Sweetspots

Each breakpoint has a **sweetspot** — usually the Figma frame width. Non-ranged expressions scale relative to these sweetspots.

Defaults:

| Breakpoint    | Sweetspot |
| ------------- | --------- |
| `_` (default) | 375px     |
| `sm`          | 390px     |
| `md`          | 768px     |
| `lg`          | 1280px    |
| `xl`          | 1440px    |

Override or extend with the `sweetspots` option:

```ts
presetFloo({
  sweetspots: {
    _: '360px',
    md: '800px',
    '2xl': '1920px',
  },
})
```

Sweetspot keys must match your theme's breakpoint keys (except `_`, which is the default/mobile breakpoint).

## Development

```bash
pnpm install        # Install dependencies
pnpm build          # Build the library
pnpm test           # Run tests
pnpm test:watch     # Run tests in watch mode
pnpm playground     # Launch interactive playground
pnpm typecheck      # Type-check
```

## License

MIT
