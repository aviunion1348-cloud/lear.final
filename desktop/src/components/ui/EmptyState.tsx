import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
}

/** Zero-data state with a touch of cinema — never a blank dead panel. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-14'} px-6`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-4"
      >
        <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-150" />
        <div className="relative p-4 rounded-2xl bg-surface border border-border-subtle text-neutral-400">
          {icon ?? <Inbox size={compact ? 24 : 30} />}
        </div>
      </motion.div>
      <h3 className="text-sm md:text-base font-bold text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-neutral-400 max-w-sm leading-relaxed text-balance">{description}</p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex items-center gap-2.5">
          {actionLabel && (
            <Button size="sm" icon={actionIcon} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button size="sm" variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
