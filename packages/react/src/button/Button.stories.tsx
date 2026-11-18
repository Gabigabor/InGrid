import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, type ButtonAppearance, type ButtonSize, type ButtonVariant } from './Button';

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** Story-only switches: the icons themselves are fixed, the controls just turn them on or off. */
type ButtonStoryArgs = React.ComponentProps<typeof Button> & {
  showLeadingIcon?: boolean;
  showTrailingIcon?: boolean;
};

const meta = {
  title: 'Inputs/Button',
  component: Button,
  // Docs page: the live example with a "Show code" button, then the property table with controls.
  tags: ['autodocs'],
  // Inverse is shown on its dark background, locked to Light mode like the component itself.
  decorators: [
    (Story, { args }) =>
      args.variant === 'inverse' ? (
        <div data-theme="light" style={{ display: 'inline-block', padding: 16, background: 'var(--ingrid-color-surface-inverse)' }}>
          <Story />
        </div>
      ) : (
        <Story />
      ),
  ],
  args: {
    children: 'Button',
    appearance: 'filled',
    variant: 'primary',
    size: 'medium',
    showLeadingIcon: false,
    showTrailingIcon: false,
    isDisabled: false,
  },
  // Controls and the property table are listed in this order. Names match the Figma component properties.
  argTypes: {
    children: {
      name: 'Label',
      control: 'text',
      description: 'Button text. Every button needs a label. Prop: `children`.',
      table: { type: { summary: 'ReactNode' } },
    },
    appearance: {
      name: 'Type',
      control: 'radio',
      options: ['filled', 'outlined', 'text'],
      description: 'Emphasis: Filled (highest), Outlined (medium), Text (lowest). Prop: `appearance`.',
      table: { type: { summary: "'filled' | 'outlined' | 'text'" }, defaultValue: { summary: 'filled' } },
    },
    variant: {
      name: 'Color',
      control: 'radio',
      options: ['primary', 'neutral', 'destructive', 'inverse'],
      description:
        'Primary for the main action, Neutral for secondary actions, Destructive for actions that delete or can’t be undone, Inverse only on dark backgrounds. Prop: `variant`.',
      table: {
        type: { summary: "'primary' | 'neutral' | 'destructive' | 'inverse'" },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      name: 'Size',
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Height: Small 24 px, Medium 32 px, Large 44 px. Prop: `size`.',
      table: { type: { summary: "'small' | 'medium' | 'large'" }, defaultValue: { summary: 'medium' } },
    },
    showLeadingIcon: {
      name: 'Leading icon',
      control: 'boolean',
      description: 'Icon before the label. Prop: `leadingIcon` (any SVG, sized by the button).',
      table: { type: { summary: 'ReactNode' } },
    },
    showTrailingIcon: {
      name: 'Trailing icon',
      control: 'boolean',
      description: 'Icon after the label. Prop: `trailingIcon` (any SVG, sized by the button).',
      table: { type: { summary: 'ReactNode' } },
    },
    isDisabled: {
      name: 'Disabled',
      control: 'boolean',
      description: 'Uses the shared 25% disabled colours and ignores presses. Prop: `isDisabled`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    leadingIcon: { table: { disable: true } },
    trailingIcon: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Buttons start an action. Hovered, Pressed and Focused come from React Aria, so they aren’t props. Every colour and size comes from the Ingrid Inputs tokens exported from Figma.',
      },
    },
    // Tokens tab next to Controls: which Ingrid token is behind each property of the button.
    tokenInspector: { selector: '.ingrid-button' },
    controls: {
      include: ['Label', 'Type', 'Color', 'Size', 'Leading icon', 'Trailing icon', 'Disabled'],
    },
  },
  render: ({ showLeadingIcon, showTrailingIcon, leadingIcon, trailingIcon, ...args }) => (
    <Button
      {...args}
      leadingIcon={showLeadingIcon ? <Plus /> : leadingIcon}
      trailingIcon={showTrailingIcon ? <Plus /> : trailingIcon}
    />
  ),
} satisfies Meta<ButtonStoryArgs>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Shown at the top of the Docs page; hidden from the sidebar, because the Docs page replaces it. */
export const Playground: Story = { tags: ['!dev'] };

const appearances: ButtonAppearance[] = ['filled', 'outlined', 'text'];
const variants: ButtonVariant[] = ['primary', 'neutral', 'destructive', 'inverse'];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];

/** Every Appearance × Variant × Size, like the Figma component set. Inverse sits on the inverse surface. */
export const AllVariants: Story = {
  // Its own sidebar page (and CI screenshots), but not on the Docs page.
  tags: ['!autodocs'],
  parameters: { tokenInspector: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {appearances.map((appearance) => (
        <div key={appearance} style={{ display: 'grid', gap: 8 }}>
          {variants.map((variant) => (
            <div
              key={variant}
              data-theme={variant === 'inverse' ? 'light' : undefined}
              style={{
                display: 'flex', gap: 12, alignItems: 'center', padding: 8,
                background: variant === 'inverse' ? 'var(--ingrid-color-surface-inverse)' : undefined,
              }}
            >
              {sizes.map((size) => (
                <Button key={size} appearance={appearance} variant={variant} size={size} leadingIcon={<Plus />} trailingIcon={<Plus />}>
                  Button
                </Button>
              ))}
              {sizes.map((size) => (
                <Button key={`d-${size}`} appearance={appearance} variant={variant} size={size} isDisabled>
                  Disabled
                </Button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
