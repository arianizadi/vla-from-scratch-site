"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useInView, usePageVisible, useReducedMotion } from "@/figures/kit/hooks";
import { HOLD, LAST_HOLD, LOOP_FADE } from "./motion";

export interface AnimationFrameProps {
  /** Short visible title: what the drawing is about, in a few words. */
  title: string;
  /**
   * The whole animation in one or two plain sentences, for screen readers and
   * for anyone who cannot watch it. Say what happens, not what it looks like.
   */
  description: string;
  /** One short caption per step, shown under the drawing as the step plays. At least one. */
  steps: string[];
  /** Draws the scene for a step (0-based). Pure: same step, same drawing. */
  children: (step: number) => ReactNode;
  /** Drawing size in SVG units. Default [480, 280]; keep text at 14 units or more. */
  size?: [number, number];
  /** The step shown with reduced motion, before scripts run and in print. Default: the last. */
  still?: number;
  /** How long each step stays, ms: one number for all, or one per step. */
  hold?: number | number[];
  /** Start again after the last step. Default true. */
  loop?: boolean;
  className?: string;
}

const subscribeNothing = () => () => {};

/** False during the server render and hydration, true after. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

function holdFor(hold: AnimationFrameProps["hold"], step: number, last: number): number {
  if (Array.isArray(hold)) return hold[step] ?? (step === last ? LAST_HOLD : HOLD);
  if (typeof hold === "number") return step === last ? Math.max(hold, LAST_HOLD) : hold;
  return step === last ? LAST_HOLD : HOLD;
}

/**
 * The frame every explanation animation is drawn in: title, the SVG stage,
 * one caption per step, step pips, play/pause and replay.
 *
 * - Plays when at least 45% of it is on screen, pauses when it leaves or the
 *   tab is hidden, and loops.
 * - The server renders the `still` step, so the page never shifts and works
 *   without scripts. With reduced motion the still step stays; the pips still
 *   switch steps, instantly.
 * - Colours come from CSS variables (tone classes), so both themes work.
 */
export function AnimationFrame({
  title,
  description,
  steps,
  children,
  size = [480, 280],
  still,
  hold,
  loop = true,
  className = "",
}: AnimationFrameProps) {
  const last = Math.max(0, steps.length - 1);
  const stillStep = Math.min(Math.max(still ?? last, 0), last);

  const ref = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const inView = useInView(ref, { amount: 0.45 });

  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [started, setStarted] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [fading, setFading] = useState(false);
  const [instant, setInstant] = useState(false);
  const [manualStep, setManualStep] = useState<number | null>(null);
  const [announced, setAnnounced] = useState("");

  const motion = hydrated && !reduced;
  const playing = motion && inView && pageVisible && !userPaused && !ended;

  // Mark the first time the animation plays: until then it rests on step 0 without transitions.
  useEffect(() => {
    if (!playing || started) return;
    const timer = window.setTimeout(() => setStarted(true), 0);
    return () => window.clearTimeout(timer);
  }, [playing, started]);

  // The clock: hold the step, then move on (or fade and loop from the start).
  useEffect(() => {
    if (!playing || !started) return;
    const timers: number[] = [];
    const wait = holdFor(hold, step, last);
    timers.push(
      window.setTimeout(() => {
        if (step < last) {
          setStep(step + 1);
          return;
        }
        if (!loop) {
          setEnded(true);
          return;
        }
        if (last === 0) {
          setCycle((value) => value + 1);
          return;
        }
        setFading(true);
        timers.push(
          window.setTimeout(() => {
            setInstant(true);
            setStep(0);
            setCycle((value) => value + 1);
            timers.push(
              window.setTimeout(() => {
                setInstant(false);
                setFading(false);
              }, 40),
            );
          }, LOOP_FADE),
        );
      }, wait),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [playing, started, step, last, loop, hold, cycle]);

  // Which step is drawn: the still one on the server and under reduced motion
  // (unless the reader picked one), otherwise the clock's.
  const shownStep = !motion ? (manualStep ?? stillStep) : step;
  const resting = motion && !started;

  const goTo = (target: number) => {
    if (motion) {
      setStep(target);
      setUserPaused(true);
      setStarted(true);
      setEnded(false);
    } else {
      setManualStep(target);
    }
    setAnnounced(`Step ${target + 1} of ${steps.length}: ${steps[target]}`);
  };

  const togglePlay = () => {
    if (ended) {
      replay();
      return;
    }
    setUserPaused(playing);
    setStarted(true);
    setAnnounced(playing ? "Paused" : "Playing");
  };

  const replay = () => {
    setInstant(true);
    setStep(0);
    setCycle((value) => value + 1);
    setEnded(false);
    setUserPaused(false);
    setStarted(true);
    window.setTimeout(() => setInstant(false), 40);
    setAnnounced("Playing from the start");
  };

  const titleId = useId();
  const descId = useId();
  const [width, height] = size;

  return (
    <figure
      ref={ref}
      className={`anim ${className}`}
      data-playing={playing ? "true" : "false"}
      data-instant={instant || resting ? "" : undefined}
      data-fading={fading ? "" : undefined}
    >
      <figcaption className="anim-head">
        <span id={titleId} className="anim-title">
          {title}
        </span>
        {motion ? (
          <span className="anim-buttons">
            <button
              type="button"
              className="anim-button"
              onClick={replay}
              aria-label="Play from the start"
              title="Play from the start"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                <path
                  d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.5v3h3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="anim-button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              title={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d="M5 3.5v9M11 3.5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d="M5 3.2v9.6L12.6 8z" fill="currentColor" />
                </svg>
              )}
            </button>
          </span>
        ) : null}
      </figcaption>

      <div className="anim-stage">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descId}
          style={{ aspectRatio: `${width} / ${height}` }}
          className="anim-svg"
        >
          {children(shownStep)}
        </svg>
      </div>
      <p id={descId} className="sr-only">
        {description}
      </p>

      <div className="anim-foot">
        {steps.length > 1 ? (
          <ol className="anim-pips" aria-label="Steps">
            {steps.map((label, index) => (
              <li key={index}>
                <button
                  type="button"
                  className="anim-pip"
                  aria-label={`Step ${index + 1}: ${label}`}
                  aria-current={index === shownStep ? "step" : undefined}
                  onClick={() => goTo(index)}
                >
                  <span
                    key={index === shownStep ? `${cycle}-${shownStep}` : undefined}
                    className="anim-pip-fill"
                    style={
                      index === shownStep ? { animationDuration: `${holdFor(hold, index, last)}ms` } : undefined
                    }
                    data-run={index === shownStep && motion && started ? "" : undefined}
                    data-done={index < shownStep ? "" : undefined}
                  />
                </button>
              </li>
            ))}
          </ol>
        ) : null}
        <p className="anim-caption" aria-hidden="true">
          {steps.length > 1 ? <span className="anim-count">{shownStep + 1}</span> : null}
          <span key={shownStep} className="anim-caption-text">
            {steps[shownStep]}
          </span>
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </figure>
  );
}
