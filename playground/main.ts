import { createGenerator, type Preset } from '@unocss/core'
import { presetMini } from 'unocss'
import { presetFloo, type FlooTheme } from '../src/index'

const breakpoints = { sm: '640px', md: '768px', lg: '1280px', xl: '1440px' }

const uno = await createGenerator({
  theme: { breakpoints },
  presets: [presetMini() as Preset<FlooTheme>, presetFloo()],
})

// Each example defines classes and the HTML to render in the preview iframe
const examples = [
  {
    label: 'Scale (linear)',
    classes: 'md:text-size-[~100px]',
    html: '<p class="demo-text">Hello</p>',
    desc: 'Font size scales linearly with viewport width from the md breakpoint.',
  },
  {
    label: 'Range (interpolate)',
    classes: 'md:text-size-[~100px-200px]',
    html: '<p class="demo-text">Hello</p>',
    desc: 'Font size interpolates from 100px to 200px across the md\u2013lg range.',
  },
  {
    label: 'Dampened (/2)',
    classes: 'md:text-size-[~100px/2]',
    html: '<p class="demo-text">Hello</p>',
    desc: 'Font size scales at half the rate of the viewport.',
  },
  {
    label: 'Width + padding',
    classes: 'md:w-[~300px] md:p-[~24px]',
    html: '<div><div class="demo-box">Box</div></div>',
    desc: 'Both width and padding scale responsively.',
  },
  {
    label: 'Multiple breakpoints',
    classes: 'flex sm:gap-[~8px] md:gap-[~16px] lg:gap-[~24px]',
    html: '<div class="demo-grid"><div class="demo-cell">1</div><div class="demo-cell">2</div><div class="demo-cell">3</div><div class="demo-cell">4</div></div>',
    desc: 'Gap scales differently at each breakpoint.',
  },
  {
    label: 'Dampened /4',
    classes: 'md:text-size-[~100px/4]',
    html: '<p class="demo-text">Hello</p>',
    desc: 'Stronger dampening \u2014 font size changes very gradually.',
  },
  {
    label: 'Range with rem',
    classes: 'md:text-size-[~1rem-2rem]',
    html: '<p class="demo-text">Hello</p>',
    desc: 'Range expression using rem units.',
  },
]

// --- DOM refs ---

const input = document.getElementById('input') as HTMLTextAreaElement
const output = document.getElementById('output') as HTMLPreElement
const examplesEl = document.getElementById('examples') as HTMLDivElement
const iframeWrap = document.getElementById('iframeWrap') as HTMLDivElement
const iframe = document.getElementById('preview') as HTMLIFrameElement
const resizeHandle = document.getElementById('resizeHandle') as HTMLDivElement
const viewportButtons = document.getElementById(
  'viewportButtons',
) as HTMLDivElement
const widthLabel = document.getElementById('widthLabel') as HTMLSpanElement

// --- State ---

let activeExampleIndex = 0
let currentWidth = 768

// --- Viewport presets ---

const viewports = [
  { label: '375', width: 375 },
  { label: '640', width: 640 },
  { label: '768', width: 768 },
  { label: '1024', width: 1024 },
  { label: '1280', width: 1280 },
  { label: '1440', width: 1440 },
]

for (const vp of viewports) {
  const btn = document.createElement('button')
  btn.textContent = vp.label
  btn.dataset.width = String(vp.width)
  btn.addEventListener('click', () => setWidth(vp.width))
  viewportButtons.appendChild(btn)
}

function updateViewportButtonState() {
  for (const btn of viewportButtons.querySelectorAll('button')) {
    const w = Number((btn as HTMLButtonElement).dataset.width)
    btn.classList.toggle('active', w === currentWidth)
  }
}

function setWidth(w: number) {
  const maxW = iframeWrap.parentElement!.clientWidth
  currentWidth = Math.max(200, Math.min(w, maxW))
  iframeWrap.style.width = `${currentWidth}px`
  widthLabel.textContent = `${currentWidth}px`
  updateViewportButtonState()
}

// --- Drag-to-resize ---

let dragging = false

resizeHandle.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  dragging = true
  iframeWrap.classList.add('dragging')
  resizeHandle.classList.add('active')
  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', onDragEnd)
})

function onDrag(e: PointerEvent) {
  if (!dragging) return
  const rect = iframeWrap.parentElement!.getBoundingClientRect()
  const w = Math.round(e.clientX - rect.left)
  currentWidth = Math.max(200, Math.min(w, rect.width))
  iframeWrap.style.width = `${currentWidth}px`
  widthLabel.textContent = `${currentWidth}px`
  updateViewportButtonState()
}

function onDragEnd() {
  dragging = false
  iframeWrap.classList.remove('dragging')
  resizeHandle.classList.remove('active')
  document.removeEventListener('pointermove', onDrag)
  document.removeEventListener('pointerup', onDragEnd)
}

// --- Example buttons ---

const exampleButtons: HTMLButtonElement[] = []

for (let i = 0; i < examples.length; i++) {
  const ex = examples[i]
  const btn = document.createElement('button')
  btn.textContent = ex.label
  btn.addEventListener('click', () => {
    activeExampleIndex = i
    input.value = ex.classes
    updateExampleButtonState()
    generate()
  })
  examplesEl.appendChild(btn)
  exampleButtons.push(btn)
}

function updateExampleButtonState() {
  exampleButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === activeExampleIndex)
  })
}

// --- Generation ---

const previewStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; padding: 1.5rem; }
  .demo-text { line-height: 1.2; color: #1a1a2e; }
  .demo-box {
    background: #6c63ff; color: #fff; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem; font-weight: 600; min-height: 80px;
  }
  .demo-grid {
    display: flex; flex-wrap: wrap;
  }
  .demo-cell {
    width: 60px; height: 60px; background: #6c63ff; color: #fff;
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 1.1rem;
  }
  .desc {
    margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #eee;
    font-size: 0.85rem; color: #888; line-height: 1.4;
  }
`

async function generate() {
  const classes = input.value.trim().split(/\s+/).filter(Boolean)
  const { css } = await uno.generate(new Set(classes))

  // Clean CSS for display
  const cleaned = css
    .split('\n')
    .filter(
      (l) =>
        !l.includes('--un-') &&
        !l.includes('preflights') &&
        !l.includes('backdrop'),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  output.textContent = cleaned || '/* no output */'

  // Update iframe preview
  const ex = examples[activeExampleIndex]
  const previewHtml = ex?.html ?? '<p class="demo-text">Preview</p>'
  const desc = ex?.desc ?? ''

  // Apply the generated classes to the preview element's root child
  const classAttr = classes.join(' ')

  // Wrap the preview HTML so the classes apply to the outer element
  const wrappedHtml = previewHtml
    .replace(/^<(\w+)(\s)/, `<$1 class="${classAttr}"$2`)
    .replace(/^<(\w+)>/, `<$1 class="${classAttr}">`)

  const doc = `<!DOCTYPE html>
<html><head>
<style>${previewStyles}</style>
<style>${css}</style>
</head><body>
${wrappedHtml}
${desc ? `<p class="desc">${desc}</p>` : ''}
</body></html>`

  const blob = new Blob([doc], { type: 'text/html' })
  iframe.src = URL.createObjectURL(blob)
}

// --- Init ---

input.value = examples[0].classes
updateExampleButtonState()
setWidth(768)
input.addEventListener('input', generate)
generate()
