/* =============================================================================
   API BASE SHIM — one switch that makes the SAME build run in three places
   -----------------------------------------------------------------------------
   The whole app calls relative `/api/*` and `/ws/*` (Vite proxies them to the
   local FastAPI backend in dev, and Tauri hits the same origin). That is the
   contract and it is NOT changed.

   For a Vercel/static deploy where the frontend is served from a different
   origin than the Python backend, set `VITE_API_BASE` at build time
   (e.g. https://your-lear-backend.example.com). This shim then transparently
   rewrites relative /api and /ws requests to that base — WITHOUT editing any of
   the dozens of existing fetch() call-sites, and WITHOUT any behavior change
   when the var is empty (the default for local `npm start`).
   ========================================================================== */

const RAW = (import.meta.env.VITE_API_BASE ?? '').toString().trim();
export const API_BASE = RAW.replace(/\/$/, '');

export function installApiBase() {
  if (!API_BASE || typeof window === 'undefined') return; // relative default — no-op

  const httpBase = API_BASE;
  const wsBase = API_BASE.replace(/^http/, 'ws');
  const origFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        return origFetch(httpBase + input, init);
      }
      if (input instanceof Request && input.url.startsWith('/api/')) {
        return origFetch(new Request(httpBase + new URL(input.url, location.origin).pathname + new URL(input.url, location.origin).search, input), init);
      }
    } catch {
      /* fall through to original */
    }
    return origFetch(input as RequestInfo, init);
  }) as typeof window.fetch;

  // Rewrite same-origin /ws/* WebSocket connections to the configured backend.
  const OrigWS = window.WebSocket;
  const PatchedWS = function (this: WebSocket, url: string | URL, protocols?: string | string[]) {
    let u = typeof url === 'string' ? url : url.toString();
    if (u.startsWith('/ws/')) u = wsBase + u;
    else if (u.startsWith(location.origin + '/ws/')) u = wsBase + u.slice(location.origin.length);
    return new OrigWS(u, protocols as string | string[] | undefined);
  } as unknown as typeof WebSocket;
  PatchedWS.prototype = OrigWS.prototype;
  (PatchedWS as unknown as { CONNECTING: number }).CONNECTING = OrigWS.CONNECTING;
  (PatchedWS as unknown as { OPEN: number }).OPEN = OrigWS.OPEN;
  (PatchedWS as unknown as { CLOSING: number }).CLOSING = OrigWS.CLOSING;
  (PatchedWS as unknown as { CLOSED: number }).CLOSED = OrigWS.CLOSED;
  window.WebSocket = PatchedWS;
}
