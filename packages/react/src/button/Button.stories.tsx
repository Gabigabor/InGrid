import type { Meta, StoryObj } from '@storybook/react';
import { Button, type ButtonAppearance, type ButtonSize, type ButtonVariant } from './Button';

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const meta = {
  title: 'Inputs/Button',
  component: Button,
  args: { children: 'Button', appearance: 'filled', variant: 'primary', size: 'medium' },
  argTypes: {
    appearance: { control: 'inline-radio', options: ['filled', 'outlined', 'text'] },
    variant: { control: 'inline-radio', options: ['primary', 'neutral', 'destructive', 'inverse'] },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithIcons: Story = { args: { leadingIcon: <Plus />, trailingIcon: <Plus /> } };
export const IconOnly: Story = { args: { children: undefined, leadingIcon: <Plus />, 'aria-label': 'Add' } };
export const Disabled: Story = { args: { isDisabled: true } };

const appearances: ButtonAppearance[] = ['filled', 'outlined', 'text'];
const variants: ButtonVariant[] = ['primary', 'neutral', 'destructive', 'inverse'];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];

/** Every Appearance × Variant × Size, like the Figma component set. Inverse sits on the inverse surface. */
export const AllVariants: Story = {
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
