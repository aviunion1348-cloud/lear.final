import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Activity,
  Cloud,
  Server,
  Cpu,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import ErrorBoundary from '../ErrorBoundary';
import ServiceWidget from '../ServiceWidget';
import type { ServiceItem } from '../../context/LearContext';
import { sfx } from '../../lib/soundEngine';

interface BriefSummary {
  statusText: string;
  statusTone: 'success' | 'brand' | 'info';
  metricsSummary: string;
  icon: React.ReactNode;
}

/** Presentation map for known providers — falls back to a generic tile. */
function getServiceBrief(connectorId: string): BriefSummary {
  switch ((connectorId || '').toLowerCase()) {
    case 'kubernetes':
      return {
        statusText: 'Operational',
        statusTone: 'success',
        metricsSummary: 'Pods • Deployments • Restarts — live via kubelet stream',
        icon: <Layers size={17} className="text-sky-400 shrink-0" />,
      };
    case 'datadog':
      return {
        statusText: 'APM Active',
        statusTone: 'success',
        metricsSummary: 'Monitors, events & latency — agent polling live',
        icon: <Activity size={17} className="text-violet-400 shrink-0" />,
      };
    case 'gcp':
      return {
        statusText: 'Connected',
        statusTone: 'success',
        metricsSummary: 'Compute & Cloud Monitoring — live state polling',
        icon: <Cloud size={17} className="text-rose-400 shrink-0" />,
      };
    case 'aws':
      return {
        statusText: 'Healthy',
        statusTone: 'success',
        metricsSummary: 'EC2 & CloudWatch — instance state streaming',
        icon: <Server size={17} className="text-amber-400 shrink-0" />,
      };
    default:
      return {
        statusText: 'Operational',
        statusTone: 'success',
        metricsSummary: 'Live telemetry connected — continuous stream',
        icon: <Cpu size={17} className="text-accent shrink-0" />,
      };
  }
}

export interface ServiceBoardProps {
  services: ServiceItem[];
  environment: string;
  watchingActive: boolean;
  expanded: Record<string, boolean>;
  onToggle: (key: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onWatchAll: () => void;
  onOpenChat: (connectorId: string, resourceId?: string) => void;
  onOpenWizard?: () => void;
}

/** Active services board — collapsible rows embedding the live ServiceWidget. */
export const ServiceBoard: React.FC<ServiceBoardProps> = ({
  services,
  environment,
  watchingActive,
  expanded,
  onToggle,
  onExpandAll,
  onCollapseAll,
  onWatchAll,
  onOpenChat,
  onOpenWizard,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity size={18} className="text-accent" />
          <h2 className="text-lg font-bold text-white tracking-tight">Active Infrastructure Telemetry</h2>
        </div>
        {services.length > 0 && (
          <button
            onClick={() => {
              sfx(watchingActive ? 'watch.stop' : 'watch.start');
              onWatchAll();
            }}
            className="text-xs font-semibold text-accent hover:text-accent-light transition-colors flex items-center gap-1 cursor-pointer"
          >
            {watchingActive ? 'Stop Watching All' : 'Watch All Services'}
          </button>
        )}
      </div>

      {services.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-border-subtle">
          <EmptyState
            icon={<Server size={30} />}
            title={`No services configured for ${environment}`}
            description="Connect your cloud accounts and attach services to this project to start observing production telemetry."
            actionLabel={onOpenWizard ? 'Open Configuration Wizard' : undefined}
            onAction={onOpenWizard}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
            <span className="text-[11px] font-mono">Expand a row for full metrics &amp; telemetry streams</span>
            <div className="flex items-center gap-2">
              <button onClick={onExpandAll} className="text-[11px] font-mono text-neutral-400 hover:text-accent transition-colors cursor-pointer">
                Expand All
              </button>
              <span>•</span>
              <button onClick={onCollapseAll} className="text-[11px] font-mono text-neutral-400 hover:text-accent transition-colors cursor-pointer">
                Collapse All
              </button>
            </div>
          </div>

          {services.map((svc, idx) => {
            const serviceKey = `${svc.connector_id}:${svc.resource_id || idx}`;
            const isExpanded = expanded[serviceKey] ?? false;
            const brief = getServiceBrief(svc.connector_id);

            return (
              <motion.div
                key={serviceKey}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26, delay: Math.min(idx * 0.05, 0.3) }}
                className="glass-panel rounded-2xl border border-border-subtle/80 overflow-hidden transition-colors hover:border-accent/40"
              >
                <button
                  type="button"
                  onClick={() => {
                    sfx(isExpanded ? 'widget.collapse' : 'widget.expand');
                    onToggle(serviceKey);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-surface/40 hover:bg-surface/70 cursor-pointer transition-colors select-none text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="p-1 rounded-lg text-neutral-400 shrink-0">
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-accent" />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </span>
                    <div className="p-2 rounded-xl bg-surface border border-border-subtle shrink-0">{brief.icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {svc.display_name || svc.connector_id.toUpperCase()}
                        </span>
                        <Badge tone="neutral" size="xs">
                          {svc.connector_id}
                        </Badge>
                        <Badge tone={brief.statusTone} size="xs" dot pulse>
                          {brief.statusText}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5 truncate">{brief.metricsSummary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        sfx('chat.open');
                        onOpenChat(svc.connector_id, svc.resource_id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          sfx('chat.open');
                          onOpenChat(svc.connector_id, svc.resource_id);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border-subtle hover:border-accent/40 text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles size={12} className="text-accent" />
                      <span>Ask Lear</span>
                    </span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-border-subtle bg-background/50">
                        <ErrorBoundary fallbackTitle={`Service Error (${svc.connector_id})`}>
                          <ServiceWidget
                            connectorId={svc.connector_id}
                            resourceId={svc.resource_id}
                            displayName={svc.display_name}
                            onOpenChat={onOpenChat}
                          />
                        </ErrorBoundary>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServiceBoard;
