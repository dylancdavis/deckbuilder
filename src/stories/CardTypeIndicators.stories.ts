import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CardItem from '@/components/CardItem.vue'
import { cardCategory, cards, type Card, type CardCategory } from '@/utils/cards'
import { entries, fromEntries, keys } from '@/utils/utils'
import './card-type-mockups.css'

type Decor =
  | 'double'
  | 'double-drawn'
  | 'double-edges'
  | 'double-corners'
  | 'ribbon'
  | 'ribbon-striped'
  | 'ribbon-bottom'
  | 'indents'
  | 'indents-trapezoid'
  | 'perforated'

type Layout = 'band' | 'full-art' | 'full-art-flush' | 'corner'

interface Sample {
  card: Card
  category: CardCategory
  decor?: Decor
  layout?: Layout
  label?: string
}

const samples: Sample[] = [cards.score, cards['draw-bonus'], cards['basic-entity']].map((card) => ({
  card,
  category: cardCategory(card),
}))

// One card per border decor, on the category it's being tried against
const [action, aura, entity] = samples as [Sample, Sample, Sample]
const frameSamples: Sample[] = [
  { ...action, label: 'action · plain' },
  { ...aura, decor: 'double', label: 'aura · double' },
  { ...aura, decor: 'double-drawn', label: 'aura · drawn double' },
  { ...aura, decor: 'double-edges', label: 'aura · double edges' },
  { ...aura, decor: 'double-corners', label: 'aura · double corners' },
  { ...entity, decor: 'ribbon', label: 'entity · ribbon' },
  { ...entity, decor: 'ribbon-striped', label: 'entity · striped ribbon' },
  { ...entity, decor: 'ribbon-bottom', label: 'entity · bottom ribbon' },
  { ...action, decor: 'indents', label: 'action · indents' },
  { ...action, decor: 'indents-trapezoid', label: 'action · trapezoid indents' },
  { ...action, decor: 'perforated', label: 'action · perforated' },
]

// The standard action beside each layout, all on the action card
const layoutSamples: Sample[] = [
  { ...action, label: 'standard' },
  { ...action, layout: 'band', label: 'band' },
  { ...action, layout: 'full-art', label: 'full art' },
  { ...action, layout: 'full-art-flush', label: 'full art · flush' },
  { ...action, layout: 'corner', label: 'corner cut-out' },
]

type Variant = 'current' | 'layouts' | 'type-line'

const renderVariant =
  (variant: Variant, cells: Sample[] = samples) =>
  () => ({
    components: { CardItem },
    setup: () => ({ cells, variant }),
    template: `
    <div :class="['mockup-row', 'mockup-' + variant]">
      <div v-for="{ card, category, decor, layout, label } in cells" :key="label ?? card.id" class="mockup-cell" :data-category="category" :data-decor="decor" :data-layout="layout">
        <CardItem :card="card" />
        <span>{{ label ?? category }}</span>
      </div>
    </div>
  `,
  })

