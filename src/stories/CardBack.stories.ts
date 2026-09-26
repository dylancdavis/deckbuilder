import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { computed, defineComponent, type PropType } from 'vue'
import CardBack from '@/components/CardBack.vue'
import { entries, fromEntries, keys } from '@/utils/utils'
import './card-back-mockups.css'

interface RangeControl {
  var: string
  default: number
  min: number
  max: number
  step: number
}

interface ColorControl {
  var: string
  default: string
}

type ControlSpec = Record<string, RangeControl | ColorControl>

type ControlArgs<S extends ControlSpec> = {
  [K in keyof S]: S[K] extends RangeControl ? number : string
}

const controlArgs = <S extends ControlSpec>(spec: S) =>
  fromEntries(entries(spec).map(([name, control]) => [name, control.default])) as ControlArgs<S>

const controlArgTypes = <S extends ControlSpec>(spec: S) =>
  fromEntries(
    entries(spec).map(([name, control]) => [
      name,
      'min' in control
        ? {
            control: {
              type: 'range' as const,
              min: control.min,
              max: control.max,
              step: control.step,
            },
          }
        : { control: { type: 'color' as const } },
    ]),
  )

const controlStyle = <S extends ControlSpec>(spec: S, args: ControlArgs<S>) =>
  fromEntries(entries(spec).map(([name, control]) => [`--mock-${control.var}`, `${args[name]}`]))

// Controls shared by both patterns, each feeding a --mock-* variable. Sizes are in the card's
// 250-wide units. The defaults leave every overlay off.
const overlayControls = {
  cardWidth: { var: 'card-width', default: 200, min: 80, max: 400, step: 10 },
  tintTop: { var: 'tint-top', default: '#ffffff' },
  tintBottom: { var: 'tint-bottom', default: '#ffffff' },
  glowColor: { var: 'glow-color', default: '#ffffff' },
  glowStrength: { var: 'glow-strength', default: 0, min: 0, max: 1, step: 0.05 },
  glowRadius: { var: 'glow-radius', default: 60, min: 10, max: 100, step: 1 },
  frameColor: { var: 'frame-color', default: '#141414' },
  frameWidth: { var: 'frame-width', default: 0, min: 0, max: 20, step: 0.5 },
  frameInset: { var: 'frame-inset', default: 12, min: 0, max: 60, step: 1 },
  frameRadius: { var: 'frame-radius', default: 12, min: 0, max: 40, step: 0.5 },
  emblemDark: { var: 'emblem-dark', default: '#141414' },
  emblemLight: { var: 'emblem-light', default: '#dfdfdf' },
  emblemSize: { var: 'emblem-size', default: 0, min: 0, max: 200, step: 1 },
} as const

// The hexagon defaults match the old card back: 8px hexagons on a 200px card, #ededed on #dfdfdf
const hexControls = {
  hexSize: { var: 'hex-size', default: 10, min: 3, max: 60, step: 0.5 },
  hexColor: { var: 'hex-color', default: '#ededed' },
  seamColor: { var: 'seam-color', default: '#dfdfdf' },
  hexSeam: { var: 'hex-seam', default: 0.5, min: 0, max: 20, step: 0.1 },
  ...overlayControls,
} as const

const stripeControls = {
  stripeAngle: { var: 'stripe-angle', default: 45, min: 0, max: 180, step: 5 },
  stripeColor: { var: 'stripe-color', default: '#1077d2' },
  gapColor: { var: 'gap-color', default: '#093153' },
  stripeWidth: { var: 'stripe-width', default: 10, min: 1, max: 60, step: 0.5 },
  stripeGap: { var: 'stripe-gap', default: 10, min: 0, max: 60, step: 0.5 },
  ...overlayControls,
} as const

// Palettes for the wide diagonal stripes: the lighter stripe and the darker gap
const widePalettes = {
  violet: { stripe: '#52259a', gap: '#3a1870' },
  grey: { stripe: '#8a8a8a', gap: '#747474' },
  charcoal: { stripe: '#3a3a3a', gap: '#2a2a2a' },
  'card blue': { stripe: '#1077d2', gap: '#0b5ea8' },
  slate: { stripe: '#3d5a80', gap: '#2e4766' },
  sage: { stripe: '#6b8f71', gap: '#577a5d' },
  rose: { stripe: '#b5485d', gap: '#983a4d' },
}

type WidePalette = keyof typeof widePalettes

type EmblemShape = 'card' | 'square'

const emblemShapes: EmblemShape[] = ['card', 'square']

