"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { loadTrace, type Trace, type TraceInfo } from "@/data/files";
import { OBJECT_IDS, OBJECTS } from "@/data/labels";
import type { ObjectId } from "@/data/types";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  OBJECT_SERIES,
  PlayButton,
  Segmented,
  Stepper,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { readToken, subscribeToTheme } from "@/lib/theme";
import {
  actorWords,
  allRollouts,
  closeSteps,
  conditionWords,
  describe,
  momentsOf,
  moveShownAt,
  moveShownAtInfo,
  policyDetails,
  presets,
  readoutAt,
  reportedFor,
  reportedWords,
  secondsAt,
  type PresetId,
} from "./model";
import { RolloutPicker } from "./RolloutPicker";
// Types only: three.js and the scene are loaded when the figure comes into view.
import type { Palette, ReplayScene, ViewName } from "./scene";
import { Timeline } from "./Timeline";
import "./arm-replay.css";

const info = FIGURES["arm-replay"];

type Speed = "1" | "0.5" | "0.25";
const SPEEDS: { value: Speed; label: string }[] = [
  { value: "1", label: "1×" },
  { value: "0.5", label: "½×" },
  { value: "0.25", label: "¼×" },
];

const VIEWS: { value: ViewName; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "plan", label: "From above" },
  { value: "side", label: "Side" },
];

/** A turn of the view per arrow key, in radians. */
const TURN = Math.PI / 18;

/** The theme's colours, resolved for WebGL. */
function readPalette(): Palette {
  const objects = {} as Record<ObjectId, string>;
  for (const id of OBJECT_IDS) {
    const colour = OBJECT_SERIES[OBJECTS[id].series].color;
    const variable = /var\((--[^)]+)\)/.exec(colour)?.[1];
    objects[id] = variable ? readToken(variable) : colour;
  }
  return {
    surface: readToken("--surface"),
    bg: readToken("--bg"),
    surface2: readToken("--surface-2"),
    grid: readToken("--grid"),
    border: readToken("--border"),
    borderStrong: readToken("--border-strong"),
    text: readToken("--text"),
    textMuted: readToken("--text-muted"),
    textFaint: readToken("--text-faint"),
    objects,
  };
}

type Loaded = { status: "loading" } | { status: "ready"; data: Trace } | { status: "error" };

/**
 * One rollout's file, fetched in the browser; stays "loading" while `id` is
 * undefined. A failed request is not kept by the loader, so a new `attempt`
 * asks again.
 */
function useRollout(id: string | undefined, attempt: number): Loaded {
  const [answer, setAnswer] = useState<{ key: string; result: Loaded }>();
  const key = `${id}#${attempt}`;
  useEffect(() => {
    if (id === undefined) return;
    let current = true;
    loadTrace(id).then(
      (data) => {
        if (current) setAnswer({ key, result: { status: "ready", data } });
      },
      () => {
        if (current) setAnswer({ key, result: { status: "error" } });
      },
    );
    return () => {
      current = false;
    };
  }, [id, key]);
  return answer !== undefined && answer.key === key ? answer.result : LOADING;
}

const LOADING: Loaded = { status: "loading" };

