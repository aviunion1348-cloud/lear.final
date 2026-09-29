/* =============================================================================
   CONSOLE ENTRY — the screen must never be blank after "Enter Console"
   -----------------------------------------------------------------------------
   Reported bug: crossing from the landing into the app sometimes left an empty
   screen. Three of the new FX layers are capable of causing that, so each gets
   a test that renders the real App and asserts content is actually on screen:

     1. SubsectionChoreography dims panels it is about to reveal. If its
        IntersectionObserver never fires, those panels must still end up
        visible.
     2. ConsoleIgnition paints a full-screen veil. It must unmount itself.
     3. Any throw inside an FX effect would hit the ErrorBoundary and replace
        the console with a fallback. That must not happen.
   ========================================================================== */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

/** IntersectionObserver that records targets and never reports them visible. */
class SilentIO {
  static instances: SilentIO[] = [];
  observed: Element[] = [];
  constructor(_cb: IntersectionObserverCallback) {
    SilentIO.instances.push(this);
  }
  observe(el: Element) { this.observed.push(el); }
  unobserve(el: Element) { this.observed = this.observed.filter((e) => e !== el); }
  disconnect() { this.observed = []; }
  takeRecords() { return []; }
}

const CONNECTORS = {
  connectors: [
    {
      id: 'aws', name: 'AWS EC2', category: 'infrastructure', icon: 'cloud',
      color: '#e8b44a', description: 'Monitor AWS EC2 instances.',
      status: 'unconfigured',
      auth_fields: [
        { key: 'AWS_ACCESS_KEY_ID', label: 'Access Key ID', type: 'text', required: true },
      ],
    },
  ],
};

function mockApi(configured: boolean) {
  return vi.fn(async (input: any) => {
    const url = String(typeof input === 'string' ? input : input?.url ?? '');
    const json = url.includes('/api/connectors')
      ? CONNECTORS
      : url.includes('/api/config')
      ? { services: configured ? { aws: { configured: true } } : {} }
      : {};
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => json,
      text: async () => JSON.stringify(json),
    } as any;
  });
}

beforeEach(() => {
  SilentIO.instances = [];
  vi.stubGlobal('IntersectionObserver', SilentIO as any);
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  // Landing is a separate gate; these tests are about what comes after it.
  sessionStorage.setItem('lear.landing.seen', '1');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
  document.body.innerHTML = '';
});

describe('entering the console', () => {
  it('renders the onboarding wizard, not an empty screen', async () => {
    vi.stubGlobal('fetch', mockApi(false));
    render(<App />);
    expect(await screen.findByText(/Connect Your Infrastructure/i)).toBeInTheDocument();
  });

  it('never leaves the error boundary fallback on screen', async () => {
    vi.stubGlobal('fetch', mockApi(false));
    render(<App />);
    await screen.findByText(/Connect Your Infrastructure/i);
    expect(screen.queryByText(/Lear Application Error/i)).toBeNull();
    expect(screen.queryByText(/View Error/i)).toBeNull();
  });

  it('leaves nothing dimmed when the IntersectionObserver never fires', async () => {
    // This is the blank-screen scenario: panels get tagged for reveal, but the
    // observer stays silent. Nothing may remain in the hidden 'pending' state.
    vi.stubGlobal('fetch', mockApi(false));
    render(<App />);
    await screen.findByText(/Connect Your Infrastructure/i);

    await waitFor(
      () => {
        expect(document.querySelectorAll('[data-sub="pending"]').length).toBe(0);
      },
      { timeout: 3000 },
    );
  });

  it('keeps the heading in the accessibility tree (not just painted)', async () => {
    vi.stubGlobal('fetch', mockApi(false));
    render(<App />);
    const h = await screen.findByRole('heading', { name: /Connect Your Infrastructure/i });
    expect(h).toBeVisible();
  });

  it('shows the connector header exactly once', async () => {
    vi.stubGlobal('fetch', mockApi(false));
    render(<App />);
    await screen.findByText(/Connect Your Infrastructure/i);
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'AWS EC2' })).toHaveLength(1);
    });
  });

  it('renders the real console (sidebar + dashboard) once setup is complete', async () => {
    vi.stubGlobal('fetch', mockApi(true));
    render(<App />);
    // The console shell must appear, not an empty <main>.
    await waitFor(() => {
      expect(document.querySelector('main')).toBeTruthy();
    }, { timeout: 4000 });
    const main = document.querySelector('main') as HTMLElement;
    await waitFor(() => {
      expect(main.textContent?.trim().length ?? 0).toBeGreaterThan(20);
    }, { timeout: 4000 });
  });

  it('the ignition overlay never permanently covers the console', async () => {
    vi.stubGlobal('fetch', mockApi(true));
    sessionStorage.removeItem('lear.landing.seen');
    render(<App />);
    // Whatever the landing does, no full-screen veil may outlive the sequence.
    await waitFor(() => {
      expect(document.querySelector('.ignition')).toBeNull();
    }, { timeout: 4000 });
  });
});
