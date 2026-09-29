import { useEffect, useRef, useState } from 'react';
import { Activity, Brain, Zap, Plug, MessageSquare, ArrowRight, Compass } from 'lucide-react';
import './CinematicLanding.css';
import { sfx, CUES } from '../../lib/soundEngine';
import DirectionSequence from './DirectionSequence';
import SoundControl from './SoundControl';

/* =============================================================================
   LEAR CINEMATIC LANDING
   -----------------------------------------------------------------------------
   A faithful port of the "Mostar city" cinematic-scroll rig — identical sticky
   stage, scroll-scrubbed layered parallax, pointer parallax, segmented
   smoothstep choreography, counter-scaled slider, and infinite 3-set carousel —
   re-themed entirely for Lear (AI DevOps). Scrubbing ~3700px reveals the story
   "observe → diagnose → act", then the capability carousel flies in. The header
   "Enter Console" button (and the final CTA) hands off into the real app.
   ========================================================================== */

const CARDS = [
  { kicker: 'Observe', title: 'Live Watchers', body: 'Continuous eyes on CI, Kubernetes, deploys and cloud health — in real time.', Icon: Activity, aria: 'Open Live Watchers' },
  { kicker: 'Understand', title: 'Root-Cause Brain', body: 'Correlates signals across every tool into one diagnosis, not more noise.', Icon: Brain, aria: 'Open Root-Cause Brain' },
  { kicker: 'Act', title: 'Autonomous Remediation', body: 'Opens PRs, restarts pods, rolls back and scales — always with your approval.', Icon: Zap, aria: 'Open Autonomous Remediation' },
  { kicker: 'Connect', title: '13 Integrations', body: 'AWS, GCP, Azure, Kubernetes, GitHub, Datadog, PagerDuty, Terraform and more.', Icon: Plug, aria: 'Open Integrations' },
  { kicker: 'Ask', title: 'Copilot Chat', body: 'Talk to your infrastructure and drive real actions in plain language.', Icon: MessageSquare, aria: 'Open Copilot Chat' },
];

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smoothstep = (e0: number, e1: number, v: number) => {
  const x = clamp((v - e0) / (e1 - e0));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const segmentInOut = (s: number, a: number, b: number, c: number, d: number) => {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
};

export const CinematicLanding: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const enteredRef = useRef(false);
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const openSequence = () => { CUES.panelOpen(); setSequenceOpen(true); };
  const closeSequence = () => setSequenceOpen(false);

  const enter = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    try { sfx('hero.impact'); } catch { /* noop */ }
    onEnter();
  };

  useEffect(() => {
    const root = rootRef.current;
    const section = sectionRef.current;
    const track = trackRef.current;
    const controls = controlsRef.current;
    if (!root || !section || !track || !controls) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const originalCount = CARDS.length;
    let cards = Array.from(track.querySelectorAll<HTMLElement>('.sight-card'));
    let activeSight = originalCount; // start in the middle set

    let targetMouseX = 0, targetMouseY = 0, mouseX = 0, mouseY = 0;
    let targetScroll = 0, smoothScroll = 0;
    let initialized = false, rafPending = false;

    const setVar = (k: string, v: string) => root.style.setProperty(k, v);

    /* ---- slider ---------------------------------------------------------- */
    const updateSlider = () => {
      if (!cards.length) return;
      const cardWidth = cards[0].offsetWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      setVar('--sights-shift', `${-(cardWidth + gap) * activeSight}px`);
      cards.forEach((c) =>
        c.classList.toggle('is-active', Number(c.dataset.sightIndex) === activeSight),
      );
    };
    const moveSlider = (dir: number) => { activeSight += dir; try { sfx('slider.move.01'); } catch { /* */ } updateSlider(); };
    const selectCard = (card: HTMLElement) => {
      const i = Number(card.dataset.sightIndex);
      if (Number.isFinite(i)) activeSight = i;
      try { sfx('ui.tap.01'); } catch { /* */ }
      updateSlider();
    };
    const jumpSlider = (i: number) => {
      track.classList.add('is-jumping');
      activeSight = i;
      updateSlider();
      requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('is-jumping')));
    };
    const normalizeSlider = () => {
      if (activeSight >= originalCount * 2) jumpSlider(activeSight - originalCount);
      else if (activeSight < originalCount) jumpSlider(activeSight + originalCount);
    };

    const onCardClick = (e: Event) => selectCard(e.currentTarget as HTMLElement);
    const onCardKey = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); selectCard(e.currentTarget as HTMLElement); }
    };
    cards.forEach((c) => {
      c.addEventListener('click', onCardClick);
      c.addEventListener('keydown', onCardKey);
    });
    track.addEventListener('transitionend', normalizeSlider);
    updateSlider();

    /* ---- per-frame update ------------------------------------------------ */
    const getScrollDistance = () =>
      clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);

    const update = () => {
      rafPending = false;
      targetScroll = getScrollDistance();
      if (!initialized || reduceMotion.matches) { smoothScroll = targetScroll; initialized = true; }
      else smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
      if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

      mouseX = lerp(mouseX, targetMouseX, 0.12);
      mouseY = lerp(mouseY, targetMouseY, 0.12);

      const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
      const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
      const progress = clamp(smoothScroll / 2700);
      const introExit = smoothstep(90, 650, smoothScroll);
      const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
      const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
      const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
      const blurActive = clamp(frame2.active + frame3.active);
      const frame2Opacity = frame2.active * (1 - frame3.enter);
      const splitDrift = Math.pow(frame2.enter, 1.5);
      const panel2Opacity = frame2.active * (1 - frame2.exit);
      const panel3Opacity = frame3.active * (1 - frame3.exit);
      const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
      const sharedHeroY = progress * -74;
      const sharedHeroScale = progress * 0.23;
      const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
      const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

      setVar('--mx', (reduceMotion.matches ? 0 : mouseX).toFixed(4));
      setVar('--my', (reduceMotion.matches ? 0 : mouseY).toFixed(4));
      setVar('--back-opacity', (1 - frame2.active * 0.06).toFixed(4));
      setVar('--back-x', `${(mouseX * -12).toFixed(2)}px`);
      setVar('--back-y', `${(mouseY * -4).toFixed(2)}px`);
      setVar('--back-scale', backScale.toFixed(4));
      setVar('--four-y', `${(10 + progress * 10).toFixed(2)}vh`);
      setVar('--four-scale', (0.78 + progress * 0.16).toFixed(4));
      setVar('--bazaar-y', `${(20 - progress * 8).toFixed(2)}vh`);
      setVar('--blur-px', `${(blurActive * 14).toFixed(2)}px`);
      setVar('--back-brightness', (1 - blurActive * 0.255).toFixed(4));
      setVar('--bazaar-blur-px', `${(frame2.active * 14).toFixed(2)}px`);
      setVar('--bazaar-brightness', (1 - frame2.active * 0.255 - frame3.active * 0.06).toFixed(4));
      setVar('--bazaar-saturation', (1 + frame3.active * 0.18).toFixed(4));
      setVar('--shade-opacity', '1');
      setVar('--shade-z', frame2.active > 0.02 ? '2' : '0');
      setVar('--shade-top-alpha', (blurActive * 0.465).toFixed(4));
      setVar('--shade-mid-alpha', (blurActive * 0.42).toFixed(4));
      setVar('--shade-bottom-alpha', (blurActive * 0.51).toFixed(4));

      setVar('--title-y', `${(introExit * -210).toFixed(2)}px`);
      setVar('--title-scale', (1 - introExit * 0.08).toFixed(4));
      setVar('--title-opacity', (1 - introExit).toFixed(4));

      setVar('--bridge-x', `calc(-50% + ${(mouseX * 18).toFixed(2)}px)`);
      setVar('--bridge-y', `${(mouseY * 8 + sharedHeroY - frame2.exit * 760).toFixed(2)}px`);
      setVar('--bridge-bottom', `${(5 - frame2.enter * 13).toFixed(2)}vh`);
      setVar('--bridge-width', `${(72 + frame2.enter * 37.8).toFixed(2)}vw`);
      setVar('--bridge-scale', (1.02 + sharedHeroScale + frame2.exit * 0.46).toFixed(4));

      setVar('--split-left-x', `calc(-50% + ${(-splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
      setVar('--split-left-y', `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
      setVar('--split-left-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));
      setVar('--split-right-x', `calc(-50% + ${(splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
      setVar('--split-right-y', `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
      setVar('--split-right-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));

      setVar('--frame2-opacity', frame2Opacity.toFixed(4));
      setVar('--frame2-x', `calc(-50% + ${(mouseX * 10).toFixed(2)}px)`);
      setVar('--frame2-y', `calc(-50% + ${(mouseY * 8 - frame2.exit * 150).toFixed(2)}px)`);
      setVar('--frame2-scale', (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toFixed(4));

      setVar('--intro-copy-y', `${(introExit * 90).toFixed(2)}px`);
      setVar('--intro-copy-opacity', (1 - introExit).toFixed(4));
      setVar('--panel2-opacity', panel2Opacity.toFixed(4));
      setVar('--panel2-y', `calc(-50% + ${(-frame2.exit * 86 + (1 - frame2.enter) * 58).toFixed(2)}px)`);
      setVar('--panel3-opacity', panel3Opacity.toFixed(4));
      setVar('--panel3-y', `calc(-50% + ${(-frame3.exit * 86 + (1 - frame3.enter) * 58).toFixed(2)}px)`);

      setVar('--sights-opacity', sightsEnter.toFixed(4));
      setVar('--sights-controls-opacity', sightsControlsEnter.toFixed(4));
      controls.classList.toggle('is-ready', sightsControlsEnter > 0.98);
      setVar('--sights-visibility', sightsEnter > 0.01 ? 'visible' : 'hidden');
      setVar('--sights-y', '0px');
      setVar('--sights-enter-x', `${((1 - sightsEnter) * 420).toFixed(2)}vw`);
      setVar('--sights-scale', (1 / backScale).toFixed(4));
      setVar('--sights-top', `${sightsParentTop.toFixed(2)}px`);
      setVar('--sights-screen-top', `${sightsScreenTop.toFixed(2)}px`);

      if (
        Math.abs(smoothScroll - targetScroll) > 0.08 ||
        Math.abs(mouseX - targetMouseX) > 0.001 ||
        Math.abs(mouseY - targetMouseY) > 0.001
      ) requestTick();
    };

    const requestTick = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(update);
    };

    const onScroll = () => requestTick();
    const onResize = () => { updateSlider(); requestTick(); };
    const onMove = (e: PointerEvent) => {
      targetMouseX = e.clientX / window.innerWidth - 0.5;
      targetMouseY = e.clientY / window.innerHeight - 0.5;
      requestTick();
    };
    const onPrev = () => moveSlider(-1);
    const onNext = () => moveSlider(1);

    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    const prevBtn = controls.querySelector<HTMLButtonElement>('.sight-prev');
    const nextBtn = controls.querySelector<HTMLButtonElement>('.sight-next');
    prevBtn?.addEventListener('click', onPrev);
    nextBtn?.addEventListener('click', onNext);

    requestTick();

    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      prevBtn?.removeEventListener('click', onPrev);
      nextBtn?.removeEventListener('click', onNext);
      track.removeEventListener('transitionend', normalizeSlider);
      cards.forEach((c) => {
        c.removeEventListener('click', onCardClick);
        c.removeEventListener('keydown', onCardKey);
      });
      cards = [];
    };
  }, []);

  // 3 identical sets = seamless infinite loop
  const sets = [0, 1, 2];

  return (
    <div className="lear-cinema" ref={rootRef} aria-label="Lear cinematic intro">
      <main className="site-shell">
        <section className="cinema-scroll" ref={sectionRef} aria-label="Lear cinematic scroll story">
          <div className="stage">
            <div className="world">
              <img className="scene-img sky-img" src="/media/backdrop-gold.png" alt="" />

              <header className="site-header" aria-label="Primary navigation">
                <a className="site-logo" href="#cinema"><b>LEAR</b> · AI DEVOPS</a>
                <nav className="site-nav" aria-label="Main menu">
                  <a href="#cinema">Intro</a>
                  <a href="#bridge">Diagnose</a>
                  <a href="#bazaar">Act</a>
                  <a onClick={openSequence}>Direction</a>
                  <a onClick={enter}>Console</a>
                </nav>
                <button className="direction-btn" onClick={openSequence} aria-label="Open the Lear direction sequence">
                  <Compass size={15} /> Direction
                </button>
                <button className="enter-btn" onClick={enter} aria-label="Enter the Lear console">
                  Enter Console <ArrowRight size={15} />
                </button>
              </header>

              <div className="back-stack">
                <img className="scene-img back-img back-four" src="/media/lear-core-gold.png" alt="" />
                <section className="sights-slider" aria-label="Lear capabilities slider">
                  <div className="sights-track" ref={trackRef}>
                    {sets.map((setIndex) =>
                      CARDS.map((c, i) => {
                        const { Icon } = c;
                        return (
                          <article
                            key={`${setIndex}-${i}`}
                            className="sight-card"
                            tabIndex={0}
                            role="button"
                            aria-label={c.aria}
                            data-sight-index={setIndex * CARDS.length + i}
                          >
                            <span className="sight-kicker">{c.kicker}</span>
                            <span className="sight-pin"><Icon size={26} /></span>
                            <h3>{c.title}</h3>
                            <p>{c.body}</p>
                          </article>
                        );
                      }),
                    )}
                  </div>
                </section>
                <img className="scene-img back-img back-bazaar" src="/media/lear-city.png" alt="" />
              </div>

              <div className="sights-controls" ref={controlsRef} aria-label="Slider controls">
                <button className="sight-nav sight-prev" aria-label="Previous capability">←</button>
                <button className="sight-nav sight-next" aria-label="Next capability">→</button>
              </div>

              <h1 className="hero-title">LEAR</h1>

              <img className="scene-img splitframe-img splitframe-left" src="/media/lear-monolith.png" alt="" />
              <img className="scene-img splitframe-img splitframe-right" src="/media/lear-monolith.png" alt="" />
              <img className="scene-img bridge-img" src="/media/lear-bridge-gold.png" alt="" />
              <img className="scene-img frame-two-img" src="/media/lear-frame2.png" alt="" />
              <div className="shade" />

              <div className="scroll-hint"><span className="mouse" />Scroll</div>
            </div>

            <section className="intro-copy" aria-label="Lear overview">
              <p>An AI agent that watches your infrastructure — CI, Kubernetes, deployments — and acts on what it finds, not just alerts. Local-first. Your credentials never leave your machine.</p>
              <div className="hero-tags" aria-label="Lear highlights">
                <span>Autonomous remediation</span>
                <span>13 integrations</span>
                <span>Local-first &amp; private</span>
              </div>
            </section>

            <section className="story-panel story-panel-bridge" aria-label="Diagnosis details">
              <h2>Lear reads the whole system.</h2>
              <p>It correlates CI logs, cluster events, deploys and cloud signals across every connected tool into a single root-cause diagnosis — so you see the cause, not a wall of alerts.</p>
              <dl className="facts">
                <div><dt>13</dt><dd>Cloud &amp; DevOps integrations, unified</dd></div>
                <div><dt>24/7</dt><dd>Watchers with exponential backoff</dd></div>
              </dl>
            </section>

            <section className="story-panel story-panel-bazaar" aria-label="Action details">
              <h2>Then it acts — not just alerts.</h2>
              <p>Open a fix PR, restart a pod, roll back a deploy, scale a service, silence the right alert — every action gated by your approval and fully audited.</p>
              <button className="note-button" onClick={enter}>
                <span aria-hidden="true">↗</span>
                <span>Enter the Lear console</span>
              </button>
            </section>
          </div>
        </section>
      </main>

      <SoundControl className="landing-sound" />

      {sequenceOpen && (
        <DirectionSequence onClose={closeSequence} onEnter={enter} />
      )}
    </div>
  );
};

export default CinematicLanding;
