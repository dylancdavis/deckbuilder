import type { Meta, StoryObj } from '@storybook/vue3';
import LightningSvg from './LightningSvg.vue';

const meta = {
  title: 'Components/LightningSvg',
  component: LightningSvg,
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
} satisfies Meta<typeof LightningSvg>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    style: {
      width: '32px',
      height: '45px',
    },
  },
};

export const Medium: Story = {
  args: {
    style: {
      width: '64px',
      height: '90px',
    },
  },
};

export const Large: Story = {
  args: {
    style: {
      width: '128px',
      height: '180px',
    },
  },
};

export const CustomColor: Story = {
  args: {
    style: {
      width: '64px',
      height: '90px',
      backgroundColor: '#ffd93d',
      padding: '10px',
      borderRadius: '8px',
    },
  },
};

export const Multiple: Story = {
  render: () => ({
    components: { LightningSvg },
    template: `
      <div style="display: flex; gap: 20px; align-items: center;">
        <LightningSvg style="width: 32px; height: 45px;" />
        <LightningSvg style="width: 48px; height: 67px;" />
        <LightningSvg style="width: 64px; height: 90px;" />
        <LightningSvg style="width: 80px; height: 112px;" />
      </div>
    `,
  }),
};