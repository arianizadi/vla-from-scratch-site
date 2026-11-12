"use client";

import { useEffect, useRef, useState } from "react";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  MODALITY,
  PlayButton,
  Slider,
  Stepper,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { cutDash, layout, windowSteps } from "./geometry";
import { Measured } from "./Measured";
import {
  CHUNK,
  CONTROL_HZ,
  DEFAULT_EXECUTED,
  REACH_STEPS,
  measuredAt,
  measuredOn,
  scheduleSentence,
  seconds,
  stepSentence,
  timelineDescription,
} from "./model";
import { Timeline } from "./Timeline";

const info = FIGURES["action-chunks"];

/** The timeline plays four times slower than the robot moves. */
const SLOWDOWN = 4;
const TICK_MS = (1000 / CONTROL_HZ) * SLOWDOWN;
/**
 * Width the timeline is drawn at until its container is measured, and in the
 * static HTML: the narrow window, drawn at its own size (not scaled to the
 * container), so it reads at any width before the figure hydrates.
 */
const DEFAULT_WIDTH = 300;

/**
 * The key to the drawing: the kinds of cell and the mark of a camera reading.
 * `dash` is the pattern the discarded cells are drawn with; without one they
 * are drawn, and keyed, with a lighter outline.
 */
function Key({ dash }: { dash: string | undefined }) {
  return (
    <ul aria-label="Legend" className="fig-legend">
      <li>
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          <rect x={1} y={1} width={12} height={12} rx={1.5} fill={MODALITY.action} />
        </svg>
        Action executed
      </li>
      <li>
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          <rect x={1.75} y={1.75} width={10.5} height={10.5} rx={1.5} fill="var(--surface)" stroke={MODALITY.action} strokeWidth={1.5} />
        </svg>
        Queued, not yet executed
      </li>
      <li>
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          <rect
            x={1.5}
            y={1.5}
            width={11}
            height={11}
            rx={1.5}
            fill="var(--surface)"
            stroke={MODALITY.action}
            strokeOpacity={dash ? 1 : 0.55}
            strokeDasharray={dash}
          />
        </svg>
        Discarded, never executed
      </li>
      <li>
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          <line x1={7} x2={7} y1={0} y2={9} stroke={MODALITY.vision} />
          <circle cx={7} cy={9.5} r={4} fill={MODALITY.vision} />
        </svg>
        Cameras read, {CHUNK} actions planned
      </li>
    </ul>
  );
}

/**
 * Action chunks on a timeline of control steps: the policy plans a chunk of
 * actions, executes the first few, reads the cameras and plans again. The
 * slider sets how many are executed; beside the timeline (below the controls
 * when the figure is narrow) is the closed-loop success of the settings the
 * lab notebook reports.
 */
export default function ActionChunksFigure({ caption }: FigureProps) {
  const [executed, setExecuted] = useState(DEFAULT_EXECUTED);
  // Control steps done so far. Null: the timeline is shown whole, which is its state at rest.
  const [position, setPosition] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  // The setting was changed since the timeline last moved: the status then says what it scored.
  const [settingChanged, setSettingChanged] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const drawing = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(drawing);
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const width = measured || DEFAULT_WIDTH;
  const steps = windowSteps(width);
  const step = position === null ? steps : Math.min(position, steps);
  const whole = step >= steps;

  // The reader asked for it to play and the end is not reached. The timeline
  // then advances one control step at a time, but only while the figure is on
  // screen in a visible tab, and never under reduced motion.
  const active = playing && !whole;
  const running = active && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setPosition((current) => (current === null || current + 1 >= steps ? null : current + 1));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running, steps]);

  const moveTo = (next: number) => {
    setPlaying(false);
    setSettingChanged(false);
    setPosition(next >= steps ? null : Math.max(0, next));
  };

  const choose = (next: number) => {
    setExecuted(next);
    setSettingChanged(true);
  };

  const reset = () => {
    setPlaying(false);
    setPlayed(false);
    setSettingChanged(false);
    setPosition(null);
    setExecuted(DEFAULT_EXECUTED);
  };

  const toggle = () => {
    setSettingChanged(false);
    if (active) {
      setPlaying(false);
      return;
    }
    if (whole) setPosition(0);
    setPlayed(true);
    setPlaying(true);
  };

  const result = measuredAt(executed);
  const outcome = result
    ? `Measured: ${result.successes} of ${result.episodes} episodes succeeded.`
    : "This policy was not evaluated with this setting.";
  // While it plays the line stays as it is, so a screen reader is not told every step. Stopped part way, it
  // says where the timeline stands, and what the setting scored when that has just changed.
  const status =
    whole || active
      ? `${scheduleSentence(executed)} ${outcome}`
      : `Control step ${step} of ${steps}. ${stepSentence(executed, step)}${settingChanged ? ` ${outcome}` : ""}`;

  const provenance = measuredOn();
  const dash = cutDash(layout(width, executed, CHUNK));
  const reach = REACH_STEPS <= steps ? ` The scripted expert closes the gripper around step ${REACH_STEPS}.` : "";

  return (
    <FigureFrame
      // A size container, so that the control bar can tell which layout the stage has.
      className="@container/plate"
      title={info.title}
      stamp={info.stamp}
      // The drawing is itself a grid or a table: no graph paper behind it.
      grid={false}
      caption={caption}
      status={status}
      note={
        <>
          The timeline is the first {steps} control steps ({seconds(steps)}) of an episode, drawn to scale; it plays{" "}
          {SLOWDOWN} times slower than the robot moves.{reach} Drag across it, or use the step buttons, to move through
          it.{provenance ? ` ${provenance}` : ""}
        </>
      }
      controls={
        <>
          <PlayButton playing={active} ended={played && whole} onToggle={toggle} className="motion-reduce:hidden" />
          <Stepper label="step" value={step} max={steps} onChange={moveTo} />
          <Slider
            label="Executed per chunk"
            min={1}
            max={CHUNK}
            value={executed}
            onChange={choose}
            format={(value) => `${value} of ${CHUNK}`}
            // On a phone the label takes a line of its own, so the track gets the width of the bar.
            className="max-sm:max-w-none max-sm:basis-full max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:[&>label]:col-span-full"
          />
          <ControlButton onClick={reset}>Reset</ControlButton>
          {/*
            Narrow: the measured panel follows the controls (after the status line), so the slider stays next to the
            drawing it redraws. The plate's 808px is the stage's 760px: the plate has a 1px border, the stage 24px
            of padding a side.
          */}
          <div className="order-last w-full pt-1 @[808px]/plate:hidden">
            <Measured executed={executed} onSelect={choose} />
          </div>
        </>
      }
    >
      <div ref={stage} className="@container">
        <div className="grid items-start gap-4 @[760px]:grid-cols-[minmax(0,1fr)_340px] @[760px]:gap-6">
          <div className="@container min-w-0">
            <Key dash={dash} />
            {/* The height is reserved, so the page does not move when the drawing is measured. */}
            <div ref={drawing} className="mt-3 min-h-[278px] @[400px]:min-h-[310px]">
              <Timeline
                width={width}
                executed={executed}
                step={step}
                gliding={running && step > 0}
                tickMs={TICK_MS}
                description={timelineDescription(executed, steps)}
                onScrub={moveTo}
                fluid={measured > 0}
              />
            </div>
          </div>
          {/* Wide: the panel stands beside the timeline. Narrow, it is drawn after the controls instead. */}
          <div className="hidden @[760px]:block">
            <Measured executed={executed} onSelect={choose} />
          </div>
        </div>
      </div>
    </FigureFrame>
  );
}
