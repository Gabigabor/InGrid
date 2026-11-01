import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withTokenInspector } from '../../../../.storybook/TokenInspector';
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
  decorators: [withTokenInspector('.ingrid-button')],
  args: {
    children: 'Button',
    appearance: 'filled',
    variant: 'primary',
    size: 'medium',
    showLeadingIcon: false,
    showTrailingIcon: false,
    isDisabled: false,
  },
  // Controls are listed in this order. Names match the Figma component properties.
  argTypes: {
    children: { name: 'Label', control: 'text', description: 'Button text. Every button needs a label.' },
    appearance: { name: 'Type', control: 'inline-radio', options: ['filled', 'outlined', 'text'] },
    variant: {
      name: 'Color',
      control: 'inline-radio',
      options: ['primary', 'neutral', 'destructive', 'inverse'],
      description: 'Inverse is meant for dark backgrounds.',
    },
    size: { name: 'Size', control: 'inline-radio', options: ['small', 'medium', 'large'] },
    showLeadingIcon: { name: 'Leading icon', control: 'boolean' },
    showTrailingIcon: { name: 'Trailing icon', control: 'boolean' },
    isDisabled: { name: 'Disabled', control: 'boolean' },
    leadingIcon: { table: { disable: true } },
    trailingIcon: { table: { disable: true } },
  },
  parameters: {
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

export const Playground: Story = {};
export const Disabled: Story = { args: { isDisabled: true } };

const appearances: ButtonAppearance[] = ['filled', 'outlined', 'text'];
const variants: ButtonVariant[] = ['primary', 'neutral', 'destructive', 'inverse'];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];

/** Every Appearance × Variant × Size, like the Figma component set. Inverse sits on the inverse surface. */
export const AllVariants: Story = {
  parameters: { tokenInspector: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {appearances.map((appearance) => (
        <div key={appearance} style={{ display: 'grid', gap: 8 }}>
          {variants.map((variant) => (
            <div
              key={variant}
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
