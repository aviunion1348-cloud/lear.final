import React from 'react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';

export interface HealthBarProps {
  healthy: number;
  degraded: number;
  error: number;
  loading?: boolean;
}

const SEGMENTS = [
  { key: 'healthy', label: 'Healthy', className: 'bg-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  { key: 'degraded', label: 'Degraded', className: 'bg-amber-500', text: 'text-amber-400', dot: 'bg-amber-400' },
  { key: 'error', label: 'Error', className: 'bg-rose-500', text: 'text-rose-400', dot: 'bg-rose-400' },
] as const;

/**
 * Fleet health distribution — spring-animated segments separated by hairline
 * gaps, shimmering pulse on live error share, shape-shifts smoothly as the
 * 3.5s poll brings new counts.
 */
export const HealthBar: React.FC<HealthBarProps> = ({ healthy, degraded, error, loading = false }) => {
  const counts: Record<string, number> = { healthy, degraded, error };
  const total = Math.max(1, healthy + degraded + error);
  const errorPct = (error / total) * 100;

  return (
    <div className="p-4 rounded-2xl bg-surface/40 border border-border-subtle space-y-2.5 glass-panel">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-300 font-semibold flex items-center gap-2">
          Fleet Health Distribution
          {!loading && errorPct > 0 && (
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400" />
            </span>
          )}
        </span>
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono">
          {SEGMENTS.map((seg) => (
            <span key={seg.key} className={`flex items-center gap-1.5 ${seg.text}`}>
              <span className={`w-2 h-2 rounded-full ${seg.dot}`} />
              <CountUp value={counts[seg.key]} />
              <span className="text-neutral-400">
                {seg.label} ({Math.round((counts[seg.key] / total) * 100)}%)
              </span>
            </span>
          ))}
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((healthy / total) * 100)}
        aria-label="Service status distribution"
        className="w-full h-2.5 rounded-full bg-surface-elevated overflow-hidden flex gap-px relative"
      >
        {SEGMENTS.map((seg) => (
          <motion.div
            key={seg.key}
            className={`${seg.className} h-full relative`}
            initial={false}
            animate={{ width: `${(counts[seg.key] / total) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          >
            {seg.key === 'error' && errorPct > 0 && (
              <span className="absolute inset-0 fx-shimmer opacity-60" aria-hidden="true" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HealthBar;
