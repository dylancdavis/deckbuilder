import type { Meta, StoryObj } from '@storybook/vue3';
import ScarabSvg from './ScarabSvg.vue';

const meta = {
  title: 'Components/ScarabSvg',
  component: ScarabSvg,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    style: {
      control: 'object',
      description: 'CSS styles for the SVG',
    },
  },
} satisfies Meta<typeof ScarabSvg>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    style: {
      width: '32px',
      height: '32px',
    },
  },
};

export const Medium: Story = {
  args: {
    style: {
      width: '64px',
      height: '64px',
    },
  },
};

export const Large: Story = {
  args: {
    style: {
      width: '128px',
      height: '128px',
    },
  },
};

export const CustomColor: Story = {
  args: {
    style: {
      width: '64px',
      height: '64px',
      color: '#ff6b6b',
    },
  },
};

export const Multiple: Story = {
  render: () => ({
    components: { ScarabSvg },
    template: `
      <div style="display: flex; gap: 20px; align-items: center;">
        <ScarabSvg style="width: 32px; height: 32px; color: #4ecdc4;" />
        <ScarabSvg style="width: 48px; height: 48px; color: #45b7d1;" />
        <ScarabSvg style="width: 64px; height: 64px; color: #f7b731;" />
        <ScarabSvg style="width: 80px; height: 80px; color: #5f27cd;" />
      </div>
    `,
  }),
};