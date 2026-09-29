import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'kpi' | 'row';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

/**
 * Loading placeholders that match the Lear surfaces — wave-sweep highlight,
 * zero layout shift when real content swaps in (same bounding box).
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  lines = 3,
  className = '',
  style,
  ...rest
}) => {
  const px = (v?: string | number) => (typeof v === 'number' ? `${v}px` : v);

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="fx-skeleton rounded-md h-3"
            style={{ width: i === lines - 1 ? '62%' : '88%', ...style }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    const size = px(width ?? 40);
    return <div className={`fx-skeleton rounded-full ${className}`} style={{ width: size, height: px(height ?? width ?? 40), ...style }} {...rest} />;
  }

  if (variant === 'card') {
    return (
      <div className={`glass-panel rounded-2xl p-5 space-y-3 ${className}`} {...rest}>
        <div className="flex items-center justify-between">
          <div className="fx-skeleton rounded-md h-3 w-28" />
          <div className="fx-skeleton rounded-xl h-8 w-8" />
        </div>
        <div className="fx-skeleton rounded-md h-7 w-24" />
        <div className="fx-skeleton rounded-md h-2.5 w-full" />
      </div>
    );
  }

  if (variant === 'kpi') {
    return (
      <div className={`glass-panel rounded-2xl p-5 h-32 flex flex-col justify-between ${className}`} {...rest}>
        <div className="flex items-center justify-between">
          <div className="fx-skeleton rounded-md h-3 w-32" />
          <div className="fx-skeleton rounded-xl h-9 w-9" />
        </div>
        <div className="fx-skeleton rounded-md h-8 w-20" />
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className={`flex items-center gap-3 p-3 ${className}`} {...rest}>
        <div className="fx-skeleton rounded-xl h-9 w-9 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="fx-skeleton rounded-md h-3 w-2/5" />
          <div className="fx-skeleton rounded-md h-2.5 w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fx-skeleton rounded-xl ${className}`}
      style={{ width: px(width), height: px(height ?? 80), ...style }}
      {...rest}
    />
  );
};

export default Skeleton;
