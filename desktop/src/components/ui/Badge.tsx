import React from 'react';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  outline?: boolean;
  children?: React.ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, { soft: string; dot: string; text: string }> = {
  brand: { soft: 'bg-accent/15 border-accent/30', dot: 'bg-accent', text: 'text-accent-light' },
  success: { soft: 'bg-success/15 border-success/30', dot: 'bg-success', text: 'text-emerald-400' },
  warning: { soft: 'bg-warning/15 border-warning/30', dot: 'bg-warning', text: 'text-amber-400' },
  danger: { soft: 'bg-danger/15 border-danger/30', dot: 'bg-danger', text: 'text-rose-400' },
  info: { soft: 'bg-info/15 border-info/30', dot: 'bg-info', text: 'text-sky-400' },
  violet: { soft: 'bg-violet-500/15 border-violet-500/30', dot: 'bg-violet-500', text: 'text-violet-300' },
  neutral: { soft: 'bg-white/[0.07] border-white/10', dot: 'bg-neutral-400', text: 'text-neutral-300' },
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: 'text-[9.5px] px-1.5 py-0.5 gap-1',
  sm: 'text-[10.5px] px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

/** Status pill — the canonical way to show tone-coded state. */
export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  outline = false,
  className = '',
  children,
  ...rest
}) => {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={[
        'inline-flex items-center font-mono font-bold uppercase tracking-wide rounded-full border select-none',
        outline ? 'border-current bg-transparent' : t.soft,
        t.text,
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={`absolute inline-flex h-full w-full rounded-full ${t.dot} opacity-70 animate-ping`} />}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${t.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