const meta: Meta = {
  title: 'Mockups/Card Type Indicators',
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Current: Story = { render: renderVariant('current') }
export const Layouts: Story = { render: renderVariant('layouts', layoutSamples) }
export const TypeLine: Story = { render: renderVariant('type-line') }

// Frame controls, each feeding a --mock-* variable. Sizes are in the card's 250-wide units.
const frameControls = {
  cardWidth: { var: 'card-width', default: 200, min: 120, max: 400, step: 10 },
  borderColor: { var: 'border-color', default: '#141414' },
  borderWidth: { var: 'border-width', default: 4, min: 0, max: 16, step: 0.5 },
  decorColor: { var: 'decor-color', default: '#141414' },
  decorSecondaryColor: { var: 'decor-secondary-color', default: '#333333' },
  faceTop: { var: 'face-top', default: '#cccccc' },
  faceBottom: { var: 'face-bottom', default: '#919191' },
  doubleWidth: { var: 'double-width', default: 7, min: 3, max: 16, step: 0.5 },
  doubleGap: { var: 'double-gap', default: '#bdbdbd' },
  doubleCorner: { var: 'double-corner', default: 60, min: 0, max: 140, step: 1 },
  doubleTieWidth: { var: 'double-tie-width', default: 2, min: 0.5, max: 10, step: 0.5 },
  doubleTransition: { var: 'double-transition', default: 16, min: 1, max: 60, step: 1 },
  ribbonInset: { var: 'ribbon-inset', default: 20, min: 0, max: 80, step: 1 },
  ribbonWidth: { var: 'ribbon-width', default: 22, min: 2, max: 60, step: 1 },
  stripeCount: { var: 'stripe-count', default: 4, min: 1, max: 10, step: 1 },
  stripeInset: { var: 'stripe-inset', default: 0, min: 0, max: 80, step: 1 },
  stripeWidth: { var: 'stripe-width', default: 4, min: 0.5, max: 20, step: 0.5 },
  stripeGap: { var: 'stripe-gap', default: 4, min: 0.5, max: 20, step: 0.5 },
  indentDepth: { var: 'indent-depth', default: 9, min: 2, max: 30, step: 0.5 },
  trapezoidDepth: { var: 'trapezoid-depth', default: 6, min: 2, max: 30, step: 0.5 },
  trapezoidFlat: { var: 'trapezoid-flat', default: 30, min: 0, max: 120, step: 1 },
  perforationDash: { var: 'perforation-dash', default: 8, min: 1, max: 120, step: 0.5 },
  perforationGap: { var: 'perforation-gap', default: 6, min: 1, max: 120, step: 0.5 },
  perforationThickness: { var: 'perforation-thickness', default: 2, min: 0.5, max: 30, step: 0.5 },
  perforationOffset: { var: 'perforation-offset', default: 4, min: 0, max: 60, step: 0.5 },
} as const

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

type TypeLinePosition = 'none' | 'top' | 'top-left' | 'bottom' | 'bottom-right'

const typeLinePositions: TypeLinePosition[] = ['none', 'top', 'top-left', 'bottom', 'bottom-right']

type TransitionShape = 'curve' | 'angle'

const transitionShapes: TransitionShape[] = ['curve', 'angle']

type FrameArgs = ControlArgs<typeof frameControls> & {
  typeLine: TypeLinePosition
  transitionShape: TransitionShape
}

// Gradient stops for the striped ribbon: clear up to the inset, then alternating stripes and
// gaps, then clear again. The stripes step from the decor colour at the corner to the
// secondary colour furthest in. It's set on the row, where var() references would resolve
// before reaching the card, so it's built from plain pixels and the control colours instead.
const stripeStops = ({
  cardWidth,
  decorColor,
  decorSecondaryColor,
  stripeCount,
  stripeInset,
  stripeWidth,
  stripeGap,
}: FrameArgs) => {
  const px = (units: number) => `${(cardWidth * units) / 250}px`
  const stripes = Array.from({ length: stripeCount }, (_, i) => {
    const start = stripeInset + i * (stripeWidth + stripeGap)
    const secondaryShare = stripeCount === 1 ? 0 : (i / (stripeCount - 1)) * 100
    const color = `color-mix(in srgb, ${decorSecondaryColor} ${secondaryShare}%, ${decorColor})`
    return `#0000 0 ${px(start)}, ${color} 0 ${px(start + stripeWidth)}`
  })
  return [...stripes, '#0000 0'].join(', ')
}

// Drawn doubles: the border split into the double's two lines all the way round, along the
// edges and plain at the corners, or the other way round. Drawn in CSS pixels over the card; each piece is drawn
// once in the top-left frame, where x runs along the top edge and y inward from it, and turned
// into place. Where the split meets the plain border, the line steps between the double's full
// width and the border's, as an S-curve over doubleTransition or a straight 45deg angle, and
// the gap tapers along it to a point. The straight edges snap to device pixels, as the border's own
// width does, so they stay sharp and line up with it. The full double also has a 45deg tie
// across its gap doubleCorner in from each corner.
type DoubleSplit = 'full' | 'edges' | 'corners'

const doubleSplits: Partial<Record<Decor, DoubleSplit>> = {
  'double-drawn': 'full',
  'double-edges': 'edges',
  'double-corners': 'corners',
}

const partialDouble = (
  split: DoubleSplit,
  {
    cardWidth,
    borderWidth,
    doubleWidth,
    doubleCorner,
    doubleTransition,
    doubleTieWidth,
    transitionShape,
  }: FrameArgs,
) => {
  const ratio = window.devicePixelRatio
  const px = (units: number) => (cardWidth * units) / 250
  const snap = (units: number) => Math.round(px(units) * ratio) / ratio
  // Snapping as a border width: never under one device pixel, otherwise rounded down
  const border = Math.max(1, Math.floor(px(borderWidth) * ratio)) / ratio
  const [outer, inner, full] = [1, 2, 3].map((i) => snap((doubleWidth * i) / 3)) as [
    number,
    number,
    number,
  ]
  const corner = px(doubleCorner)
  // How far a step between two depths runs along the edge: doubleTransition for a curve, and
  // the step's own depth for an angle, so it always rises at 45deg
  const runFor = (from: number, to: number) =>
    transitionShape === 'angle' ? Math.abs(to - from) : px(doubleTransition)
  const radius = px(16)
  const width = cardWidth
  const height = (cardWidth * 7) / 5

  // A step from the current point (x0, y0) to (x1, y1), running along the x or y axis. The
  // curve's control points sit halfway along the run, level with each end.
  const step = (along: 'x' | 'y', x0: number, y0: number, x1: number, y1: number) => {
    if (transitionShape === 'angle') return `L ${x1} ${y1}`
    return along === 'x'
      ? `C ${(x0 + x1) / 2} ${y0} ${(x0 + x1) / 2} ${y1} ${x1} ${y1}`
      : `C ${x0} ${(y0 + y1) / 2} ${x1} ${(y0 + y1) / 2} ${x1} ${y1}`
  }

  // Along the top edge: split from `at` in from either corner, stepping out of the border
  // before it
  const edge = (length: number, at: number) => {
    const end = length - at
    const band = (from: number, to: number) => {
      const run = runFor(from, to)
      return (
        `M ${at - run} ${from} ${step('x', at - run, from, at, to)} L ${end} ${to} ` +
        `${step('x', end, to, end + run, from)} Z`
      )
    }
    return { line: band(border, full), gap: band(outer, inner) }
  }

  // Around the top-left corner: split from doubleCorner along the top edge, round the corner
  // concentric with the card's, to doubleCorner down the left edge. Each band's inner side runs
  // there and back along the other depth, and the path is mirrored across the diagonal for the
  // left edge by swapping x and y.
  const cornerPiece = () => {
    const band = (from: number, to: number) => {
      const end = corner + runFor(from, to)
      const arc = (depth: number, sweep: 0 | 1) =>
        `A ${radius - depth} ${radius - depth} 0 0 ${sweep}`
      return (
        `M ${end} ${from} ${step('x', end, from, corner, to)} L ${radius} ${to} ` +
        `${arc(to, 0)} ${to} ${radius} L ${to} ${corner} ` +
        `${step('y', to, corner, from, end)} ` +
        `L ${from} ${radius} ${arc(from, 1)} ${radius} ${from} Z`
      )
    }
    return { line: band(border, full), gap: band(outer, inner) }
  }

  // Full: the split all the way round, as rings concentric with the card's edge. Each ring is
  // the rounded rectangle at one depth with the one at the other cut out of it (the paths fill
  // even-odd). Drawn once, untransformed.
  const roundedRect = (depth: number) => {
    const r = radius - depth
    const [right, bottom] = [width - depth, height - depth]
    return (
      `M ${depth + r} ${depth} H ${right - r} A ${r} ${r} 0 0 1 ${right} ${depth + r} ` +
      `V ${bottom - r} A ${r} ${r} 0 0 1 ${right - r} ${bottom} ` +
      `H ${depth + r} A ${r} ${r} 0 0 1 ${depth} ${bottom - r} ` +
      `V ${depth + r} A ${r} ${r} 0 0 1 ${depth + r} ${depth} Z`
    )
  }
  const ring = (from: number, to: number) => `${roundedRect(from)} ${roundedRect(to)}`

  const turns = [
    { transform: '', length: width },
    { transform: `translate(${width} 0) rotate(90)`, length: height },
    { transform: `translate(${width} ${height}) rotate(180)`, length: width },
    { transform: `translate(0 ${height}) rotate(-90)`, length: height },
  ]
  const viewBox = `0 0 ${width} ${height}`

  // Ties along the top edge: a 45deg bar of the line colour across the gap, doubleCorner in
  // from either corner, where double corners steps down to the plain border. Each leans the
  // same way as that step, its gap side running out to the corner side, and the far one is the
  // near one mirrored.
  const ties = (length: number) => {
    const tie = px(doubleTieWidth)
    const lean = inner - outer
    const near: [number, number][] = [
      [corner + lean, outer],
      [corner + lean + tie, outer],
      [corner + tie, inner],
      [corner, inner],
    ]
    const far = near.map(([x, y]): [number, number] => [length - x, y])
    const bar = (points: [number, number][]) =>
      `M ${points.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`
    return `${bar(near)} ${bar(far)}`
  }

  if (split === 'full')
    return {
      viewBox,
      pieces: [{ key: 'full', transform: '', line: ring(border, full), gap: ring(outer, inner) }],
      ties: turns.map(({ transform, length }) => ({ transform, d: ties(length) })),
    }
  return {
    viewBox,
    pieces: turns.map(({ transform, length }) => ({
      key: transform,
      transform,
      ...(split === 'edges' ? edge(length, corner) : cornerPiece()),
    })),
    ties: [],
  }
}

const frameStyle = (args: FrameArgs) => ({
  ...controlStyle(frameControls, args),
  '--mock-stripe-stops': stripeStops(args),
})

export const Frames: StoryObj<FrameArgs> = {
  args: { ...controlArgs(frameControls), typeLine: 'none', transitionShape: 'angle' },
  argTypes: {
    ...controlArgTypes(frameControls),
    typeLine: { control: { type: 'inline-radio' }, options: typeLinePositions },
    transitionShape: { control: { type: 'inline-radio' }, options: transitionShapes },
  },
  render: (args) => ({
    components: { CardItem },
    setup: () => ({ args, cells: frameSamples, frameStyle, partialDouble, doubleSplits }),
    template: `
      <div class="mockup-row mockup-frames" :style="frameStyle(args)" :data-type-line="args.typeLine === 'none' ? undefined : args.typeLine">
        <div v-for="{ card, category, decor, label } in cells" :key="label" class="mockup-cell" :data-category="category" :data-decor="decor">
          <div class="mockup-card">
            <CardItem :card="card" />
            <svg v-if="decor === 'perforated'" class="mockup-perforation" aria-hidden="true">
              <rect width="100%" height="100%" />
            </svg>
            <svg v-if="decor && doubleSplits[decor]" class="mockup-partial-double" :viewBox="partialDouble(doubleSplits[decor], args).viewBox" aria-hidden="true">
              <path v-for="{ key, transform, line } in partialDouble(doubleSplits[decor], args).pieces" :key="key" class="double-line" :transform="transform" :d="line" />
              <path v-for="{ key, transform, gap } in partialDouble(doubleSplits[decor], args).pieces" :key="key" class="double-gap" :transform="transform" :d="gap" />
              <path v-for="{ transform, d } in partialDouble(doubleSplits[decor], args).ties" :key="transform" class="double-line" :transform="transform" :d="d" />
            </svg>
          </div>
          <span>{{ label }}</span>
        </div>
      </div>
    `,
  }),
}

// Turn counter controls, each feeding a --mock-* variable. Sizes are in the card's 250-wide units.
const turnCounterControls = {
  turns: { var: 'turns', default: 3, min: 0, max: 20, step: 1 },
  numberColor: { var: 'number-color', default: '#ffffff' },
  numberShadow: { var: 'number-shadow', default: 0.3, min: 0, max: 1, step: 0.05 },
  numberShadowBlur: { var: 'number-shadow-blur', default: 3, min: 0, max: 10, step: 0.5 },
  numberSize: { var: 'number-size', default: 22, min: 6, max: 40, step: 0.5 },
  numberNudge: { var: 'number-nudge', default: 0, min: -10, max: 10, step: 0.25 },
  badgeSize: { var: 'badge-size', default: 38, min: 12, max: 70, step: 0.5 },
  badgeOffset: { var: 'badge-offset', default: -12, min: -40, max: 20, step: 0.5 },
  badgeBorder: { var: 'badge-border', default: 4, min: 0, max: 12, step: 0.5 },
  badgeRadius: { var: 'badge-radius', default: 4, min: 0, max: 15, step: 0.5 },
} as const

// Badge colours, each a light top fading to a dark bottom
const badgePalettes = {
  teal: { light: '#2fa89c', dark: '#0b5d56' },
  orange: { light: '#ffa94d', dark: '#b85400' },
  violet: { light: '#b07cff', dark: '#52259a' },
}

type BadgePalette = keyof typeof badgePalettes

type TurnCounterArgs = ControlArgs<typeof turnCounterControls> & { badgeColor: BadgePalette }

const turnCounterStyle = ({ badgeColor, ...args }: TurnCounterArgs) => ({
  ...controlStyle(turnCounterControls, args),
  '--mock-badge-light': badgePalettes[badgeColor].light,
  '--mock-badge-dark': badgePalettes[badgeColor].dark,
})

// An aura counting down its remaining turns, and an entity carrying a counter too, for cards
// that act as both
const striker = cards.striker
const turnCounterSamples: Sample[] = [aura, { card: striker, category: cardCategory(striker) }]

export const AuraTurnCounter: StoryObj<TurnCounterArgs> = {
  args: { ...controlArgs(turnCounterControls), badgeColor: 'teal' },
  argTypes: {
    ...controlArgTypes(turnCounterControls),
    badgeColor: { control: { type: 'select' }, options: keys(badgePalettes) },
  },
  render: (args) => ({
    components: { CardItem },
    setup: () => ({ args, cells: turnCounterSamples, turnCounterStyle }),
    template: `
      <div class="mockup-row mockup-aura-turn-counter" :style="turnCounterStyle(args)">
        <div v-for="{ card, category } in cells" :key="card.id" class="mockup-cell" :data-category="category">
          <CardItem :card="card" />
          <span>{{ category }}</span>
        </div>
      </div>
    `,
  }),
}
