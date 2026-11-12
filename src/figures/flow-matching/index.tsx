"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fixed, formatCount } from "@/data/format";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Segmented,
  Stepper,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { Measured } from "./Measured";
import { DEFAULT_STEPS, DEFAULT_SWEEP, latencyNote, rowAt, STEP_OPTIONS, SWEEPS } from "./sweeps";
import {
  carry,
  DRAWS,
  flow,
  HEDGE,
  LEVELS,
  levelAfter,
  MIDDLE,
  noise,
  ON_TARGET,
  schedule,
  score,
  TARGETS,
  TOY_STEPS,
  TRACED_START,
  type Field,
} from "./model";
import { Plane, SHOWN } from "./Plane";

const info = FIGURES["flow-matching"];

/** The noise every flow starts from: the same draws for every setting, on the server and in the browser. */
const NOISE = noise(DRAWS);

const FIELDS = [
  { value: "exact", label: "Exact" },
  { value: "hedging", label: "Hedging" },
] as const satisfies readonly { value: Field; label: string }[];

const FIRST_STEPS = STEP_OPTIONS.includes(DEFAULT_STEPS) ? DEFAULT_STEPS : TOY_STEPS[TOY_STEPS.length - 2];
/** Flow steps the sampler takes for FIRST_STEPS: the figure starts with them all done. */
const FIRST_LAST = schedule(FIRST_STEPS).levels.length;

/** Time per flow step while playing: a few seconds for the whole flow, never faster than 140 ms a step. */
function stepDuration(steps: number): number {
  return Math.min(700, Math.max(140, 2800 / steps));
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const coordinate = (value: number) => {
  const size = fixed(Math.abs(value), 2);
  return value < 0 && Number(size) !== 0 ? `−${size}` : size;
};
const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : `${value}`);

