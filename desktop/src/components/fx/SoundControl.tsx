import { useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  isSfxEnabled, setSfxEnabled, onSfxEnabledChange,
  getSfxVolumePct, setSfxVolumePct, onSfxVolumeChange,
  unlockSfx, sfx, MAX_VOLUME, SFX_COUNT,
} from '../../lib/soundEngine';

/* =============================================================================
   SOUND CONTROL — mute toggle + volume slider
   -----------------------------------------------------------------------------
   The slider is 0..100% of MAX_VOLUME (1.6), i.e. the top of the slider is
   deliberately ABOVE unity gain so "max" is genuinely loud. The compressor in
   the engine keeps that from clipping.

   Every interaction is itself audible: notch ticks while dragging, a toggle
   sound on mute/unmute, and a reference tone on release so you can hear the
   level you just chose.
   ========================================================================== */

export interface SoundControlProps {
  className?: string;
  /** Compact renders icon + slider only, no label row. */
  compact?: boolean;
}

export const SoundControl: React.FC<SoundControlProps> = ({ className = '', compact = false }) => {
  const [enabled, setEnabled] = useState(isSfxEnabled);
  const [pct, setPct] = useState(getSfxVolumePct);

  useEffect(() => onSfxEnabledChange(setEnabled), []);
  useEffect(() => onSfxVolumeChange(() => setPct(getSfxVolumePct())), []);

  const toggle = useCallback(() => {
    unlockSfx();
    const next = !enabled;
    setSfxEnabled(next);
    setEnabled(next);
    if (next) sfx('ctrl.toggle.on');
  }, [enabled]);

  const onSlide = useCallback((v: number) => {
    unlockSfx();
    setPct(v);
    setSfxVolumePct(v);
    sfx(`ctrl.notch.${String(Math.min(8, Math.max(1, Math.round(v * 8)))).padStart(2, '0')}`, { minGapMs: 28 });
  }, []);

  const gain = (pct * MAX_VOLUME).toFixed(2);

  return (
    <div
      className={`sndctl ${enabled ? 'is-on' : 'is-off'} ${compact ? 'is-compact' : ''} ${className}`}
      role="group"
      aria-label="Sound controls"
    >
      <button
        type="button"
        className="sndctl-toggle"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? 'Mute interface sound' : 'Unmute interface sound'}
        title={`${SFX_COUNT} procedural sound effects`}
      >
        {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      <input
        type="range"
        className="sndctl-slider"
        min={0}
        max={1}
        step={0.01}
        value={pct}
        disabled={!enabled}
        onChange={(e) => onSlide(parseFloat(e.target.value))}
        onPointerUp={() => enabled && sfx('ctrl.volume.test')}
        onKeyUp={() => enabled && sfx('ctrl.volume.test')}
        aria-label="Interface sound volume"
        aria-valuetext={`${Math.round(pct * 100)} percent, gain ${gain}`}
        style={{ ['--fill' as string]: `${pct * 100}%` }}
      />

      {!compact && (
        <span className="sndctl-value" aria-hidden="true">
          {enabled ? `${Math.round(pct * 100)}%` : 'MUTED'}
        </span>
      )}
    </div>
  );
};

export default SoundControl;
