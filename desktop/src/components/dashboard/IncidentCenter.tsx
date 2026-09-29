import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { sfx } from '../../lib/soundEngine';

export interface IncidentRecord {
  incident_id: string;
  title: string;
  service?: string;
  severity?: string;
  status: string;
  cluster?: string;
  tags?: string[];
  error_summary?: string;
  diagnosis?: string;
  proposed_remediation?: string;
  agent_thinking?: string[];
  episodic_memory?: string;
  requires_approval?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface IncidentBannerProps {
  incident: IncidentRecord;
  onApprove: (id: string) => void;
  onResolveChat: (incident: IncidentRecord) => void;
}

/** Full-width critical incident banner with approval actions. */
export const IncidentBanner: React.FC<IncidentBannerProps> = ({ incident, onApprove, onResolveChat }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="relative overflow-hidden rounded-2xl border-2 border-rose-500/60 p-5 shadow-2xl shadow-rose-950/40 fx-glow-danger"
      style={{ background: 'linear-gradient(120deg, rgba(67,9,26,0.85), rgba(14,20,34,0.9) 45%, rgba(67,9,26,0.6))' }}
    >
      <div className="absolute inset-0 fx-scan-x opacity-60 pointer-events-none" aria-hidden="true" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/40 shrink-0">
            <ShieldAlert size={22} className="animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="danger" size="xs">
                {incident.severity || 'CRITICAL'}
              </Badge>
              {incident.tags?.map((tag, tidx) => (
                <Badge key={tidx} tone={tag.includes('APPROVAL') ? 'warning' : tag.includes('FAILOVER') ? 'violet' : 'neutral'} size="xs" pulse={tag.includes('APPROVAL')}>
                  {tag}
                </Badge>
              ))}
              {incident.cluster && <span className="text-neutral-400 font-mono text-[10px]">{incident.cluster}</span>}
            </div>
            <h3 className="text-sm md:text-base font-bold text-white leading-snug">{incident.title}</h3>
            <p className="text-xs text-rose-200/90 leading-relaxed font-mono text-[11.5px]">
              {incident.diagnosis || incident.error_summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {incident.requires_approval && (
            <Button
              variant="success"
              size="sm"
              sound="incident.approve"
              icon={<CheckCircle2 size={14} />}
              onClick={() => onApprove(incident.incident_id)}
            >
              Approve Fix
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            sound="incident.created"
            icon={<Sparkles size={14} />}
            onClick={() => onResolveChat(incident)}
          >
            Resolve with Lear
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export interface IncidentCenterProps {
  incidents: IncidentRecord[];
  expandedThinkingId: string | null;
  onToggleThinking: (id: string | null) => void;
  onApprove: (id: string) => void;
  onResolveChat: (incident: IncidentRecord) => void;
}

/** Ongoing & past autonomous actions stream with agent-thinking expansion. */
export const IncidentCenter: React.FC<IncidentCenterProps> = ({
  incidents,
  expandedThinkingId,
  onToggleThinking,
  onApprove,
  onResolveChat,
}) => {
  return (
    <Card variant="glass" padding="md" className="flex flex-col min-h-[540px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-accent" />
          <h3 className="font-bold text-sm text-white">Autonomous Actions</h3>
        </div>
        <Badge tone="brand" size="xs">
          {incidents.length} Records
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[580px]">
        {incidents.length === 0 ? (
          <EmptyState
            compact
            icon={<Clock size={22} />}
            title="No autonomous actions yet"
            description="Lear will record detections, reasoning phases, and failovers here the moment they happen."
          />
        ) : (
          <AnimatePresence initial={false}>
            {incidents.map((inc) => {
              const isResolved = inc.status === 'RESOLVED';
              const isAwaiting = inc.requires_approval && !isResolved;
              const isThinkingExpanded = expandedThinkingId === inc.incident_id;

              return (
                <motion.div
                  key={inc.incident_id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className={[
                    'p-3.5 rounded-xl border text-xs leading-snug space-y-2.5 transition-shadow',
                    isAwaiting
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 shadow-md shadow-amber-950/20'
                      : isResolved
                      ? 'bg-surface/70 border-emerald-500/25 text-neutral-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-100 shadow-md shadow-rose-950/20',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge tone={isResolved ? 'success' : isAwaiting ? 'warning' : 'danger'} size="xs" pulse={isAwaiting}>
                        {inc.status}
                      </Badge>
                      {inc.tags?.map((t, tIdx) => (
                        <Badge key={tIdx} tone="neutral" size="xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-neutral-400 font-mono text-[9.5px]">
                      {inc.created_at ? inc.created_at.split(' ')[1] || inc.created_at : ''}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs leading-snug line-clamp-2">{inc.title}</h4>
                    <p className="text-[11px] text-neutral-300/90 mt-1 line-clamp-2 leading-relaxed">
                      {inc.diagnosis || inc.error_summary}
                    </p>
                  </div>

                  {inc.agent_thinking && inc.agent_thinking.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          sfx(isThinkingExpanded ? 'widget.collapse' : 'widget.expand');
                          onToggleThinking(isThinkingExpanded ? null : inc.incident_id);
                        }}
                        className="flex items-center gap-1 text-[10px] font-mono text-accent hover:text-accent-light cursor-pointer transition-colors"
                      >
                        <Brain size={12} />
                        <span>Agent&apos;s Thinking ({inc.agent_thinking.length} phases)</span>
                        {isThinkingExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>

                      <AnimatePresence>
                        {isThinkingExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-2.5 rounded-lg bg-black/50 border border-border-subtle font-mono text-[10px] space-y-1.5 text-neutral-300 fx-stagger">
                              {inc.agent_thinking.map((thought, phIdx) => (
                                <div key={phIdx} className="leading-relaxed">
                                  <span className="text-accent font-bold">Phase {phIdx + 1}:</span> {thought}
                                </div>
                              ))}
                              {inc.episodic_memory && (
                                <div className="pt-1.5 border-t border-white/10 text-violet-300">
                                  <span className="font-bold text-violet-400">Episodic Memory:</span> {inc.episodic_memory}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        sfx('chat.open');
                        onResolveChat(inc);
                      }}
                      className="flex items-center gap-1 text-[10.5px] text-accent hover:text-white font-bold cursor-pointer transition-colors"
                    >
                      <Sparkles size={11} />
                      <span>Resolve with Lear →</span>
                    </button>

                    {isAwaiting && (
                      <Button
                        variant="success"
                        size="xs"
                        sound="incident.approve"
                        icon={<CheckCircle2 size={11} />}
                        onClick={() => onApprove(inc.incident_id)}
                      >
                        Approve Fix
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </Card>
  );
};

/** Anomaly strip shown when watcher telemetry reports errors between incidents. */
export const AnomalyStrip: React.FC<{ onInvestigate: () => void }> = ({ onInvestigate }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg shadow-rose-950/20"
  >
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-rose-500/25 rounded-xl text-rose-400 border border-rose-500/40">
        <AlertTriangle size={20} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-rose-300">Cluster Anomaly Detected</h3>
        <p className="text-xs text-rose-300/80">Watcher stream detected errors or elevated latency in active infrastructure.</p>
      </div>
    </div>
    <Button variant="danger" size="sm" sound="incident.created" onClick={onInvestigate}>
      Investigate with Lear
    </Button>
  </motion.div>
);

export default IncidentCenter;
