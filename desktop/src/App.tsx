import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Wizard from './components/Wizard';
import Sidebar from './components/Sidebar';
import Projects from './components/Projects';
import Integrations from './components/Integrations';
import ActivityLog from './components/ActivityLog';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import NotificationToast from './components/NotificationToast';
import Chatbot from './components/Chatbot';
import ChatWorkspace from './components/ChatWorkspace';
import ErrorBoundary from './components/ErrorBoundary';
import AuroraBackground from './components/fx/AuroraBackground';
import SoundManager from './components/fx/SoundManager';
import LiveVideoBackdrop from './components/fx/LiveVideoBackdrop';
import AtmosphereOverlay from './components/fx/AtmosphereOverlay';
import PerfOverlay from './components/fx/PerfOverlay';
import CinematicLanding from './components/fx/CinematicLanding';
import ConsoleIgnition from './components/fx/ConsoleIgnition';
import SectionTransition from './components/fx/SectionTransition';
import SubsectionChoreography from './components/fx/SubsectionChoreography';
import PointerSpotlight from './components/fx/PointerSpotlight';
import DepthField from './components/fx/DepthField';
import CommandPalette, { type NavCommand } from './components/fx/CommandPalette';
import { LearProvider, useLear } from './context/LearContext';
import { logAnimationRegistry } from './lib/animationRegistry';
import { SFX_COUNT } from './lib/soundEngine';

function AppContent() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  // Cinematic landing gate — shown on each fresh load, skipped once entered
  // within a session and bypassed when a deep-link (?tab= / ?session=) is used.
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('lear.landing.seen') === '1') return false;
      const p = new URLSearchParams(window.location.search);
      if (p.get('tab') || p.get('session') || p.get('skipIntro')) return false;
    } catch { /* noop */ }
    return true;
  });
  // Console ignition plays once, on the handoff from landing -> app.
  const [igniting, setIgniting] = useState(false);
  const enterConsole = () => {
    try { sessionStorage.setItem('lear.landing.seen', '1'); } catch { /* noop */ }
    setShowLanding(false);
    setIgniting(true);
  };

  const {
    activeTab,
    setActiveTab,
    activeProject,
    activeEnvironment,
    refreshProjects,
    toasts,
    dismissToast,
    chatOpen,
    closeChat,
    chatContext,
  } = useLear();

  const checkConfig = async () => {
    try {
      const resConfig = await fetch('/api/config');
      if (resConfig.ok) {
        const data = await resConfig.json();
        const hasConfigured = data.services && Object.keys(data.services).length > 0;
        setIsSetupComplete(hasConfigured);
      }
    } catch (e) {
      console.error('Error checking setup status:', e);
      setIsSetupComplete(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConfig();
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      } else if (params.get('session')) {
        setActiveTab('chat');
      }
    } catch {}
  }, []);

  const navCommands: NavCommand[] = [
    ['dashboard', 'Go to Dashboard', 'home overview health kpi'],
    ['chat', 'Go to Chat', 'copilot ask ai assistant'],
    ['projects', 'Go to Projects', 'repos services'],
    ['integrations', 'Go to Integrations', 'connectors credentials aws gcp'],
    ['activity', 'Go to Activity Log', 'events audit history'],
    ['notifications', 'Go to Notifications', 'alerts slack email'],
    ['settings', 'Go to Settings', 'config preferences sound'],
  ].map(([id, title, keywords]) => ({
    id, title, keywords, run: () => setActiveTab(id),
  }));

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
    checkConfig();
    refreshProjects();
  };

  if (showLanding) {
    return <CinematicLanding onEnter={enterConsole} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-gray-400">Initializing Lear Intelligence Engine...</span>
      </div>
    );
  }

  return (
    <>
      {!isSetupComplete ? (
        <Wizard onComplete={handleSetupComplete} />
      ) : (
        <div className="flex h-screen w-full relative z-10 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary fallbackTitle="View Error" fallbackMessage="There was a problem rendering this section.">
              <SectionTransition sectionKey={activeTab}>
              {activeTab === 'dashboard' && (
                <Dashboard
                  activeProject={activeProject}
                  activeEnvironment={activeEnvironment}
                  onOpenWizard={() => setIsSetupComplete(false)}
                />
              )}
              {activeTab === 'chat' && <ChatWorkspace />}
              {activeTab === 'projects' && <Projects />}
              {activeTab === 'integrations' && <Integrations />}
              {activeTab === 'activity' && <ActivityLog />}
              {activeTab === 'notifications' && <Notifications />}
              {activeTab === 'settings' && (
                <Settings onReconfigure={() => setIsSetupComplete(false)} />
              )}
              </SectionTransition>
            </ErrorBoundary>
          </main>

          {/* Global Slide-In Alerts / Toasts */}
          <NotificationToast toasts={toasts} onDismiss={dismissToast} />

          {/* Global Lear Copilot Chatbot */}
          <Chatbot
            isOpen={chatOpen}
            onClose={closeChat}
            serviceContext={chatContext}
          />

          {/* Cmd/Ctrl+K — 1,557 playbooks + every section, one keystroke away.
              The catalogue is dynamically imported on first open. */}
          <CommandPalette navCommands={navCommands} />

          {/* Reveals every panel inside every section as it comes into view.
              Renders nothing; fail-visible if it never runs. */}
          <SubsectionChoreography />

          {/* Power-on sequence for the console handoff (self-unmounting) */}
          {igniting && <ConsoleIgnition onDone={() => setIgniting(false)} />}
        </div>
      )}
    </>
  );
}

function App() {
  useEffect(() => {
    logAnimationRegistry();
    // eslint-disable-next-line no-console
    console.info(
      `%cLEAR%c sound engine — ${SFX_COUNT} procedural sci-fi sounds (zero audio assets)`,
      'background:#22d3ee;color:#04121a;padding:2px 6px;border-radius:4px;font-weight:700',
      'color:#aab3c8',
    );
  }, []);

  return (
    <ErrorBoundary fallbackTitle="Lear Application Error" fallbackMessage="A critical error occurred while loading the application.">
      <LearProvider>
        {/* Cinematic z-stack (back → front):
            -11 live/brightened video backdrop · -10/-9 aurora neural field ·
             app content · 90 atmosphere film grain · 95 perf HUD */}
        <LiveVideoBackdrop brightness={1.28} />
        <AuroraBackground />
        <PointerSpotlight />
        {/* Pointer-tracked 3D parallax on every panel. One global
            listener for the whole document - see DepthField.tsx. */}
        <DepthField />
        <SoundManager />
        <AtmosphereOverlay />
        <PerfOverlay />
        <AppContent />
      </LearProvider>
    </ErrorBoundary>
  );
}

export default App;
