import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
  /** Visual tone of the tooltip card */
  tone?: 'dark' | 'brand';
  children: React.ReactNode;
  className?: string;
}

const SIDE_STYLES: Record<string, { wrap: string; hidden: Record<string, number> }> = {
  top: { wrap: 'bottom-full left-1/2 -translate-x-1/2 mb-2', hidden: { y: 4 } },
  bottom: { wrap: 'top-full left-1/2 -translate-x-1/2 mt-2', hidden: { y: -4 } },
  left: { wrap: 'right-full top-1/2 -translate-y-1/2 mr-2', hidden: { x: 4 } },
  right: { wrap: 'left-full top-1/2 -translate-y-1/2 ml-2', hidden: { x: -4 } },
};

/** Dependency-free tooltip — delayed, animated, positioned, accessible. */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  side = 'top',
  delayMs = 240,
  tone = 'dark',
  children,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timer.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  const sideCfg = SIDE_STYLES[side];

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            className={[
              'absolute z-[80] pointer-events-none whitespace-nowrap',
              'rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-xl border',
              tone === 'brand'
                ? 'bg-accent text-[#0a0d14] border-accent'
                : 'bg-neutral-800/95 backdrop-blur-md text-neutral-100 border-white/10',
              sideCfg.wrap,
            ].join(' ')}
            initial={{ opacity: 0, scale: 0.92, ...sideCfg.hidden }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

export default Tooltip;
