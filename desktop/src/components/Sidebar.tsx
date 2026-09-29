/* =============================================================================
   SIDEBAR (U-02) — navigation shell redesign
   -----------------------------------------------------------------------------
   ✓ collapsible (expanded 264px ↔ rail 76px, persisted)
   ✓ smoother transitions (spring width, layoutId active pill, staggered items)
   ✓ better active state (animated glow pill + marker line)
   ✓ keyboard navigation (⌘/Ctrl+B collapse, Alt+1…7 jump to a section)
   ✓ sound design on every interaction, sfx master toggle in the footer
   Data contracts (props + LearContext) are unchanged from the previous shell.
   ========================================================================== */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Sparkles,
  FolderGit2,
  Blocks,
  Activity,
  Bell,
  Settings,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Layers,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { useLear, type Project } from '../context/LearContext';
import Tooltip from './ui/Tooltip';
import { sfx, isSfxEnabled, setSfxEnabled, onSfxEnabledChange } from '../lib/soundEngine';

export interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  projects?: Project[];
  activeProject?: Project | null;
  activeEnvironment?: string;
  setActiveEnvironment?: (env: string) => void;
  watcherState?: string;
  services?: unknown[];
  unreadNotificationsCount?: number;
  onSelectProject?: (project: Project) => void;
}

const COLLAPSED_KEY = 'lear.sidebar.collapsed';

