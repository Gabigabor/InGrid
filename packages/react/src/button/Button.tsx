import { forwardRef, type ReactNode } from 'react';
import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components';
import './button.css';

export type ButtonAppearance = 'filled' | 'outlined' | 'text';
export type ButtonVariant = 'primary' | 'neutral' | 'destructive' | 'inverse';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'style'> {
  /** Figma: Appearance. Default `filled`. */
  appearance?: ButtonAppearance;
  /** Figma: Variant. `inverse` is meant for dark backgrounds. Default `primary`. */
  variant?: ButtonVariant;
  /** Figma: Size (24 / 32 / 44 px). Default `medium`. */
  size?: ButtonSize;
  /** Figma: Leading icon. Any 24×24 viewBox SVG; it is sized by the button. */
  leadingIcon?: ReactNode;
  /** Figma: Trailing icon. */
  trailingIcon?: ReactNode;
  /** Extra class names, appended to `ingrid-button`. */
  className?: string;
  /** Required when the button has no visible label (icon-only). */
  'aria-label'?: string;
}

/**
 * Ingrid Button. Behaviour and accessibility come from React Aria (headless);
 * every visual value comes from the Ingrid tokens exported from Figma.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    appearance = 'filled',
    variant = 'primary',
    size = 'medium',
    leadingIcon,
    trailingIcon,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <AriaButton
      {...rest}
      ref={ref}
      className={className ? `ingrid-button ${className}` : 'ingrid-button'}
      data-appearance={appearance}
      data-variant={variant}
      data-size={size}
    >
      {composeRenderProps(children, (content) => (
        <>
          {leadingIcon && (
            <span className="ingrid-button__icon" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          {content != null && content !== false && (
            <span className="ingrid-button__label">{content}</span>
          )}
          {trailingIcon && (
            <span className="ingrid-button__icon" aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </>
      ))}
    </AriaButton>
  );
});
