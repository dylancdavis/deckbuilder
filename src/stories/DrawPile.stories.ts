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

// Each option names a way to spread and shade the pile. Directions are the step from each card
// to the one below it, and the shadow is cast the same way.
const directions = { horizontal: [-1, 0], diagonal: [-1, 1] } as const
const spacings = { tight: 4, normal: 6, wide: 10 } as const
const shadows = {
  none: { offset: 0, blur: 0, opacity: 0 },
  soft: { offset: 1, blur: 2, opacity: 0.25 },
  hard: { offset: 2, blur: 2, opacity: 0.5 },
} as const
const darkens = { none: 0, light: 0.06, strong: 0.12 } as const

interface PileArgs {
  direction: keyof typeof directions
  spacing: keyof typeof spacings
  shadow: keyof typeof shadows
  darken: keyof typeof darkens
  depth: number
  count: number
}

const toPileStyle = (args: PileArgs): PileStyle => {
  const [x, y] = directions[args.direction]
  const spacing = spacings[args.spacing]
  const shadow = shadows[args.shadow]
  return {
    depth: args.depth,
    dx: x * spacing,
    dy: y * spacing,
    shadowX: x * shadow.offset,
    shadowY: y * shadow.offset,
    shadowBlur: shadow.blur,
    shadowOpacity: shadow.opacity,
    darken: darkens[args.darken],
  }
}

const select = (options: object) => ({
  control: { type: 'inline-radio' as const },
  options: keys(options),
})

const meta: Meta = {
  title: 'Mockups/Draw Pile',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// The run view's pile, beside a mockup built from the controls. The defaults match the run view;
// the old pile was horizontal, normal spacing, hard shadow, no darkening.
export const DrawPile: StoryObj<PileArgs> = {
  args: {
    direction: 'diagonal',
    spacing: 'tight',
    shadow: 'soft',
    darken: 'strong',
    depth: 3,
    count: 12,
  },
  argTypes: {
    direction: select(directions),
    spacing: select(spacings),
    shadow: select(shadows),
    darken: select(darkens),
    depth: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    count: { control: { type: 'range', min: 1, max: 40, step: 1 } },
  },
  render: (args) => ({
    components: { CardBack, CardCount, PileMockup },
    setup: () => ({ args, tilt: TILT_PRESETS.minimal, pile: () => toPileStyle(args) }),
    template: `
      <div class="draw-pile-row">
        <div class="draw-pile-cell">
          <div class="draw-pile">
            <CardBack v-for="i in 3" :key="i" :tilt="tilt" />
            <CardCount :count="args.count" />
          </div>
          <span>run view</span>
        </div>
        <div class="draw-pile-cell">
          <PileMockup :pile="pile()" :count="args.count" />
          <span>mockup</span>
        </div>
      </div>
    `,
  }),
}
