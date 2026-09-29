import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type CardVariant = 'glass' | 'elevated' | 'outline' | 'flat' | 'gradient';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  glow?: 'brand' | 'cyan' | 'violet' | 'danger' | 'success' | null;
  children?: React.ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  glass: 'glass-panel',
  elevated: 'bg-surface-elevated border border-border-subtle shadow-lg',
  outline: 'bg-transparent border border-border-subtle',
  flat: 'bg-surface/60 border border-border-subtle/60',
  gradient: 'glass-panel ring-conic',
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

const GLOW_CLASSES: Record<NonNullable<CardProps['glow']>, string> = {
  brand: 'hover:shadow-glow-brand hover:border-accent/40',
  cyan: 'hover:shadow-glow-cyan hover:border-cyan-400/40',
  violet: 'hover:shadow-glow-violet hover:border-violet-500/40',
  danger: 'hover:shadow-glow-danger hover:border-danger/40',
  success: 'hover:shadow-glow-success hover:border-success/40',
};

/** Lear surface container — the card every panel is built from. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'glass',
      padding = 'md',
      hoverable = false,
      glow = null,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={rest.initial ?? { opacity: 0, y: 12 }}
        animate={rest.animate ?? { opacity: 1, y: 0 }}
        transition={rest.transition ?? { type: 'spring', stiffness: 260, damping: 26 }}
        whileHover={hoverable ? { y: -3, transition: { type: 'spring', stiffness: 400, damping: 24 } } : undefined}
        className={[
          'rounded-2xl relative',
          VARIANT_CLASSES[variant],
          PADDING_CLASSES[padding],
          hoverable ? 'transition-shadow duration-200' : '',
          glow ? `transition-all duration-200 ${GLOW_CLASSES[glow]}` : '',
          hoverable ? 'cursor-pointer' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
