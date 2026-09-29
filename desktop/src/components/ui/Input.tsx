import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../../lib/soundEngine';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightClick?: () => void;
}

const SIZE_CLASSES = {
  sm: 'h-8.5 text-xs px-3',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4',
};

/** Lear text input — floating focus ring, typed feedback, error shimmer. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      icon,
      iconRight,
      onIconRightClick,
      className = '',
      id,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? React.useId();
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-neutral-300 mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative group">
          <motion.div
            className="absolute -inset-px rounded-xl pointer-events-none"
            animate={{
              boxShadow: focused
                ? hasError
                  ? '0 0 0 2px rgba(244,63,94,0.55), 0 0 18px rgba(244,63,94,0.2)'
                  : '0 0 0 2px rgba(232, 180, 74,0.55), 0 0 18px rgba(232, 180, 74,0.18)'
                : '0 0 0 0px rgba(232, 180, 74,0)',
            }}
            transition={{ duration: 0.16 }}
          />
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-accent transition-colors pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-xl bg-surface border text-neutral-100 placeholder:text-neutral-500',
              'transition-colors duration-150 outline-none',
              hasError
                ? 'border-danger/60 hover:border-danger/80'
                : 'border-border-subtle hover:border-border-hover',
              SIZE_CLASSES[size],
              icon ? 'pl-9' : '',
              iconRight ? 'pr-9' : '',
              className,
            ].join(' ')}
            onFocus={(e) => {
              setFocused(true);
              sfx('settings.keybind');
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {iconRight && (
            <button
              type="button"
              tabIndex={-1}
              onMouseEnter={() => sfx('ui.hover.01')}
              onClick={() => {
                sfx('ui.tap.03');
                onIconRightClick?.();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              {iconRight}
            </button>
          )}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 text-[11px] font-medium text-danger"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-[11px] text-neutral-500"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
