import React from 'react';
import { RefreshCw, FileText, Plus, Sparkles, Stethoscope, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { sfx } from '../../lib/soundEngine';

export interface QuickActionsProps {
  refreshing: boolean;
  onRefresh: () => void;
  onOpenActivity: () => void;
  onNewProject: () => void;
  onOpenLear: () => void;
}

/** Mission-control command bar — the four verbs of the dashboard. */
export const QuickActions: React.FC<QuickActionsProps> = ({
  refreshing,
  onRefresh,
  onOpenActivity,
  onNewProject,
  onOpenLear,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button
        variant="secondary"
        size="icon"
        sound={refreshing ? null : 'data.refresh.01'}
        onClick={onRefresh}
        disabled={refreshing}
        title="Refresh dashboard metrics"
        icon={<RefreshCw size={15} className={refreshing ? 'animate-spin text-accent' : ''} />}
        aria-label="Refresh"
      />
      <Button variant="secondary" size="sm" sound="ui.page.02" icon={<FileText size={14} className="text-neutral-400" />} onClick={onOpenActivity}>
        Activity Log
      </Button>
      <Button variant="secondary" size="sm" sound="project.create" icon={<Plus size={14} className="text-accent" />} onClick={onNewProject}>
        New Project
      </Button>
      <Button variant="gradient" size="sm" glow sound="chat.open" icon={<Sparkles size={15} />} onClick={onOpenLear}>
        Open Lear
      </Button>
    </div>
  );
};

export interface DiagnosticsCardProps {
  onLaunch: (title: string, prompt: string) => void;
}

const COMMON_INQUIRIES: { title: string; prompt: string }[] = [
  {
    title: 'CrashLoop Container Audit',
    prompt: 'Check for crash-looping containers and inspect backoff restart counts.',
  },
  {
    title: 'Audit Watcher Latencies',
    prompt: 'Audit active watcher stream latencies and verify event throughput.',
  },
  {
    title: 'Verify AWS STS Credentials',
    prompt: 'Verify AWS STS credentials and test IAM caller identity for the EKS cluster.',
  },
];

/** Copilot diagnostics card — one-click deep checks with guided prompts. */
export const DiagnosticsCard: React.FC<DiagnosticsCardProps> = ({ onLaunch }) => {
  return (
    <Card variant="glass" padding="md" hoverable={false} className="space-y-3.5 bg-surface/20">
      <div className="flex items-center gap-2">
        <Stethoscope size={16} className="text-accent" />
        <h3 className="font-bold text-sm text-white">System Diagnostics</h3>
      </div>
      <p className="text-xs text-neutral-400 leading-relaxed">
        Analyze all active infrastructure services, verify telemetry latencies, and check for anomalies.
      </p>

      <Button
        variant="secondary"
        size="md"
        className="w-full justify-center"
        sound="ai.action"
        icon={<Sparkles size={14} className="text-accent" />}
        onClick={() => {
          sfx('scan.start');
          onLaunch('Full Infrastructure Diagnostics', 'Perform full cluster health check and audit all pod statuses.');
        }}
      >
        Launch Lear Diagnostics
      </Button>

      <div className="pt-2 border-t border-border-subtle flex flex-col gap-1">
        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest pb-1">Common Inquiries</span>
        {COMMON_INQUIRIES.map((q) => (
          <button
            key={q.title}
            onClick={() => {
              sfx('search.open');
              onLaunch(q.title, q.prompt);
            }}
            onMouseEnter={() => sfx('ui.hover.04', { minGapMs: 90 })}
            className="group text-left text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center justify-between py-1.5 px-1 -mx-1 rounded-lg hover:bg-white/[0.04]"
          >
            <span>• {q.title}</span>
            <ArrowRight size={10} className="text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
