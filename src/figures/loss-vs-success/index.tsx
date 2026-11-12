"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MACHINES } from "@/data/labels";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Slider,
  Stepper,
  Toggle,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { Chart } from "./Chart";
import { DataTable } from "./DataTable";
import {
  DEFAULT_RUN,
  RUN_GROUPS,
  briefStatus,
  formatLoss,
  formatPosition,
  nextCheckpointStop,
  noteText,
  previousCheckpointStop,
  runModel,
  statusText,
  stopAtOrBefore,
  type RunModel,
} from "./model";
import { MAGNIFY_MS, REPLAY_MS, axisBetween } from "./motion";
import { Readout } from "./Readout";
import { RunSelect } from "./RunSelect";

const info = FIGURES["loss-vs-success"];

export default function LossVsSuccessFigure({ caption }: FigureProps) {
  const first = DEFAULT_RUN ? runModel(DEFAULT_RUN) : undefined;
  if (!first) {
    return (
      <FigureFrame title={info.title} stamp={info.stamp} caption={caption}>
        <p className="m-0 text-14 text-ink-muted">
          No finished run has both a loss curve and an evaluated checkpoint yet.
        </p>
      </FigureFrame>
    );
  }
  return <LossVsSuccess caption={caption} initial={first} />;
}

function LossVsSuccess({ caption, initial }: FigureProps & { initial: RunModel }) {
  const [model, setModel] = useState(initial);
  const [at, setAt] = useState(initial.opening);
  // The loss axis opens magnified: at full scale the first logged point sets it, and everything after
  // the first tenth of the run lies on the zero line, flat because of the axis rather than the data.
  const [magnified, setMagnified] = useState(true);
  /**
   * The scrubber is where the figure put it (the opening, or a newly chosen run). Play then replays
   * training from the start: the opening is the rise, and playing on from it would skip it.
   */
  const [untouched, setUntouched] = useState(true);
  /** The status line in full, or brief while the reader drags or slides through the loss points. */
  const [brief, setBrief] = useState(false);
  /** The top of the loss axis while it is being stretched; null when it rests at its target. */
  const [tween, setTween] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stage);
  const onScreen = useInView(root, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const last = model.stops.length - 1;
  const target = magnified ? model.magnifiedMax : model.fullMax;
  const lossMax = tween ?? target;

  // ------------------------------------------------------------ replay
  // Simulated time: the scrubber crosses the run at a constant number of samples per second.
  // It runs only while the figure is on screen in a visible tab, and never under reduced motion.
  const running = playing && at < last && onScreen && pageVisible && !reducedMotion;
  const position = useRef(model.stops[at].samples);
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let previous: number | null = null;
    const tick = (now: number) => {
      if (previous !== null) {
        position.current = Math.min(model.xMax, position.current + ((now - previous) / REPLAY_MS) * model.xMax);
      }
      previous = now;
      const next = stopAtOrBefore(model.stops, position.current);
      setAt(next);
      if (next >= model.stops.length - 1) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, model]);

  // ------------------------------------------------------------ magnifying the loss axis
  const zoom = useRef(0);
  useEffect(() => () => cancelAnimationFrame(zoom.current), []);
  const magnify = (on: boolean) => {
    cancelAnimationFrame(zoom.current);
    setMagnified(on);
    const to = on ? model.magnifiedMax : model.fullMax;
    if (reducedMotion) {
      setTween(null);
      return;
    }
    const from = lossMax;
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / MAGNIFY_MS);
      if (progress >= 1) {
        setTween(null);
        return;
      }
      setTween(axisBetween(from, to, progress));
      zoom.current = requestAnimationFrame(step);
    };
    zoom.current = requestAnimationFrame(step);
  };

  // ------------------------------------------------------------ moving the scrubber
  const moveTo = (stop: number, short = false) => {
    setPlaying(false);
    setUntouched(false);
    setBrief(short);
    setAt(stop);
    position.current = model.stops[stop].samples;
  };
  const toggle = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    if (at >= last || untouched) moveTo(0);
    else position.current = model.stops[at].samples;
    setUntouched(false);
    setPlaying(true);
  };
  const choose = (name: string, magnifiedAfter = magnified) => {
    const next = runModel(name);
    if (!next) return;
    cancelAnimationFrame(zoom.current);
    setTween(null);
    setPlaying(false);
    setUntouched(true);
    setBrief(false);
    setModel(next);
    setMagnified(magnifiedAfter);
    setAt(next.opening);
    position.current = next.stops[next.opening].samples;
  };
  const reset = () => {
    choose(initial.run.name, true);
    setShowTable(false);
  };

  const width = measured || 640;
  const stop = model.stops[at];
  const checkpoints = model.rows.length;
  const machine = model.run.machine ? `, ${MACHINES[model.run.machine].name}` : "";

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      status={
        // While the replay runs, the announced line changes only when a checkpoint is reached.
        running
          ? `Replaying training: ${stop.reached === 0 ? "no checkpoint yet" : `checkpoint ${stop.reached} of ${checkpoints} reached`}.`
          : brief && stop.checkpoint === null
            ? briefStatus(model, at)
            : statusText(model, at)
      }
      note={noteText(model)}
      controls={
        <>
          <RunSelect groups={RUN_GROUPS} value={model.run.name} onChange={choose} />
          {/* At the opening, and at the end, the button offers to replay training from the start. */}
          <PlayButton playing={running} ended={at >= last || untouched} onToggle={toggle} className="motion-reduce:hidden" />
          <Stepper
            label="checkpoint"
            value={stop.reached}
            min={0}
            max={checkpoints}
            format={(value, max) => (value === 0 ? `Before checkpoint 1 of ${max}` : `Checkpoint ${value} of ${max}`)}
            onChange={(value) => {
              // Next goes to the next checkpoint; Previous to the one before the scrubber, or to the start.
              const next = value > stop.reached ? nextCheckpointStop(model, at) : (previousCheckpointStop(model, at) ?? 0);
              if (next !== null) moveTo(next);
            }}
          />
          <Slider
            label="Samples"
            min={0}
            max={last}
            value={at}
            onChange={(index) => moveTo(index, true)}
            format={(index) => `${formatPosition(model.stops[index].samples)}, loss ${formatLoss(model.stops[index].loss)}`}
          />
          <Toggle label="Magnify the loss axis" checked={magnified} onChange={magnify} />
          <ControlButton aria-expanded={showTable} aria-controls={tableId} onClick={() => setShowTable((shown) => !shown)}>
            {showTable ? "Hide table" : "Show as table"}
          </ControlButton>
          <ControlButton onClick={reset}>Reset</ControlButton>
        </>
      }
    >
      <div ref={root} className="@container">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <p className="m-0 min-w-0 max-w-[46ch] text-14 text-ink-muted">
            <span className="font-semibold text-ink">{model.label}</span>
            <br />
            {model.context}
            {machine}
          </p>
          <Readout model={model} at={at} />
        </div>
        <div ref={stage}>
          <Chart
            model={model}
            at={at}
            lossMax={lossMax}
            lossTarget={target}
            width={width}
            measured={measured > 0}
            onScrub={(stop) => moveTo(stop, true)}
          />
        </div>
        <div id={tableId} hidden={!showTable}>
          {showTable ? <DataTable model={model} at={at} /> : null}
        </div>
      </div>
    </FigureFrame>
  );
}
