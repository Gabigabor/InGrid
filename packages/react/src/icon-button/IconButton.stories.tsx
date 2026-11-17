import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  IconButton,
  type IconButtonAppearance,
  type IconButtonSize,
  type IconButtonVariant,
} from './IconButton';

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const meta = {
  title: 'Inputs/Icon Button',
  component: IconButton,
  args: {
    icon: <Plus />,
    'aria-label': 'Add',
    appearance: 'filled',
    variant: 'primary',
    size: 'medium',
    isDisabled: false,
  },
  // Controls are listed in this order. Names match the Figma component properties.
  argTypes: {
    'aria-label': {
      name: 'Accessible label',
      control: 'text',
      description: 'Read by screen readers. Every icon button needs one.',
    },
    appearance: { name: 'Type', control: 'inline-radio', options: ['filled', 'outlined', 'text'] },
    variant: {
      name: 'Color',
      control: 'inline-radio',
      options: ['primary', 'neutral', 'destructive', 'inverse'],
      description: 'Inverse is meant for dark backgrounds.',
    },
    size: { name: 'Size', control: 'inline-radio', options: ['small', 'medium', 'large'] },
    isDisabled: { name: 'Disabled', control: 'boolean' },
    icon: { table: { disable: true } },
  },
  parameters: {
    // Tokens tab next to Controls: which Ingrid token is behind each property of the icon button.
    tokenInspector: { selector: '.ingrid-icon-button' },
    controls: { include: ['Accessible label', 'Type', 'Color', 'Size', 'Disabled'] },
  },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const appearances: IconButtonAppearance[] = ['filled', 'outlined', 'text'];
const variants: IconButtonVariant[] = ['primary', 'neutral', 'destructive', 'inverse'];
const sizes: IconButtonSize[] = ['small', 'medium', 'large'];

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
                <IconButton key={size} appearance={appearance} variant={variant} size={size} icon={<Plus />} aria-label="Add" />
              ))}
              {sizes.map((size) => (
                <IconButton
                  key={`d-${size}`}
                  appearance={appearance}
                  variant={variant}
                  size={size}
                  icon={<Plus />}
                  aria-label="Add (disabled)"
                  isDisabled
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