type EmblemLayer = 'dark' | 'light'

// The layers of Deckbuilder Card Icon.svg and Deckbuilder Icon.svg, cropped to their content.
// The icon is two-toned here: the blue and orange cards are dark and the white mark between
// them is light, filled from the story's --mock-emblem-* colours.
const emblems: Record<EmblemShape, { viewBox: string; layers: [EmblemLayer, string][] }> = {
  card: {
    viewBox: '48 10.7 190.4 228.6',
    layers: [
      [
        'dark',
        'm48.0 23.378935c0 -6.99325 5.6691513 -12.662399 12.662399 -12.662399l134.6752 0c3.3582764 0 6.57901 1.3340702 8.953674 3.7087307c2.374649 2.3746605 3.708725 5.595392 3.708725 8.953669l0 171.96654c0 6.9932556 -5.6691437 12.662399 -12.662399 12.662399l-134.6752 0c-6.993248 0 -12.662399 -5.6691437 -12.662399 -12.662399z',
      ],
      [
        'dark',
        'm78.614174 53.993107c0 -6.993248 5.6691513 -12.662399 12.662399 -12.662399l134.6752 0c3.3582764 0 6.57901 1.3340721 8.953674 3.7087326c2.3746643 2.3746605 3.708725 5.5953903 3.708725 8.953667l0 171.96654c0 6.9932556 -5.6691437 12.662399 -12.662399 12.662399l-134.6752 0c-6.993248 0 -12.662399 -5.6691437 -12.662399 -12.662399z',
      ],
      ['dark', 'm67.3114 32.483482l79.37009 0l0 66.99213l-79.37009 0z'],
      [
        'light',
        'm143.30708 41.330708l64.69292 0c2.89917E-4 0 5.645752E-4 1.1444092E-4 7.6293945E-4 3.1661987E-4c1.9836426E-4 2.0217896E-4 3.2043457E-4 4.7683716E-4 3.2043457E-4 7.6293945E-4l-0.001083374 101.98317c0 35.728912 -28.964005 64.69292 -64.69292 64.69292l-64.69291 0c-5.950928E-4 0 -0.0010757446 -4.8828125E-4 -0.0010757446 -0.001083374l0.0010757446 -101.98317c0 -35.728905 28.964005 -64.69292 64.69291 -64.69292z',
      ],
    ],
  },
  square: {
    viewBox: '48 48 192 192',
    layers: [
      [
        'dark',
        'm80.0 92.6624c0 -6.993248 5.6691513 -12.662399 12.662399 -12.662399l134.6752 0c3.3582764 0 6.57901 1.3340683 8.953674 3.7087326c2.374649 2.3746567 3.708725 5.5953903 3.708725 8.953667l0 134.6752c0 6.9932556 -5.6691437 12.662399 -12.662399 12.662399l-134.6752 0c-6.993248 0 -12.662399 -5.6691437 -12.662399 -12.662399z',
      ],
      [
        'dark',
        'm48.0 60.6624c0 -6.993248 5.6691475 -12.662399 12.662399 -12.662399l134.6752 0c3.3582764 0 6.57901 1.3340721 8.953674 3.7087326c2.374649 2.3746605 3.708725 5.5953903 3.708725 8.953667l0 134.6752c0 6.9932556 -5.6691437 12.662399 -12.662399 12.662399l-134.6752 0c-6.993252 0 -12.662399 -5.6691437 -12.662399 -12.662399z',
      ],
      ['dark', 'm145.7098 147.41907l64.0 0l0 64.0l-64.0 0z'],
      [
        'light',
        'm100.12927 80.0l107.87073 0c2.746582E-4 0 5.493164E-4 1.1444092E-4 7.4768066E-4 3.1280518E-4c1.9836426E-4 1.9836426E-4 3.2043457E-4 4.7302246E-4 3.2043457E-4 7.5531006E-4l-0.0010681152 107.86966c0 11.117081 -9.012192 20.129272 -20.129288 20.129272l-107.87072 0c-5.874634E-4 0 -0.0010604858 -4.7302246E-4 -0.0010604858 -0.0010681152l0.0010604858 -107.86965c0 -11.117096 9.012192 -20.12928 20.12928 -20.12928z',
      ],
    ],
  },
}

const CardBackEmblem = defineComponent({
  props: { shape: { type: String as PropType<EmblemShape>, required: true } },
  setup: (props) => ({ emblem: computed(() => emblems[props.shape]) }),
  template: `
    <svg class="card-back-emblem" :viewBox="emblem.viewBox" aria-hidden="true">
      <path v-for="([layer, d], i) in emblem.layers" :key="i" :class="'emblem-' + layer" :d="d" />
    </svg>
  `,
})

