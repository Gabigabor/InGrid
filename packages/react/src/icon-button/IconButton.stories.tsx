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
    icon: <Plus />,
    'aria-label': 'Add',
    appearance: 'filled',
    variant: 'primary',
    size: 'medium',
    isDisabled: false,
  },
  // Controls and the property table are listed in this order. Names match the Figma component properties.
  argTypes: {
    'aria-label': {
      name: 'Accessible label',
      control: 'text',
      description: 'Required. Read by screen readers, because the button has no visible text. Prop: `aria-label`.',
      table: { type: { summary: 'string' } },
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
      description: 'Width and height: Small 24 px, Medium 32 px, Large 44 px. Prop: `size`.',
      table: { type: { summary: "'small' | 'medium' | 'large'" }, defaultValue: { summary: 'medium' } },
    },
    isDisabled: {
      name: 'Disabled',
      control: 'boolean',
      description: 'Uses the shared 25% disabled colours and ignores presses. Prop: `isDisabled`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    icon: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A square button that shows only an icon (prop `icon`, required: any SVG drawn with currentColor, sized by the button). Hovered, Pressed and Focused come from React Aria, so they aren’t props. Uses the same Inputs tokens as Button.',
      },
    },
    // Tokens tab next to Controls: which Ingrid token is behind each property of the icon button.
    tokenInspector: { selector: '.ingrid-icon-button' },
    controls: { include: ['Accessible label', 'Type', 'Color', 'Size', 'Disabled'] },
  },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Shown at the top of the Docs page; hidden from the sidebar, because the Docs page replaces it. */
export const Playground: Story = { tags: ['!dev'] };

const appearances: IconButtonAppearance[] = ['filled', 'outlined', 'text'];
const variants: IconButtonVariant[] = ['primary', 'neutral', 'destructive', 'inverse'];
const sizes: IconButtonSize[] = ['small', 'medium', 'large'];

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