export default function ArmReplayFigure({ caption }: FigureProps) {
  const list = useMemo(() => allRollouts(), []);
  const starts = useMemo(() => presets(list), [list]);
  const [traceId, setTraceId] = useState<string | undefined>(() => starts[0]?.trace.id ?? list[0]?.id);
  const selected: TraceInfo | undefined = list.find((entry) => entry.id === traceId);

  // The finished state first: the whole path, every mark. Playing starts from step 0.
  const [step, setStep] = useState(() => Math.max(0, (selected?.steps ?? 1) - 1));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("1");
  const [view, setView] = useState<ViewName | "turned">("front");
  const [scene, setScene] = useState<ReplayScene | null>(null);
  const [failed, setFailed] = useState(false);

  const [attempt, setAttempt] = useState(0);

  const root = useRef<HTMLDivElement>(null);
  const viewBox = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const time = useRef(step);
  const autoplayed = useRef(false);
  const descriptionId = useId();

  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  // three.js and the rollout are fetched a little before the figure reaches the screen, never earlier.
  const near = useInView(viewBox, { margin: "300px 0px", once: true });
  // Playing pauses only when the whole figure has left the screen, not the 3D view alone: while the
  // timeline or the readout shows, time runs.
  const onScreen = useInView(root, { amount: 0.05 });
  const arrived = useInView(viewBox, { amount: 0.6 });
  const size = useElementSize(host);

  const loaded = useRollout(near ? traceId : undefined, attempt);
  const trace = loaded.status === "ready" ? loaded.data : null;
  const loadFailed = loaded.status === "error";
  const steps = trace?.steps ?? selected?.steps ?? 1;
  const last = Math.max(0, steps - 1);
  const shownStep = Math.min(step, last);

  // ---------------------------------------------------------------- the scene

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let instance: ReplayScene | null = null;
    import("./scene").then(
      (module) => {
        if (cancelled || !host.current || !overlay.current) return;
        try {
          instance = new module.ReplayScene(host.current, overlay.current, () => setView("turned"));
          setScene(instance);
        } catch {
          setFailed(true);
        }
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
      instance?.dispose();
    };
  }, [near]);

  useEffect(() => {
    if (!scene) return;
    const apply = () => scene.setPalette(readPalette());
    apply();
    return subscribeToTheme(apply);
  }, [scene]);

  useEffect(() => {
    scene?.setSize(size.width, size.height);
  }, [scene, size.width, size.height]);

  useEffect(() => {
    if (!scene) return;
    scene.setTrace(trace);
  }, [scene, trace]);

  useEffect(() => {
    if (scene && view !== "turned") scene.setView(view);
  }, [scene, view]);

  // ---------------------------------------------------------------- time

  const running = playing && onScreen && pageVisible && !reducedMotion && trace !== null && scene !== null;

  // Paused, the drawing shows the whole step the controls name.
  useEffect(() => {
    if (running || !scene) return;
    time.current = shownStep;
    scene.setTime(shownStep);
  }, [running, scene, shownStep, trace]);

  // Playing, the arm moves in simulated time: 20 control steps a second at 1x.
  useEffect(() => {
    if (!running || !trace || !scene) return;
    const end = trace.steps - 1;
    const rate = trace.hz * Number(speed);
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(0.1, (now - previous) / 1000);
      previous = now;
      time.current = Math.min(end, time.current + elapsed * rate);
      scene.setTime(time.current);
      const whole = Math.floor(time.current);
      setStep((current) => (current === whole ? current : whole));
      if (time.current >= end) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, trace, scene, speed]);

  // Autoplay once, when the view has been well on screen for a moment; never under reduced motion.
  useEffect(() => {
    if (autoplayed.current || !arrived || reducedMotion || !trace || !scene) return;
    const timer = setTimeout(() => {
      autoplayed.current = true;
      time.current = 0;
      setStep(0);
      setPlaying(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [arrived, reducedMotion, trace, scene]);

  // ---------------------------------------------------------------- actions

  const goTo = (next: number) => {
    autoplayed.current = true;
    setPlaying(false);
    time.current = next;
    setStep(next);
  };

  const togglePlay = () => {
    autoplayed.current = true;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (shownStep >= last) {
      time.current = 0;
      setStep(0);
    }
    setPlaying(true);
  };

  const choose = useCallback(
    (id: string) => {
      const next = list.find((entry) => entry.id === id);
      if (!next) return;
      autoplayed.current = true;
      setTraceId(id);
      // With motion, a new rollout plays from its start; without, it shows its finished state.
      const start = reducedMotion ? Math.max(0, next.steps - 1) : 0;
      time.current = start;
      setStep(start);
      setPlaying(!reducedMotion);
    },
    [list, reducedMotion],
  );

  /** Turns the view by hand: the arrow keys on the view, or the buttons in the control bar. */
  const turnView = (yaw: number, pitch: number) => {
    if (!scene) return;
    scene.turn(yaw, pitch);
    setView("turned");
  };

  const onViewKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!scene) return;
    const turns: Record<string, [number, number]> = {
      ArrowLeft: [-TURN, 0],
      ArrowRight: [TURN, 0],
      ArrowUp: [0, TURN / 2],
      ArrowDown: [0, -TURN / 2],
    };
    const turn = turns[event.key];
    if (!turn) return;
    event.preventDefault();
    scene.turn(turn[0], turn[1]);
    setView("turned");
  };

  // ---------------------------------------------------------------- words

  // What does not change with the step is built once per rollout: the figure re-renders at every step while it plays.
  const description = useMemo(() => (selected ? describe(selected, trace) : ""), [selected, trace]);
  const presetValue = (starts.find((entry) => entry.trace.id === selected?.id)?.id ?? "none") as PresetId | "none";
  const chooser = useMemo(
    () =>
      selected ? (
        <div className="ar-choose">
          {starts.length > 1 ? (
            <Segmented<PresetId | "none">
              label="Rollout"
              showLabel
              options={starts.map((entry) => ({ value: entry.id, label: entry.label }))}
              value={presetValue}
              onChange={(next) => {
                const entry = starts.find((candidate) => candidate.id === next);
                if (entry) choose(entry.trace.id);
              }}
            />
          ) : null}
          <details className="ar-more">
            <summary>Every published rollout ({list.length})</summary>
            <RolloutPicker list={list} value={selected} onChange={choose} />
          </details>
        </div>
      ) : null,
    [starts, presetValue, list, selected, choose],
  );

  if (!selected) {
    return (
      <FigureFrame title={info.title} stamp={info.stamp} caption={caption}>
        <p className="ar-empty">No rollout is published yet.</p>
      </FigureFrame>
    );
  }

  const object = OBJECTS[selected.target];
  const closes = trace ? closeSteps(trace) : [];
  const moments = trace ? momentsOf(trace) : [];
  const momentIndex = Math.max(
    0,
    moments.reduce((found, moment, index) => (moment.step <= shownStep ? index : found), 0),
  );
  const atMoment = moments.find((moment) => moment.step === shownStep);
  const readout = trace ? readoutAt(trace, shownStep) : null;
  const reported = reportedFor(selected);
  const movedAt = trace ? moveShownAt(trace) : moveShownAtInfo(selected);
  const timeText = trace ? secondsAt(trace, shownStep) : null;

  const status = failed
    ? "The 3D view cannot be drawn in this browser; the description under the figure says what it shows."
    : loadFailed
      ? "This rollout could not be loaded."
      : !trace
      ? near
        ? "Loading the rollout."
        : "The rollout loads when the figure is in view."
      : running
        ? `Playing: ${actorWords(selected.actor).toLowerCase()}, ${conditionWords(selected).toLowerCase()}.`
        : `Step ${shownStep} of ${last}${timeText ? `, ${timeText}` : ""}${atMoment ? ` (${atMoment.label.toLowerCase()})` : ""}: gripper ${readout?.gripper}, ${readout?.distance} from the ${object.label}.`;

  const stepper = reducedMotion ? (
    <Stepper
      label="moment"
      value={momentIndex}
      max={Math.max(0, moments.length - 1)}
      format={(value) => moments[value]?.label ?? "Moment"}
      onChange={(index) => goTo(moments[index]?.step ?? 0)}
    />
  ) : (
    <Stepper label="step" value={shownStep} max={last} format={(value) => `Step ${value}`} onChange={goTo} />
  );

  const legend = [
    { key: "done", label: "Gripper path so far", swatch: <line x1={1} x2={21} y1={6} y2={6} className="ar-key-done" /> },
    { key: "ahead", label: "Path still to come", swatch: <line x1={1} x2={21} y1={6} y2={6} className="ar-key-ahead" /> },
    { key: "close", label: "Gripper told to close", swatch: <circle cx={11} cy={6} r={4} className="ar-key-close" /> },
    ...(selected.moved
      ? [{ key: "ghost", label: "Where the object was", swatch: <rect x={5} y={1.5} width={12} height={9} className="ar-key-ghost" /> }]
      : []),
  ];

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      status={status}
      note={
        <>
          One recorded rollout of the evaluation, drawn from its seven joint angles with the published link lengths of the
          Franka Panda; the objects are simple solids of their shapes. Grid: 10 cm. Distances are horizontal, from
          the point between the fingertips to the object&apos;s centre, read from the rollout (positions rounded to the
          millimetre). Drag, or focus the view and use the arrow keys, to turn it.
        </>
      }
      controls={
        <>
          <PlayButton playing={playing} ended={shownStep >= last} onToggle={togglePlay} className="motion-reduce:hidden" />
          {stepper}
          <Segmented
            label="Speed"
            showLabel
            options={SPEEDS}
            value={speed}
            onChange={setSpeed}
            className="motion-reduce:hidden"
          />
          <Segmented<ViewName | "turned">
            label="View"
            showLabel
            options={VIEWS}
            value={view}
            onChange={(next) => setView(next)}
          />
          {/* Buttons as well as drag and arrow keys: a screen reader in browse mode keeps the arrow keys for itself. */}
          <div role="group" aria-label="Turn the 3D view" className="fig-field">
            <span className="fig-label" aria-hidden="true">
              Turn
            </span>
            <ControlButton aria-label="Turn the view left" disabled={!scene} onClick={() => turnView(-TURN, 0)}>
              <Glyph name="arrow-left" size={14} />
            </ControlButton>
            <ControlButton aria-label="Turn the view right" disabled={!scene} onClick={() => turnView(TURN, 0)}>
              <Glyph name="arrow-right" size={14} />
            </ControlButton>
            <ControlButton aria-label="Tilt the view up" disabled={!scene} onClick={() => turnView(0, TURN / 2)}>
              Up
            </ControlButton>
            <ControlButton aria-label="Tilt the view down" disabled={!scene} onClick={() => turnView(0, -TURN / 2)}>
              Down
            </ControlButton>
          </div>
        </>
      }
    >
      <div ref={root} className="ar-root">
        {chooser}

        <div className="ar-about">
          <p className="ar-who">
            <b>{actorWords(selected.actor)}</b>
            {selected.run !== "expert" ? <span className="ar-detail"> · {policyDetails(selected)}</span> : null}
          </p>
          <p>
            {conditionWords(selected)}. Layout {selected.episode + 1}, instruction{" "}
            <q className="ar-instruction">pick up the {object.label}</q>.
          </p>
          <p className="ar-outcome">
            <span className={selected.success ? "ar-badge ar-badge-success" : "ar-badge ar-badge-failure"}>
              <Glyph name={selected.success ? "check" : "cross"} />
              {selected.success ? "Lifted" : "Not lifted"}
            </span>
            <span>
              {reported
                ? `${selected.run === "expert" ? "The same expert" : "The same policy"} under the same conditions, in the notebook: ${reportedWords(reported)}.`
                : "The notebook reports no evaluation under these conditions: this rollout stands alone."}
            </span>
          </p>
        </div>

        <div
          ref={viewBox}
          className="ar-view"
          tabIndex={0}
          role="group"
          aria-roledescription="3D view"
          aria-label={`3D replay of the rollout. Drag, use the arrow keys, or the Turn buttons under the figure, to turn the view.`}
          aria-describedby={descriptionId}
          onKeyDown={onViewKey}
        >
          <div ref={host} className="ar-host" />
          <div ref={overlay} className="ar-overlay" aria-hidden="true" />
          {!scene || !trace || failed ? (
            <div className="ar-placeholder">
              <p>
                {failed
                  ? "The 3D view needs WebGL, which this browser does not offer. What it would show:"
                  : loadFailed
                    ? "The rollout could not be loaded. What the index says of it:"
                    : near
                      ? "Loading the replay."
                      : "The replay loads when the figure is in view."}
              </p>
              {failed || loadFailed ? <p className="ar-placeholder-text">{description}</p> : null}
              {loadFailed && !failed ? (
                <p>
                  <ControlButton onClick={() => setAttempt((count) => count + 1)}>Try again</ControlButton>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <p id={descriptionId} className="sr-only">
          {description}
        </p>

        <ul className="fig-legend ar-legend" aria-label="Key">
          {legend.map((item) => (
            <li key={item.key}>
              <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" focusable="false">
                {item.swatch}
              </svg>
              {item.label}
            </li>
          ))}
        </ul>

        <dl className="ar-readout">
          <div>
            <dt>Step</dt>
            <dd>
              {shownStep}
              {timeText ? <span className="ar-unit"> · {timeText}</span> : null}
            </dd>
          </div>
          <div>
            <dt>Gripper</dt>
            <dd>{readout?.gripper ?? "-"}</dd>
          </div>
          <div>
            <dt>To the {object.short.toLowerCase()}</dt>
            <dd>{readout?.distance ?? "-"}</dd>
          </div>
          <div>
            <dt>Height</dt>
            <dd>{readout?.height ?? "-"}</dd>
          </div>
        </dl>

        <Timeline
          steps={steps}
          step={shownStep}
          grip={trace?.grip ?? null}
          closes={closes}
          moved={movedAt}
          onChange={goTo}
          valueText={`Step ${shownStep}${timeText ? `, ${timeText}` : ""}${atMoment ? `, ${atMoment.label.toLowerCase()}` : ""}`}
        />
        <div className="ar-timeline-key" aria-hidden="true">
          <span>Finger opening by control step</span>
          <span>
            <span className="ar-key-dot" /> told to close
            {selected.moved ? (
              <>
                {" "}
                <span className="ar-key-tri" /> object moved
              </>
            ) : null}
          </span>
        </div>

        {moments.length ? (
          <div className="ar-jumps" role="group" aria-label="Jump to a moment">
            <span className="fig-label">Jump to</span>
            {moments.map((moment) => (
              <ControlButton
                key={moment.step}
                onClick={() => goTo(moment.step)}
                aria-current={moment.step === shownStep ? "step" : undefined}
                className="ar-jump"
              >
                {moment.label}
                <span className="ar-unit"> {moment.step}</span>
              </ControlButton>
            ))}
          </div>
        ) : null}
      </div>
    </FigureFrame>
  );
}
