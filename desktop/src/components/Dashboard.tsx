import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ShieldCheck, Layers, Server, Radio } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useLear, type Project } from '../context/LearContext';
import useWatcher from '../hooks/useWatcher';
import WatcherPanel from './WatcherPanel';
import ErrorBoundary from './ErrorBoundary';
import CinematicHero from './fx/CinematicHero';
import KPIStrip, { type KpiTile } from './dashboard/KPIStrip';
import HealthBar from './dashboard/HealthBar';
import ActivityFeed, { type FeedEvent } from './dashboard/ActivityFeed';
import QuickActions, { DiagnosticsCard } from './dashboard/QuickActions';
import IncidentCenter, { IncidentBanner, AnomalyStrip, type IncidentRecord } from './dashboard/IncidentCenter';
import ServiceBoard from './dashboard/ServiceBoard';
import { sfx } from '../lib/soundEngine';

interface DashboardProps {
  activeProject?: Project | null;
  activeEnvironment?: string;
  onOpenWizard?: () => void;
}

interface DashboardSummary {
  health_score?: number;
  projects_count?: number;
  counts?: {
    healthy?: number;
    degraded?: number;
    error?: number;
    total_services?: number;
    configured_connectors?: number;
  };
}

interface DashboardActivityItem {
  connector?: string;
  summary?: string;
  event_type?: string;
  timestamp?: string;
}

/* =============================================================================
   DASHBOARD (U-03) — composed, not monolithic
   -----------------------------------------------------------------------------
   Before: one 50 KB / 1,075-line component. After: this orchestrator owns
   data (summary/activity/incidents @ 3.5s poll, watcher stream, context) and
   composes focused sub-components:

     CinematicHero · QuickActions · IncidentBanner/AnomalyStrip · KPIStrip ·
     HealthBar · WatcherPanel · ServiceBoard · ActivityFeed · IncidentCenter ·
     DiagnosticsCard

   All endpoints, polling cadence, approval semantics, and chat wiring are
   byte-for-byte compatible with the previous dashboard — same requests, same
   payloads, same side effects. Only the rendering was rebuilt.
   ========================================================================== */
