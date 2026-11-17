import { forwardRef, type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import './icon-button.css';

export type IconButtonAppearance = 'filled' | 'outlined' | 'text';
export type IconButtonVariant = 'primary' | 'neutral' | 'destructive' | 'inverse';
export type IconButtonSize = 'small' | 'medium' | 'large';

export interface IconButtonProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  /** Figma: Icon (instance swap). Any 24×24 viewBox SVG drawn with currentColor; it is sized by the button. */
  icon: ReactNode;
  /** Required: the button has no visible text, so this is its accessible name. */
  'aria-label': string;
  /** Figma: Appearance. Default `filled`. */
  appearance?: IconButtonAppearance;
  /** Figma: Variant. `inverse` is meant for dark backgrounds. Default `primary`. */
  variant?: IconButtonVariant;
  /** Figma: Size, the button's width and height (24 / 32 / 44 px). Default `medium`. */
  size?: IconButtonSize;
  /** Extra class names, appended to `ingrid-icon-button`. */
  className?: string;
}

/**
 * Ingrid Icon Button: a square button that shows only an icon. Behaviour and accessibility
 * come from React Aria (headless); every visual value comes from the Ingrid tokens exported from Figma.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, appearance = 'filled', variant = 'primary', size = 'medium', className, ...rest },
  ref,
) {
  return (
    <AriaButton
      {...rest}
      ref={ref}
      className={className ? `ingrid-icon-button ${className}` : 'ingrid-icon-button'}
      data-appearance={appearance}
      data-variant={variant}
      data-size={size}
    >
      <span className="ingrid-icon-button__icon" aria-hidden="true">
        {icon}
      </span>
    </AriaButton>
  );
});