export default function FlowMatchingFigure({ caption }: FigureProps) {
  const [steps, setSteps] = useState(FIRST_STEPS);
  const [kind, setKind] = useState<Field>("exact");
  const [sweepName, setSweepName] = useState(DEFAULT_SWEEP);
  // Flow steps done (fractional while one is under way) and how far the timeline is to run.
  const [progress, setProgress] = useState(FIRST_LAST);
  const [target, setTarget] = useState(FIRST_LAST);

  const planeBox = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(planeBox);
  // Only the plane moves, so it is the plane that has to be on screen (on a phone the table is below it).
  const arrived = useInView(planeBox, { amount: 0.6, once: true });
  const onScreen = useInView(planeBox, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const result = useMemo(() => flow(NOISE, steps, kind), [steps, kind]);
  const traced = useMemo(() => carry(TRACED_START, steps, kind), [steps, kind]);
  const sweep = SWEEPS.find((entry) => entry.name === sweepName) ?? SWEEPS.find((entry) => entry.name === DEFAULT_SWEEP);
  const last = result.positions.length - 1;

  // Under reduced motion nothing plays: the drawing is wherever the timeline is headed.
  const shown = reducedMotion ? target : progress;
  const running = !reducedMotion && progress < target && onScreen && pageVisible;
  // Under way but held: the plane is off screen or the tab hidden. The flow waits where it is.
  const held = !reducedMotion && progress < target && !running;

  useEffect(() => {
    if (!running) return;
    const perStep = stepDuration(steps);
    let frame = 0;
    let previous: number | null = null;
    const tick = (now: number) => {
      const elapsed = previous === null ? 0 : now - previous;
      previous = now;
      setProgress((current) => Math.min(target, current + elapsed / perStep));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, target, steps]);

  // Play the flow once, when the figure has arrived on screen and stayed for a moment.
  const autoplayed = useRef(false);
  useEffect(() => {
    if (!arrived || reducedMotion || autoplayed.current) return;
    const timer = setTimeout(() => {
      // The reader may have chosen a setting in the meantime; that already played it.
      if (autoplayed.current) return;
      autoplayed.current = true;
      setProgress(0);
      setTarget(last);
    }, 400);
    return () => clearTimeout(timer);
  }, [arrived, reducedMotion, last]);

  /**
   * A new setting: replay its flow from the noise, or show it finished when
   * nothing may move or the plane is off screen (a replay there would only wait,
   * unseen, at its first step).
   */
  const restart = (count: number) => {
    autoplayed.current = true;
    setProgress(reducedMotion || !onScreen ? count : 0);
    setTarget(count);
  };
  const chooseSteps = (count: number) => {
    setSteps(count);
    // The sampler takes as many steps as its schedule lists (for a count that does not divide 1000, one more).
    restart(schedule(count).levels.length);
  };
  const chooseKind = (next: Field) => {
    setKind(next);
    restart(last);
  };

  const done = Math.min(Math.floor(shown + 1e-9), last);
  const ended = shown >= last - 1e-9;
  const playing = running;
  const togglePlay = () => {
    if (playing) {
      setTarget(progress);
      return;
    }
    autoplayed.current = true;
    if (held) {
      // The flow is waiting for the plane to be seen: bring it on screen and it goes on from where it is.
      planeBox.current?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (ended) setProgress(0);
    setTarget(last);
  };
  const stepTo = (next: number) => {
    autoplayed.current = true;
    if (reducedMotion || !onScreen || next < shown) setProgress(next);
    setTarget(next);
  };

  const measuredRow = rowAt(sweep, steps);
  const end = traced.path[traced.path.length - 1];
  const fieldWords = kind === "exact" ? "the exact field" : `a hedging field (weights flattened ${HEDGE} times)`;
  const percent = (share: number) => `${fixed(100 * share, 1)}%`;
  const toyResult = `${percent(result.onTarget)} of the ${DRAWS.toLocaleString("en-US")} draws end within ${ON_TARGET} of a target and ${percent(result.middle)} in the middle`;

  // The status line follows the step shown, and changes only when a step completes.
  const now = useMemo(() => score(result.positions[done]), [result, done]);
  const fieldName = kind === "exact" ? "exact field" : "hedging field";
  const allSteps = last === 1 ? "the flow step" : `all ${last} flow steps`;
  const stepWords =
    done === 0
      ? `Before the first of ${plural(last, "flow step", "flow steps")}, ${fieldName} (pure noise)`
      : done === last
        ? `After ${allSteps}, ${fieldName}`
        : `After ${done} of ${last} flow steps, ${fieldName} (noise level s = ${fixed(levelAfter(result, done), 2)})`;
  const nowWords = `${stepWords}: ${percent(now.onTarget)} of the draws within ${ON_TARGET} of a target, ${percent(now.middle)} in the middle.`;
  const endWords = done === last ? "" : ` After ${allSteps}: ${percent(result.onTarget)} on a target, ${percent(result.middle)} in the middle.`;
  const hedgeWords =
    kind === "hedging"
      ? " Hedging delays the choice of target: with few flow steps the draws stay between the targets, with enough they still reach one."
      : "";
  const measuredWords = !sweep
    ? ""
    : measuredRow
      ? ` Measured, ${sweep.label.charAt(0).toLowerCase()}${sweep.label.slice(1)}, with ${plural(steps, "flow step", "flow steps")}: ${formatCount(measuredRow.first.successes, measuredRow.first.episodes)}${
          measuredRow.second
            ? ` on the usual layouts, ${formatCount(measuredRow.second.successes, measuredRow.second.episodes)} on a second set of layouts`
            : ""
        }.`
      : ` Measured, ${sweep.label.charAt(0).toLowerCase()}${sweep.label.slice(1)}: not evaluated with ${plural(steps, "flow step", "flow steps")}.`;

  const planeLabel =
    `${DRAWS.toLocaleString("en-US")} points of two-dimensional noise carried toward two targets, ` +
    `a1 at (${signed(TARGETS[0][0])}, ${TARGETS[0][1]}) and a2 at (${signed(TARGETS[1][0])}, ${TARGETS[1][1]}), by ${fieldWords} ` +
    `in ${plural(last, "flow step", "flow steps")}. After all of them ${toyResult} (first coordinate within ±${MIDDLE}). ` +
    `The traced draw starts at (${TRACED_START[0]}, ${TRACED_START[1]}) and ends at (${coordinate(end[0])}, ${coordinate(end[1])}). ` +
    `Shown: ${done === last ? "the end of the flow" : `after ${plural(done, "flow step", "flow steps")} of ${last}`}.`;

  const width = measured || 560;

  const resetAll = () => {
    setKind("exact");
    setSweepName(DEFAULT_SWEEP);
    chooseSteps(FIRST_STEPS);
  };
  const latency = latencyNote(sweep);

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      status={`${nowWords}${endWords}${hedgeWords}${measuredWords}`}
      note={
        <>
          Computed in the browser: {DRAWS.toLocaleString("en-US")} draws of standard normal noise ({SHOWN} drawn) carried
          to two point targets by the exact conditional-expectation field, through the repository&rsquo;s sampler ({LEVELS}{" "}
          noise levels, step size {LEVELS} divided by the flow steps). The traced draw is the chapter&rsquo;s; the other
          draws are not the chapter script&rsquo;s, so the shares differ from its table by a point or so. Hedging divides
          the exponent of the mixture weights by {HEDGE}: the field then commits to a target later, so with few flow steps
          the draws stay between the targets, and with enough of them they still reach one. Measured: closed-loop success
          of the policy chosen in the panel{sweep?.machine ? `, on ${sweep.machine}` : ""}.{latency ? ` ${latency}` : ""}
        </>
      }
    >
      <div className="@container">
        <div className="grid items-start gap-4 @min-[760px]:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
          <div className="min-w-0">
            <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-13 leading-[1.0625rem] font-medium text-ink-muted stretch-80">
              <li className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" aria-hidden="true">
                  <circle cx="6" cy="6" r="2.5" fill="var(--action)" />
                </svg>
                a draw, and the path it took
              </li>
              <li className="inline-flex items-center gap-1.5">
                <svg width="20" height="12" aria-hidden="true">
                  <path d="M1 10L8 4L19 6" fill="none" stroke="var(--text)" strokeWidth="1.5" />
                  <circle cx="8" cy="4" r="2" fill="var(--text)" />
                  <circle cx="19" cy="6" r="4" fill="var(--mark)" stroke="var(--text)" />
                </svg>
                one draw traced; each corner is a flow step
              </li>
              <li className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--text)" strokeWidth="1.5" />
                  <circle cx="7" cy="7" r="1.5" fill="var(--text)" />
                </svg>
                guess: where its current step aims
              </li>
              <li className="inline-flex items-center gap-1.5">
                <svg width="16" height="12" aria-hidden="true">
                  <path d="M2 6H12M9 3L12 6L9 9" fill="none" stroke="var(--text-faint)" strokeWidth="1" />
                </svg>
                field: which way a draw moves
              </li>
            </ul>
            <div ref={planeBox} className="@container">
              <Plane flow={result} progress={shown} traced={traced} width={width} label={planeLabel} />
            </div>
            {/* The toy's controls sit right under the plane, so on a phone the plane is on screen when they are used. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Segmented
                label="Flow steps"
                showLabel
                options={STEP_OPTIONS.map((count) => ({ value: String(count), label: String(count) }))}
                value={String(steps)}
                onChange={(value) => chooseSteps(Number(value))}
              />
              <Segmented label="Field" showLabel options={FIELDS} value={kind} onChange={chooseKind} />
              <PlayButton playing={playing} ended={ended} onToggle={togglePlay} className="motion-reduce:hidden" />
              <Stepper
                label="flow step"
                value={done}
                max={last}
                onChange={(next) => stepTo(next > done ? Math.floor(shown) + 1 : Math.ceil(shown) - 1)}
              />
              <ControlButton onClick={resetAll}>Reset</ControlButton>
            </div>
          </div>
          <Measured sweep={sweep} steps={steps} onSelect={chooseSteps} onSweep={setSweepName} />
        </div>
      </div>
    </FigureFrame>
  );
}