export default function Dashboard({
  activeProject: currentProject,
  activeEnvironment: currentEnvironment = 'Production',
  onOpenWizard,
}: DashboardProps) {
  const {
    projects,
    watcherState,
    activeWatches,
    setActiveTab,
    setOpenCreateProjectModal,
    openChat,
    startWatch,
    stopWatch,
    pushToast,
  } = useLear();

  const {
    isConnected,
    events: liveWatcherEvents,
    activeWatchDetails,
    pauseWatch,
    resumeWatch,
  } = useWatcher();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activityEvents, setActivityEvents] = useState<DashboardActivityItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [latestIncident, setLatestIncident] = useState<IncidentRecord | null>(null);
  const [expandedThinkingId, setExpandedThinkingId] = useState<string | null>(null);
  const [notifiedIncidentIds, setNotifiedIncidentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const missionRef = useRef<HTMLDivElement>(null);

  // Extract services for the active environment
  const currentEnvObj =
    currentProject?.environments?.find(
      (e) => e.name.toLowerCase() === currentEnvironment.toLowerCase()
    ) || currentProject?.environments?.[0];
  const services = currentEnvObj?.services || [];

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      if (res.ok) setSummary(await res.json());
    } catch (e) {
      console.error('Failed to fetch dashboard summary:', e);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/activity?limit=8');
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) setActivityEvents(data.events);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard activity:', e);
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        const list: IncidentRecord[] = data.incidents || [];
        setIncidents(list);
        if (list.length > 0) {
          const top = list[0];
          setLatestIncident(top);
          if (top.status === 'ACTIVE' && top.requires_approval && !notifiedIncidentIds.has(top.incident_id)) {
            setNotifiedIncidentIds((prev) => new Set(prev).add(top.incident_id));
            pushToast({
              title: `⚠️ Approval Required: ${top.service}`,
              message: top.proposed_remediation || top.diagnosis || '',
              severity: 'error',
              incidentId: top.incident_id,
              incidentData: {
                incidentId: top.incident_id,
                title: top.title,
                errorSummary: top.error_summary,
                diagnosis: top.diagnosis,
                agentThinking: top.agent_thinking,
                tags: top.tags,
                severity: top.severity,
                requiresApproval: top.requires_approval,
              },
            });
          }
        } else {
          setLatestIncident(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch incidents:', e);
    }
  }, [notifiedIncidentIds, pushToast]);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchActivity(), fetchIncidents()]);
      if (mounted) setLoading(false);
    };
    loadAll();
    const interval = setInterval(() => {
      fetchSummary();
      fetchActivity();
      fetchIncidents();
    }, 3500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchSummary, fetchActivity, fetchIncidents]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchActivity(), fetchIncidents()]);
    setRefreshing(false);
  };

  const handleApproveIncident = async (incId: string) => {
    try {
      await fetch(`/api/incident/${incId}/approve`, { method: 'POST' });
      await fetchIncidents();
    } catch (e) {
      console.error('Approval failed:', e);
    }
  };

  const handleResolveChat = (inc: IncidentRecord) => {
    openChat({
      incidentId: inc.incident_id,
      title: inc.title,
      errorSummary: inc.error_summary,
      diagnosis: inc.diagnosis,
      agentThinking: inc.agent_thinking,
      tags: inc.tags,
      severity: inc.severity,
      requiresApproval: inc.requires_approval,
    });
  };

  const handleToggleWatchAll = () => {
    if (watcherState === 'ACTIVE') {
      services.forEach((s) => stopWatch(s.connector_id, s.resource_id));
    } else {
      services.forEach((s) => startWatch(s.connector_id, s.resource_id || 'default'));
    }
  };

  const handleOpenChatForService = (connectorId: string, resourceId?: string) => {
    openChat({ connectorId, resourceId });
  };

  const toggleServiceExpand = (key: string) =>
    setExpandedServices((prev) => ({ ...prev, [key]: !prev[key] }));

  const expandAllServices = () => {
    const next: Record<string, boolean> = {};
    services.forEach((s, idx) => {
      next[`${s.connector_id}:${s.resource_id || idx}`] = true;
    });
    setExpandedServices(next);
  };

  const collapseAllServices = () => setExpandedServices({});

  /* Derived health model (same semantics as the previous dashboard) -------- */
  const hasActiveServiceError = (services as unknown as { status?: string; health_status?: string }[]).some(
    (s) => s.status === 'error' || s.health_status === 'error'
  );
  const hasActiveWatchError = activeWatchDetails.some((w) => w.status === 'error');
  const isActualError = Boolean(
    (latestIncident && latestIncident.status === 'ACTIVE') ||
      ((summary?.counts?.error ?? 0) > 0 && (hasActiveServiceError || hasActiveWatchError)) ||
      (watcherState === 'ALERTING' && (hasActiveServiceError || hasActiveWatchError))
  );
  const isAlerting = isActualError;
  const healthScore = summary?.health_score ?? (services.length === 0 ? 0 : isAlerting ? 60 : 100);
  const totalProjectsCount = projects.length || summary?.projects_count || 1;
  const totalServicesCount = summary?.counts?.total_services || services.length;

  const healthyCount = summary?.counts?.healthy ?? services.length;
  const degradedCount = summary?.counts?.degraded ?? 0;
  const errorCount = summary?.counts?.error ?? 0;

  /* KPI tiles -------------------------------------------------------------- */
  const kpiTiles: KpiTile[] = useMemo(
    () => [
      {
        key: 'health',
        label: 'Infrastructure Health',
        value: healthScore,
        suffix: '%',
        sub: 'operational',
        icon: <ShieldCheck size={18} />,
        tone: healthScore >= 90 ? 'success' : healthScore >= 70 ? 'warning' : 'danger',
      },
      {
        key: 'integrations',
        label: 'Active Integrations',
        value: summary?.counts?.configured_connectors ?? 0,
        sub: 'connectors online',
        icon: <Layers size={18} />,
        tone: 'brand',
      },
      {
        key: 'services',
        label: 'Monitored Services',
        value: totalServicesCount,
        sub: `active in ${currentEnvironment}`,
        icon: <Server size={18} />,
        tone: 'violet',
      },
      {
        key: 'telemetry',
        label: 'Telemetry Stream',
        value: activeWatches.length,
        sub: watcherState === 'ACTIVE' ? 'STREAMING' : watcherState,
        icon: <Radio size={18} />,
        tone: watcherState === 'ALERTING' ? 'danger' : watcherState === 'ACTIVE' ? 'success' : 'neutral',
      },
    ],
    [healthScore, summary, totalServicesCount, currentEnvironment, activeWatches.length, watcherState]
  );

  /* Unified live feed ------------------------------------------------------- */
  const feedEvents: FeedEvent[] = useMemo(() => {
    const classify = (type: string, summaryText: string): FeedEvent['severity'] => {
      const t = type.toLowerCase();
      const m = summaryText.toLowerCase();
      if (t.includes('fail') || t.includes('alarm') || m.includes('error') || t.includes('crash')) return 'error';
      if (t.includes('spike') || t.includes('warn') || m.includes('degraded')) return 'warning';
      if (t.includes('recovered') || t.includes('healthy') || t.includes('deploy') || t.includes('success')) return 'success';
      return 'info';
    };
    const live = (liveWatcherEvents || []).map((e, i): FeedEvent => ({
      id: `live-${e.timestamp || i}-${i}`,
      tag: (e.event_type || 'watcher').toUpperCase(),
      source: (e.connector || 'watcher').toUpperCase(),
      time: e.timestamp
        ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Live',
      message: e.summary || 'Telemetry metric update received',
      severity: classify(e.event_type || '', e.summary || ''),
      actionable: classify(e.event_type || '', e.summary || '') === 'error' || classify(e.event_type || '', e.summary || '') === 'warning',
    }));
    const historical = activityEvents.map((item, i): FeedEvent => ({
      id: `hist-${i}-${item.timestamp || ''}`,
      tag: (item.event_type || 'SYSTEM').toUpperCase(),
      source: (item.connector || 'SYSTEM').toUpperCase(),
      time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '',
      message: item.summary || item.event_type || '',
      severity: classify(item.event_type || '', item.summary || ''),
    }));
    return [...live, ...historical].slice(0, 12);
  }, [liveWatcherEvents, activityEvents]);

  return (
    <div className="relative">
      {/* Opening cinematic — scroll-driven intro (collapses to content below) */}
      <CinematicHero
        onEnter={() => {
          sfx('hero.impact', { minGapMs: 500 });
          missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {/* Mission control */}
      <div ref={missionRef} className="p-8 max-w-7xl mx-auto space-y-8 relative z-10">
        {/* 1 · Header + command bar */}
        <div className="flex flex-wrap justify-between items-start gap-4 pb-2 border-b border-border-subtle/60 fx-stagger">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                {currentProject?.name || 'Default Project'}
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-accent shadow-sm">
                {currentEnvironment}
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400 flex items-center gap-2">
              <span>
                Mission Control: Monitoring <strong className="text-white font-semibold">{totalServicesCount}</strong> services across{' '}
                <strong className="text-white font-semibold">{totalProjectsCount}</strong> projects.
              </span>
            </p>
          </div>
          <QuickActions
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            onOpenActivity={() => setActiveTab('activity')}
            onNewProject={() => setOpenCreateProjectModal(true)}
            onOpenLear={() =>
              openChat({ initialPrompt: 'Provide real-time operational diagnostics and cluster status.' })
            }
          />
        </div>

        {/* 2 · Incident banner / anomaly strip */}
        <AnimatePresence mode="wait">
          {latestIncident && latestIncident.status === 'ACTIVE' ? (
            <IncidentBanner
              key={`inc-${latestIncident.incident_id}`}
              incident={latestIncident}
              onApprove={handleApproveIncident}
              onResolveChat={handleResolveChat}
            />
          ) : isAlerting && hasActiveServiceError ? (
            <AnomalyStrip
              key="anomaly"
              onInvestigate={() =>
                openChat({
                  title: 'Cluster Telemetry Anomaly',
                  initialPrompt: 'Investigate cluster anomaly and container restart latencies.',
                })
              }
            />
          ) : null}
        </AnimatePresence>

        {/* 3 · KPI strip + fleet health bar */}
        <section aria-label="Key performance indicators">
          <KPIStrip tiles={kpiTiles} loading={loading} />
        </section>
        {!loading && <HealthBar healthy={healthyCount} degraded={degradedCount} error={errorCount} />}

        {/* 4 · Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <ErrorBoundary fallbackTitle="Watcher Panel Error">
              <WatcherPanel
                state={watcherState}
                activeCount={activeWatches.length}
                eventCount={liveWatcherEvents.length}
                isConnected={isConnected}
                activeDetails={activeWatchDetails}
                onToggleWatch={handleToggleWatchAll}
                onPauseWatch={(w) => pauseWatch(w)}
                onResumeWatch={(w) => resumeWatch(w)}
                onStopWatch={(c, t, w) => stopWatch(c, t, w)}
              />
            </ErrorBoundary>

            <ServiceBoard
              services={services}
              environment={currentEnvironment}
              watchingActive={watcherState === 'ACTIVE'}
              expanded={expandedServices}
              onToggle={toggleServiceExpand}
              onExpandAll={expandAllServices}
              onCollapseAll={collapseAllServices}
              onWatchAll={handleToggleWatchAll}
              onOpenChat={handleOpenChatForService}
              onOpenWizard={onOpenWizard}
            />

            <ActivityFeed
              events={feedEvents}
              loading={loading}
              onInvestigate={(message) =>
                openChat({ initialPrompt: `Investigate event: ${message}` })
              }
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <ErrorBoundary fallbackTitle="Incident Stream Error">
              <IncidentCenter
                incidents={incidents}
                expandedThinkingId={expandedThinkingId}
                onToggleThinking={setExpandedThinkingId}
                onApprove={handleApproveIncident}
                onResolveChat={handleResolveChat}
              />
            </ErrorBoundary>
            <DiagnosticsCard
              onLaunch={(title, prompt) => {
                sfx('ai.think.01');
                openChat({ title, initialPrompt: prompt });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
