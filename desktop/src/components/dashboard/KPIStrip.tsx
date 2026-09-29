import React from 'react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';
import Skeleton from '../ui/Skeleton';

export type KpiTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';

export interface KpiTile {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  tone: KpiTone;
  spark?: number[];
  onClick?: () => void;
}

const TONE_CHIP: Record<KpiTone, string> = {
  brand: 'bg-accent/12 text-accent border border-accent/25',
  success: 'bg-success/12 text-emerald-400 border border-success/25',
  warning: 'bg-warning/12 text-amber-400 border border-warning/25',
  danger: 'bg-danger/12 text-rose-400 border border-danger/25',
  info: 'bg-info/12 text-sky-400 border border-info/25',
  violet: 'bg-violet-500/12 text-violet-300 border border-violet-500/25',
  neutral: 'bg-surface text-neutral-300 border border-border-subtle',
};

const TONE_GLOW: Record<KpiTone, string> = {
  brand: 'hover:shadow-glow-brand hover:border-accent/40',
  success: 'hover:shadow-glow-success hover:border-success/40',
  warning: 'hover:shadow-lg hover:border-warning/40',
  danger: 'hover:shadow-glow-danger hover:border-danger/40',
  info: 'hover:shadow-glow-cyan hover:border-info/40',
  violet: 'hover:shadow-glow-violet hover:border-violet-500/40',
  neutral: 'hover:shadow-lg hover:border-border-hover',
};

/** Minimal inline sparkline (pure SVG, 36×12 viewport) */
const Sparkline: React.FC<{ points: number[]; tone: KpiTone }> = ({ points, tone }) => {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const step = 36 / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(12 - (p / max) * 11).toFixed(1)}`)
    .join(' ');
  const stroke =
    tone === 'success' ? '#10b981' : tone === 'danger' ? '#f43f5e' : tone === 'warning' ? '#f59e0b' : tone === 'info' ? '#38bdf8' : tone === 'violet' ? '#8b5cf6' : '#e8b44a';
  return (
    <svg width="36" height="12" viewBox="0 0 36 12" className="opacity-80 shrink-0" aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export interface KPIStripProps {
  tiles: KpiTile[];
  loading?: boolean;
  columns?: 2 | 4;
}

/**
 * KPI strip — animated numbers (CountUp), hover glow per tone, optional
 * sparklines, spring entrance cascade. Pure presentation; data arrives
 * as props so it works with any endpoint.
 */
export const KPIStrip: React.FC<KPIStripProps> = ({ tiles, loading = false, columns = 4 }) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : ''} gap-4`}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="kpi" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : ''} gap-4`}>
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.key}
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26, delay: i * 0.06 }}
          whileHover={{ y: -3 }}
          onClick={tile.onClick}
          data-sfx-hover="ui.hover.03"
          className={[
            'glass-panel rounded-2xl p-5 relative overflow-hidden h-32 flex flex-col justify-between',
            'border border-border-subtle transition-all duration-200',
            TONE_GLOW[tile.tone],
            tile.onClick ? 'cursor-pointer' : '',
          ].join(' ')}
        >
          {/* ambient corner light */}
          <div
            className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(232, 180, 74,0.16), transparent 70%)' }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 tracking-widest uppercase">{tile.label}</span>
            <div className={`p-2 rounded-xl ${TONE_CHIP[tile.tone]}`}>{tile.icon}</div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <CountUp
                value={tile.value}
                suffix={tile.suffix ?? ''}
                className="text-3xl font-extrabold text-white tracking-tight font-display"
              />
              {tile.sub && <span className="text-[11px] font-medium text-neutral-400 font-mono truncate">{tile.sub}</span>}
            </div>
            {tile.spark && <Sparkline points={tile.spark} tone={tile.tone} />}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default KPIStrip;