const NAV_ICONS = { Home, Sparkles, FolderGit2, Blocks, Activity, Bell, Settings };

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const context = useLear();

  const activeTab = props.activeTab ?? context.activeTab;
  const setActiveTab = props.setActiveTab ?? context.setActiveTab;
  const projects = props.projects ?? context.projects;
  const activeProject = props.activeProject ?? context.activeProject;
  const activeEnvironment = props.activeEnvironment ?? context.activeEnvironment;
  const setActiveEnvironment = props.setActiveEnvironment ?? context.selectEnvironment;
  const watcherState = props.watcherState ?? context.watcherState;
  const unreadCount = props.unreadNotificationsCount ?? context.unreadCount;

  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [sfxOn, setSfxOn] = useState<boolean>(() => isSfxEnabled());

  useEffect(() => onSfxEnabledChange(setSfxOn), []);

  const persistCollapsed = useCallback((v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0');
    } catch { /* storage unavailable */ }
  }, []);

  const toggleCollapsed = useCallback(() => {
    sfx(collapsed ? 'nav.open' : 'nav.close');
    persistCollapsed(!collapsed);
  }, [collapsed, persistCollapsed]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: NAV_ICONS.Home, hint: 'Alt+1' },
    { id: 'chat', label: 'Lear Chat', icon: NAV_ICONS.Sparkles, hint: 'Alt+2' },
    { id: 'projects', label: 'Projects', icon: NAV_ICONS.FolderGit2, hint: 'Alt+3' },
    { id: 'integrations', label: 'Integrations', icon: NAV_ICONS.Blocks, hint: 'Alt+4' },
    { id: 'activity', label: 'Activity Log', icon: NAV_ICONS.Activity, hint: 'Alt+5' },
    { id: 'notifications', label: 'Notifications', icon: NAV_ICONS.Bell, badge: unreadCount, hint: 'Alt+6' },
    { id: 'settings', label: 'Settings', icon: NAV_ICONS.Settings, hint: 'Alt+7' },
  ];

  /* Keyboard navigation: ⌘/Ctrl+B collapse, Alt+digit jump ----------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField =
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapsed();
        return;
      }
      if (inField) return;
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        const idx = parseInt(e.key, 10) - 1;
        const item = navItems[idx];
        if (item) {
          e.preventDefault();
          sfx('nav.tab.02');
          if (item.id === 'projects') context.clearProjectDetail();
          setActiveTab(item.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleCollapsed, setActiveTab]);

  /* Close project dropdown on outside click --------------------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProjectsDropdown(false);
      }
    };
    if (showProjectsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectsDropdown]);

  const environments = context.environments.length > 0 ? context.environments : ['Production'];

  const handleSelectProject = (projectId: string) => {
    sfx(projectId === 'all' ? 'project.import' : 'project.switch');
    if (props.onSelectProject) {
      if (projectId === 'all') {
        props.onSelectProject({ id: 'all', name: 'All Projects', environments: [] });
      } else {
        const found = projects.find((p) => p.id === projectId);
        if (found) props.onSelectProject(found);
      }
    } else {
      context.selectProject(projectId);
      if (projectId !== 'all') {
        context.viewProjectDetail(projectId);
      }
    }
    setShowProjectsDropdown(false);
  };

  const handleNewProjectClick = () => {
    sfx('project.create');
    setShowProjectsDropdown(false);
    context.setOpenCreateProjectModal(true);
    setActiveTab('projects');
  };

  const statusDot = (status: string) => {
    switch (status) {
      case 'error':
        return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]';
      case 'degraded':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]';
      case 'deploying':
        return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]';
      case 'healthy':
      default:
        return 'bg-accent shadow-[0_0_8px_rgba(232, 180, 74,0.7)]';
    }
  };

  const watcherChip = {
    ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    DEGRADED: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    ALERTING: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    ERROR: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    IDLE: 'text-neutral-400 bg-white/[0.04] border-white/10',
    STARTING: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
  }[watcherState as string] ?? 'text-neutral-400 bg-white/[0.04] border-white/10';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      className="bg-[#080b11]/92 backdrop-blur-xl border-r border-border-subtle flex flex-col h-full select-none shrink-0 relative z-30"
      aria-label="Primary navigation"
    >
      {/* Brand header */}
      <div className={`p-4 pb-3 ${collapsed ? 'px-3' : 'p-5 pb-3'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5">
            <motion.div
              layout
              className="relative w-9 h-9 rounded-xl grid place-items-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#e8b44a,#a855f7 60%,#22d3ee)' }}
              whileHover={{ scale: 1.06, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <Sparkles size={17} className="text-white" />
            </motion.div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold tracking-tight text-white font-display">Lear</h1>
                  <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded font-mono font-semibold border border-accent/25">
                    v{context.appVersion}
                  </span>
                  <Tooltip content={`Infrastructure health: ${context.aggregateStatus.toUpperCase()}`}>
                    <span className={`w-2 h-2 rounded-full transition-colors ${statusDot(context.aggregateStatus)}`} />
                  </Tooltip>
                </div>
              </motion.div>
            )}
          </div>
          {!collapsed && (
            <Tooltip content="Collapse sidebar (⌘B)" side="right">
              <button
                onClick={toggleCollapsed}
                onMouseEnter={() => sfx('ui.hover.03')}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft size={15} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Project selector (hidden in rail mode) */}
      {!collapsed && (
        <div className="px-3 relative" ref={dropdownRef}>
          <button
            onClick={() => {
              sfx(showProjectsDropdown ? 'nav.close' : 'nav.open');
              setShowProjectsDropdown((prev) => !prev);
            }}
            className="w-full p-2.5 rounded-xl bg-surface/60 hover:bg-surface border border-border-subtle flex items-center justify-between text-xs text-left cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              {context.activeProjectId === 'all' ? (
                <Layers size={13} className="text-accent shrink-0" />
              ) : (
                <FolderGit2 size={13} className="text-neutral-400 shrink-0" />
              )}
              <span className="text-neutral-200 font-medium truncate">{activeProject?.name || 'Default Project'}</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-neutral-500 shrink-0 transition-transform duration-200 ${showProjectsDropdown ? 'rotate-180 text-accent' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showProjectsDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.985 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full left-3 right-3 mt-1 p-1 glass-heavy rounded-xl shadow-2xl z-30 space-y-0.5"
              >
                <button
                  onClick={() => handleSelectProject('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                    context.activeProjectId === 'all' ? 'bg-accent/15 text-accent font-semibold' : 'text-neutral-300 hover:bg-surface'
                  }`}
                >
                  <Layers size={13} />
                  <span>All Projects</span>
                </button>
                <div className="border-t border-border-subtle my-1" />
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onMouseEnter={() => sfx('ui.hover.01', { minGapMs: 80 })}
                      onClick={() => handleSelectProject(p.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        p.id === context.activeProjectId ? 'bg-accent/15 text-accent font-semibold' : 'text-neutral-300 hover:bg-surface'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.environments && <span className="text-[10px] text-neutral-500 font-mono">{p.environments.length} env</span>}
                    </button>
                  ))}
                </div>
                <div className="border-t border-border-subtle my-1" />
                <button
                  onClick={handleNewProjectClick}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-accent hover:bg-accent/10 transition-colors cursor-pointer flex items-center gap-2 font-medium"
                >
                  <Plus size={13} />
                  <span>New Project</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Environment switcher */}
          <div className="flex gap-1 mt-2.5 p-0.5 rounded-lg bg-background border border-border-subtle text-[11px] font-medium">
            {environments.map((env) => (
              <button
                key={env}
                onClick={() => {
                  sfx('project.select');
                  setActiveEnvironment(env);
                }}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer truncate px-1.5 ${
                  activeEnvironment.toLowerCase() === env.toLowerCase()
                    ? 'bg-surface-elevated text-accent font-semibold shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-2.5' : 'px-3'} py-3 space-y-1 overflow-y-auto`} aria-label="Sections">
        {!collapsed && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-3 py-1">Menu</div>
        )}
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const btn = (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i, type: 'spring', stiffness: 300, damping: 26 }}
              onClick={() => {
                sfx('nav.tab.01');
                if (item.id === 'projects') context.clearProjectDetail();
                setActiveTab(item.id);
              }}
              onMouseEnter={() => sfx('ui.hover.02', { minGapMs: 80 })}
              className={`w-full flex items-center rounded-xl text-xs font-medium transition-colors relative group ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
              } ${isActive ? 'text-accent' : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.045]'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-accent/12 border border-accent/25 shadow-[0_0_18px_rgba(232, 180, 74,0.12)]"
                />
              )}
              {isActive && (
                <motion.span
                  layoutId="nav-active-marker"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent shadow-[0_0_10px_rgba(232, 180, 74,0.8)]"
                />
              )}
              <Icon size={collapsed ? 19 : 16} className="relative z-10 shrink-0" />
              {!collapsed && (
                <>
                  <span className="relative z-10 flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="relative z-10 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-accent text-[10px] font-bold text-[#0a0d14]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <kbd className="relative z-10 text-[9px] font-mono text-neutral-600 group-hover:text-neutral-400 transition-colors">
                    {item.hint}
                  </kbd>
                </>
              )}
              {collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-1 z-10 w-2 h-2 rounded-full bg-accent" />
              )}
            </motion.button>
          );
          return collapsed ? (
            <Tooltip key={item.id} content={`${item.label}  ·  ${item.hint}`} side="right" delayMs={120}>
              {btn}
            </Tooltip>
          ) : (
            <React.Fragment key={item.id}>{btn}</React.Fragment>
          );
        })}
      </nav>

      {/* Footer: watcher chip, sfx toggle, expand, version */}
      <div className={`border-t border-border-subtle p-3 space-y-2 ${collapsed ? 'items-center flex flex-col' : ''}`}>
        <Tooltip content={collapsed ? `Telemetry: ${watcherState} · ${context.activeWatches.length} watches` : ''} side="right">
          <div
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[10px] font-mono font-bold ${watcherChip} ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Radio size={12} className={watcherState === 'ACTIVE' ? 'fx-beacon' : ''} />
            {!collapsed && (
              <>
                <span>{watcherState}</span>
                <span className="ml-auto text-neutral-500">{context.activeWatches.length}w</span>
              </>
            )}
          </div>
        </Tooltip>

        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          <Tooltip content={sfxOn ? 'Mute interface sounds' : 'Enable interface sounds'} side="right">
            <button
              onClick={() => {
                const next = !sfxOn;
                setSfxEnabled(next);
                if (next) sfx('toggle.on.01');
              }}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer"
              aria-label={sfxOn ? 'Mute sounds' : 'Unmute sounds'}
              aria-pressed={sfxOn}
            >
              {sfxOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </Tooltip>

          {collapsed ? (
            <Tooltip content="Expand sidebar (⌘B)" side="right">
              <button
                onClick={toggleCollapsed}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer"
                aria-label="Expand sidebar"
              >
                <ChevronsRight size={15} />
              </button>
            </Tooltip>
          ) : (
            <span className="text-[9.5px] font-mono text-neutral-600">Infrastructure Intelligence</span>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
