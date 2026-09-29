import { useEffect } from 'react';
import { sfx, unlockSfx, isSfxEnabled } from '../../lib/soundEngine';

/* =============================================================================
   SOUND MANAGER — gives every interactive element in the app a voice
   -----------------------------------------------------------------------------
   Mount once at the root. It:
     1. Unlocks the AudioContext on the first real user gesture (autoplay
        policy) and plays the Lear boot arpeggio exactly once per session.
     2. Delegates pointer sounds app-wide: any <button>, link, or
        [role="button"] gets a soft tactile click; elements carrying
        data-sfx="name" / data-sfx-hover="name" get their specific recipe.
        (Our own Button/Card primitives set richer sounds themselves and flag
        data-sfx-self so there is no double-trigger.)
     3. Listens for app events: 'lear:toast' (severity-mapped chimes) and
        'lear:sfx' (arbitrary named one-shot) so deep components never import
        the engine directly.
   ========================================================================== */

const TOAST_SOUNDS: Record<string, string> = {
  info: 'toast.info.01',
  success: 'toast.success.01',
  warning: 'toast.warning.01',
  warn: 'toast.warning.01',
  error: 'toast.error.01',
  critical: 'toast.critical.01',
};

export function SoundManager() {
  useEffect(() => {
    let booted = false;
    try {
      booted = sessionStorage.getItem('lear.sfx.booted') === '1';
    } catch { /* private mode */ }

    const onGesture = () => {
      const wasLocked = !booted;
      unlockSfx();
      if (wasLocked && isSfxEnabled()) {
        // Defer slightly so the context resume has landed
        setTimeout(() => sfx('system.boot', { minGapMs: 0 }), 120);
        try {
          sessionStorage.setItem('lear.sfx.booted', '1');
        } catch { /* ignore */ }
      }
      booted = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      onGesture();
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;
      const explicit = target.closest('[data-sfx]') as HTMLElement | null;
      if (explicit) {
        sfx(explicit.getAttribute('data-sfx') || 'ui.click.01');
        return;
      }
      if (target.closest('[data-sfx-self]') || target.closest('[data-no-sfx]')) return;
      const interactive = target.closest('button, a[href], [role="button"], input[type="checkbox"], input[type="radio"], select');
      if (interactive) {
        sfx('ui.tap.01', { minGapMs: 60 });
        return;
      }
      const input = target.closest('input, textarea');
      if (input) sfx('kbd.backspace', { minGapMs: 90 });
    };

    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;
      const hoverable = target.closest('[data-sfx-hover]') as HTMLElement | null;
      if (hoverable) {
        sfx(hoverable.getAttribute('data-sfx-hover') || 'ui.hover.01', { minGapMs: 70 });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      onGesture();
      if (e.key === 'Escape') sfx('kbd.esc', { minGapMs: 120 });
    };

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ severity?: string }>).detail;
      const sev = (detail?.severity || 'info').toLowerCase();
      sfx(TOAST_SOUNDS[sev] ?? TOAST_SOUNDS.info, { minGapMs: 250 });
    };

    const onSfxEvent = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (typeof name === 'string') sfx(name);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('lear:toast', onToast as EventListener);
    window.addEventListener('lear:sfx', onSfxEvent as EventListener);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('lear:toast', onToast as EventListener);
      window.removeEventListener('lear:sfx', onSfxEvent as EventListener);
    };
  }, []);

  return null;
}

export default SoundManager;