interface EmblemArgs {
  emblemShape: EmblemShape
}

const emblemArgTypes = {
  emblemShape: { control: { type: 'inline-radio' as const }, options: emblemShapes },
}

const meta: Meta = {
  title: 'Mockups/Card Back',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// A group of controls for one card in a story showing several. Each arg is keyed by the card's
// name and the control's, and filed under the card's name in the controls table.
const controlGroup = <S extends ControlSpec>(group: string, spec: S) => {
  const argName = (name: keyof S) => `${group} ${String(name)}`
  return {
    args: fromEntries(entries(controlArgs(spec)).map(([name, value]) => [argName(name), value])),
    argTypes: fromEntries(
      entries(controlArgTypes(spec)).map(([name, argType]) => [
        argName(name),
        { ...argType, table: { category: group } },
      ]),
    ),
    pick: (args: Record<string, unknown>) =>
      fromEntries(keys(spec).map((name) => [name, args[argName(name)]])) as ControlArgs<S>,
  }
}

// Palettes for the large hexagons: the fill, the seam and the glow. The vignette, the emblem
// and the rest are worked out from these.
const largePalettes = {
  ember: { hex: '#b8321d', seam: '#3a0d06', glow: '#ffd08a' },
  violet: { hex: '#52259a', seam: '#b07cff', glow: '#b07cff' },
  'card blue': { hex: '#1077d2', seam: '#093153', glow: '#6bb8ff' },
  slate: { hex: '#3d5a80', seam: '#1f2f45', glow: '#98c1d9' },
  sage: { hex: '#6b8f71', seam: '#34503a', glow: '#cfe3c8' },
  rose: { hex: '#b5485d', seam: '#5c1f2c', glow: '#f2c4cc' },
  sand: { hex: '#c9b18e', seam: '#7a6547', glow: '#fff3dc' },
  grey: { hex: '#bdbdbd', seam: '#8a8a8a', glow: '#ffffff' },
}

type LargePalette = keyof typeof largePalettes

const largeHexagons = controlGroup('large', {
  hexSize: { ...hexControls.hexSize, default: 30 },
  hexSeam: { ...hexControls.hexSeam, default: 1 },
  glowStrength: { ...overlayControls.glowStrength, default: 0.35 },
  glowRadius: { ...overlayControls.glowRadius, default: 80 },
  emblemSize: { ...overlayControls.emblemSize, default: 110 },
  cardWidth: overlayControls.cardWidth,
} as const)

const largeToggles = ['rotated', 'glow', 'vignette', 'emblem'] as const

type LargeToggle = (typeof largeToggles)[number]

type HexagonsArgs = Record<string, unknown> &
  EmblemArgs & { 'large palette': LargePalette } & Record<`large ${LargeToggle}`, boolean>

// The palette colours everything; each toggle turns its overlay on
const largeStyle = (args: HexagonsArgs) => {
  const { hex, seam, glow } = largePalettes[args['large palette']]
  const { glowStrength, emblemSize, ...sizes } = largeHexagons.pick(args)
  const vignette = args['large vignette']
  return controlStyle(hexControls, {
    ...controlArgs(hexControls),
    ...sizes,
    hexColor: hex,
    seamColor: seam,
    glowColor: glow,
    glowStrength: args['large glow'] ? glowStrength : 0,
    tintTop: vignette ? glow : '#ffffff',
    tintBottom: vignette ? `color-mix(in srgb, ${hex} 40%, #000)` : '#ffffff',
    emblemDark: `color-mix(in srgb, ${hex} 45%, #000)`,
    emblemLight: `color-mix(in srgb, ${glow} 60%, ${hex})`,
    emblemSize: args['large emblem'] ? emblemSize : 0,
  })
}

// The current card back beside a large one, recoloured by palette
export const Hexagons: StoryObj<HexagonsArgs> = {
  args: {
    emblemShape: 'card',
    'large palette': 'ember',
    'large rotated': true,
    'large glow': false,
    'large vignette': true,
    'large emblem': true,
    ...largeHexagons.args,
  },
  argTypes: {
    ...emblemArgTypes,
    'large palette': {
      control: { type: 'select' },
      options: keys(largePalettes),
      table: { category: 'large' },
    },
    ...fromEntries(
      largeToggles.map((toggle) => [
        `large ${toggle}`,
        { control: { type: 'boolean' as const }, table: { category: 'large' } },
      ]),
    ),
    ...largeHexagons.argTypes,
  },
  render: (args) => ({
    components: { CardBack, CardBackEmblem },
    setup: () => ({ args, style: () => largeStyle(args) }),
    template: `
      <div class="card-back-row">
        <div class="card-back-cell">
          <CardBack />
          <span>current</span>
        </div>
        <div class="card-back-cell">
          <div class="card-back-mockup" data-pattern="hexagons" :data-rotated="args['large rotated'] || undefined" :style="style()">
            <CardBack />
            <CardBackEmblem :shape="args.emblemShape" />
          </div>
          <span>large</span>
        </div>
      </div>
    `,
  }),
}

// Plain stripes, with every control
const basicStripes = controlGroup('basic', stripeControls)

const basicStyle = (args: ControlArgs<typeof stripeControls>) => controlStyle(stripeControls, args)

// The wide diagonal stripes, with the palette picked from a dropdown. The emblem's dark tone is
// the gap darkened, and the inner border shares it; its light tone is the stripe.
const wideStripes = controlGroup('wide', {
  stripeAngle: { ...stripeControls.stripeAngle, default: 135 },
  stripeWidth: { ...stripeControls.stripeWidth, default: 12 },
  stripeGap: { ...stripeControls.stripeGap, default: 12 },
  frameWidth: { ...overlayControls.frameWidth, default: 6 },
  frameInset: { ...overlayControls.frameInset, default: 12 },
  frameRadius: overlayControls.frameRadius,
  emblemSize: { ...overlayControls.emblemSize, default: 92 },
  cardWidth: overlayControls.cardWidth,
} as const)

const wideStyle = (palette: WidePalette, args: ReturnType<typeof wideStripes.pick>) => {
  const { stripe, gap } = widePalettes[palette]
  const dark = `color-mix(in srgb, ${gap} 55%, #000)`
  return controlStyle(stripeControls, {
    ...controlArgs(stripeControls),
    ...args,
    stripeColor: stripe,
    gapColor: gap,
    frameColor: dark,
    emblemDark: dark,
    emblemLight: stripe,
  })
}

// Horizontal stripes, shaded from the top down
const horizontalStripes = controlGroup('horizontal', {
  stripeAngle: { ...stripeControls.stripeAngle, default: 0 },
  stripeColor: { ...stripeControls.stripeColor, default: '#ffa94d' },
  gapColor: { ...stripeControls.gapColor, default: '#b85400' },
  stripeWidth: { ...stripeControls.stripeWidth, default: 6 },
  stripeGap: { ...stripeControls.stripeGap, default: 6 },
  tintTop: overlayControls.tintTop,
  tintBottom: { ...overlayControls.tintBottom, default: '#6a2400' },
  cardWidth: overlayControls.cardWidth,
} as const)

const horizontalStyle = (args: ReturnType<typeof horizontalStripes.pick>) =>
  controlStyle(stripeControls, { ...controlArgs(stripeControls), ...args })

type StripesArgs = Record<string, unknown> & EmblemArgs & { 'wide palette': WidePalette }

export const Stripes: StoryObj<StripesArgs> = {
  args: {
    emblemShape: 'card',
    ...basicStripes.args,
    'wide palette': 'grey',
    ...wideStripes.args,
    ...horizontalStripes.args,
  },
  argTypes: {
    ...emblemArgTypes,
    ...basicStripes.argTypes,
    'wide palette': {
      control: { type: 'select' },
      options: keys(widePalettes),
      table: { category: 'wide' },
    },
    ...wideStripes.argTypes,
    ...horizontalStripes.argTypes,
  },
  render: (args) => ({
    components: { CardBack, CardBackEmblem },
    setup: () => ({
      args,
      cells: () => [
        { label: 'basic', style: basicStyle(basicStripes.pick(args)) },
        { label: 'wide', style: wideStyle(args['wide palette'], wideStripes.pick(args)) },
        { label: 'horizontal', style: horizontalStyle(horizontalStripes.pick(args)) },
      ],
    }),
    template: `
      <div class="card-back-row">
        <div v-for="{ label, style } in cells()" :key="label" class="card-back-cell">
          <div class="card-back-mockup" data-pattern="stripes" :style="style">
            <CardBack />
            <CardBackEmblem :shape="args.emblemShape" />
          </div>
          <span>{{ label }}</span>
        </div>
      </div>
    `,
  }),
}
