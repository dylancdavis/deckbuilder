import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, type PropType } from 'vue'
import CardBack from '@/components/CardBack.vue'
import CardCount from '@/components/CardCount.vue'
import { TILT_PRESETS } from '@/composables/useTilt'
import { entries, fromEntries, keys } from '@/utils/utils'
import './draw-pile-mockups.css'

// How a pile is spread and shaded. Offsets are per card, in px; darken is the brightness each
// card loses per step down the pile.
interface PileStyle {
  depth: number
  dx: number
  dy: number
  shadowX: number
  shadowY: number
  shadowBlur: number
  shadowOpacity: number
  darken: number
}

const pileStyle = (style: PileStyle) =>
  fromEntries(
    entries(style).map(([name, value]) => [
      `--pile-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
      name === 'depth' || name === 'shadowOpacity' || name === 'darken' ? `${value}` : `${value}px`,
    ]),
  )

// A pile of card backs spread by the style, with the top card first
const PileMockup = defineComponent({
  components: { CardBack, CardCount },
  props: {
    pile: { type: Object as PropType<PileStyle>, required: true },
    count: { type: Number, required: true },
  },
  setup: () => ({ tilt: TILT_PRESETS.minimal }),
  template: `
    <div class="draw-pile-mockup" :style="pileStyle(pile)">
      <CardBack v-for="i in pile.depth" :key="i" :style="{ '--i': i - 1 }" :tilt="tilt" />
      <CardCount :count="count" />
    </div>
  `,
  methods: { pileStyle },
})

// The run view's old pile: 0.375em (6px) to the left per card, with a hard shadow cast to the left
const horizontal: PileStyle = {
  depth: 3,
  dx: -6,
  dy: 0,
  shadowX: -2,
  shadowY: 0,
  shadowBlur: 2,
  shadowOpacity: 0.5,
  darken: 0,
}

// Spread from the top right down to the bottom left, each shadow cast the same way
const diagonal: PileStyle = { ...horizontal, dx: -6, dy: 6, shadowX: -2, shadowY: 2 }

const variants: Record<string, PileStyle> = {
  'diagonal, old shadow': diagonal,
  'diagonal, soft shadow': {
    ...diagonal,
    shadowX: -1,
    shadowY: 1,
    shadowBlur: 3,
    shadowOpacity: 0.2,
  },
  'diagonal, no shadow, darkened': { ...diagonal, shadowOpacity: 0, darken: 0.12 },
  'tight diagonal, soft shadow': {
    ...diagonal,
    dx: -4,
    dy: 4,
    shadowX: -1,
    shadowY: 1,
    shadowBlur: 2,
    shadowOpacity: 0.25,
  },
  'tight diagonal, soft shadow, darkened': {
    ...diagonal,
    dx: -4,
    dy: 4,
    shadowX: -1,
    shadowY: 1,
    shadowBlur: 2,
    shadowOpacity: 0.25,
    darken: 0.12,
  },
  'wide diagonal, soft shadow, darkened': {
    ...diagonal,
    dx: -10,
    dy: 10,
    shadowX: -1,
    shadowY: 1,
    shadowBlur: 3,
    shadowOpacity: 0.2,
    darken: 0.08,
  },
}

const meta: Meta = {
  title: 'Mockups/Draw Pile',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// The run view's markup and styles, beside the old horizontal pile and the variants
export const Variants: StoryObj<{ count: number }> = {
  args: { count: 12 },
  argTypes: { count: { control: { type: 'range', min: 1, max: 40, step: 1 } } },
  render: (args) => ({
    components: { CardBack, CardCount, PileMockup },
    setup: () => ({
      args,
      tilt: TILT_PRESETS.minimal,
      cells: [['old horizontal', horizontal], ...entries(variants)] as [string, PileStyle][],
    }),
    template: `
      <div class="draw-pile-row">
        <div class="draw-pile-cell">
          <div class="draw-pile">
            <CardBack v-for="i in 3" :key="i" :tilt="tilt" />
            <CardCount :count="args.count" />
          </div>
          <span>run view</span>
        </div>
        <div v-for="[label, pile] in cells" :key="label" class="draw-pile-cell">
          <PileMockup :pile="pile" :count="args.count" />
          <span>{{ label }}</span>
        </div>
      </div>
    `,
  }),
}

const ranges: Record<keyof PileStyle, { min: number; max: number; step: number }> = {
  depth: { min: 1, max: 6, step: 1 },
  dx: { min: -20, max: 20, step: 1 },
  dy: { min: -20, max: 20, step: 1 },
  shadowX: { min: -8, max: 8, step: 0.5 },
  shadowY: { min: -8, max: 8, step: 0.5 },
  shadowBlur: { min: 0, max: 16, step: 0.5 },
  shadowOpacity: { min: 0, max: 1, step: 0.05 },
  darken: { min: 0, max: 0.3, step: 0.01 },
}

// Every knob of the pile, starting from the plain diagonal
export const Playground: StoryObj<PileStyle & { count: number }> = {
  args: { ...diagonal, count: 12 },
  argTypes: fromEntries(
    [...keys(ranges), 'count' as const].map((name) => [
      name,
      {
        control: {
          type: 'range' as const,
          ...(name === 'count' ? { min: 1, max: 40, step: 1 } : ranges[name]),
        },
      },
    ]),
  ),
  render: (args) => ({
    components: { PileMockup },
    setup: () => ({ args }),
    template: `
      <div class="draw-pile-row">
        <PileMockup :pile="args" :count="args.count" />
      </div>
    `,
  }),
}
