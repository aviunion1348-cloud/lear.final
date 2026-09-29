import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';

export interface FeedEvent {
  id: string;
  tag: string;
  source: string;
  time: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  actionable?: boolean;
}

const SEV_STYLE: Record<FeedEvent['severity'], { badge: string; icon: (cls: string) => React.ReactNode }> = {
  success: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: (c) => <CheckCircle2 size={13} className={c} /> },
  info: { badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: (c) => <Activity size={13} className={c} /> },
  warning: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: (c) => <AlertTriangle size={13} className={c} /> },
  error: { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: (c) => <AlertTriangle size={13} className={c} /> },
};

export interface ActivityFeedProps {
  events: FeedEvent[];
  loading?: boolean;
  maxHeight?: number;
  streaming?: boolean;
  onInvestigate?: (message: string) => void;
}

/**
 * Live telemetry feed — new rows fly in from the top with a spring, list is
 * keyed so poll refreshes don't replay animations. NO synthetic demo rows:
 * everything here is a real watcher or audit event (audit issue #11/#15).
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events,
  loading = false,
  maxHeight = 300,
  streaming = true,
  onInvestigate,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-border-subtle space-y-3.5">
      <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-accent" />
          <h3 className="font-bold text-sm text-white">Live Telemetry &amp; Operational Events</h3>
        </div>
        {streaming && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Radio size={10} className="fx-beacon" />
            STREAMING
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton variant="row" className="bg-surface/40 rounded-xl" />
          <Skeleton variant="row" className="bg-surface/40 rounded-xl" />
          <Skeleton variant="row" className="bg-surface/40 rounded-xl" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          compact
          icon={<Activity size={22} />}
          title="No telemetry yet"
          description="Start a watch on any service and its state transitions, alerts and recoveries will stream in here."
        />
      ) : (
        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight }}>
          <AnimatePresence initial={false}>
            {events.map((evt) => {
              const sev = SEV_STYLE[evt.severity];
              return (
                <motion.div
                  key={evt.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="p-3 rounded-xl border text-xs bg-surface/50 border-border-subtle/80 flex items-start justify-between gap-3 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 border ${sev.badge}`}>
                      {sev.icon('')}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${sev.badge}`}>
                          {evt.tag}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400 uppercase">[{evt.source}]</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{evt.time}</span>
                      </div>
                      <p className="text-neutral-200 font-medium text-xs leading-snug break-words">{evt.message}</p>
                    </div>
                  </div>
                  {evt.actionable && onInvestigate && (
                    <button
                      onClick={() => onInvestigate(evt.message)}
                      onMouseEnter={() => undefined}
                      data-sfx="search.open"
                      className="text-[10.5px] text-accent hover:text-accent-light font-mono shrink-0 cursor-pointer pt-0.5 transition-colors"
                    >
                      Investigate →
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
