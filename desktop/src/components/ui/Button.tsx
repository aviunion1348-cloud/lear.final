import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { sfx } from '../../lib/soundEngine';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gradient';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  glow?: boolean;
  /** Play a specific sound on click (defaults per variant); pass null to mute */
  sound?: string | null;
  children?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-[#0a0d14] font-bold hover:bg-accent-light shadow-lg shadow-accent/20 hover:shadow-glow-brand',
  secondary:
    'bg-surface-elevated text-neutral-100 border border-border-subtle hover:border-border-hover hover:bg-neutral-700/40 font-semibold',
  ghost:
    'text-neutral-300 hover:text-white hover:bg-white/[0.06] font-semibold',
  outline:
    'border border-accent/50 text-accent hover:bg-accent/10 hover:border-accent font-semibold',
  danger:
    'bg-danger/90 text-white hover:bg-danger font-bold shadow-lg shadow-danger/20 hover:shadow-glow-danger',
  success:
    'bg-success/90 text-[#04261a] hover:bg-success font-bold shadow-lg shadow-success/20 hover:shadow-glow-success',
  gradient:
    'bg-brand-gradient text-white font-bold shadow-lg shadow-accent/25 hover:shadow-glow-brand hover:brightness-110',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] gap-1.5 rounded-lg',
  sm: 'h-8.5 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-10 px-4.5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-2xl',
  icon: 'h-9 w-9 rounded-xl grid place-items-center',
};

const DEFAULT_SOUNDS: Record<ButtonVariant, string> = {
  primary: 'ui.click.03',
  secondary: 'ui.click.05',
  ghost: 'ui.tap.02',
  outline: 'ui.tap.04',
  danger: 'ui.click.09',
  success: 'ui.click.06',
  gradient: 'ui.click.07',
};

/**
 * The Lear button. Every interactive surface in the app should be built on
 * this (or Button-like primitives): consistent physics, focus rings, loading
 * state, and sound design for free.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      glow = false,
      sound,
      disabled,
      className = '',
      children,
      onClick,
      ...rest
    },
    ref
  ) => {
    const resolvedSound = sound === undefined ? DEFAULT_SOUNDS[variant] : sound;

    return (
      <motion.button
        ref={ref}
        whileHover={disabled || loading ? undefined : { y: -1.5, scale: 1.015 }}
        whileTap={disabled || loading ? undefined : { scale: 0.965, y: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 28 }}
        disabled={disabled || loading}
        data-sfx-self=""
        onMouseEnter={() => sfx('ui.hover.02')}
        className={[
          'relative inline-flex items-center justify-center select-none cursor-pointer',
          'transition-colors duration-150 whitespace-nowrap',
          'disabled:opacity-45 disabled:pointer-events-none',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          glow ? 'shadow-glow-brand' : '',
          className,
        ].join(' ')}
        onClick={(e) => {
          if (resolvedSound) sfx(resolvedSound);
          onClick?.(e);
        }}
        {...rest}
      >
        {loading ? (
          <Loader2 size={size === 'xs' ? 12 : 15} className="animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0 inline-flex">{icon}</span>
        )}
        {children}
        {iconRight && !loading && <span className="shrink-0 inline-flex">{iconRight}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
