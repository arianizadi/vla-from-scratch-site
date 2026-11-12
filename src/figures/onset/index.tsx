"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatPercent, formatSamples, formatSlope } from "@/data/format";
import { POSITION_FIX, WEIGHTS, WEIGHT_IDS } from "@/data/labels";
import { setup } from "@/data/notebook";
import type { PositionFix, Weights } from "@/data/types";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  SERIES,
  Segmented,
  Slider,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { Chart, DIRECT_LABELS_MAX, type DrawnRun } from "./Chart";
import { DataTable } from "./DataTable";
import {
  GROUPS,
  SLOPE_MARK,
  SUCCESS_MARK,
  leadOf,
  revealedRows,
  rowsWith,
  standAt,
  type Lead,
  type OnsetGroup,
  type OnsetRun,
  type Stop,
} from "./model";
import { Readout, whereText } from "./Readout";
import { RunPicker } from "./RunPicker";
import "./onset.css";

const info = FIGURES.onset;

/** Time for the cursor to cross the whole training axis while playing (simulated time, linear). */
const PLAY_MS = 8000;

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The runs a group opens with: its first runs that have a line to draw with
 * the group's default weights, as many as can carry a label at the line end.
 * Lone points and runs without those weights start off.
 */
function initialSlots(group: OnsetGroup): Record<string, number> {
  const open = group.runs
    .filter((run) => run.rows.length > 1 && run.has[group.defaultWeights])
    .slice(0, Math.min(DIRECT_LABELS_MAX, SERIES.length));
  return Object.fromEntries(open.map((run, index) => [run.name, index]));
}

/** The lead in words: where the slope reached its mark, and where success did, or that it has not. */
function leadSentence(lead: Lead, weights: Weights, cursor: number): string {
  const slope = `${lead.run.label}: the slope first reached ${SLOPE_MARK} at ${formatSamples(lead.slope.samples)}`;
  if (lead.success) return `${slope}, success first reached ${formatPercent(SUCCESS_MARK)} at ${formatSamples(lead.success.samples)}.`;
  const shown = revealedRows(lead.run, weights, cursor).at(-1);
  const ended = shown !== undefined && shown === rowsWith(lead.run, weights).at(-1);
  return `${slope}; success ${ended ? "never reached" : "has not reached"} ${formatPercent(SUCCESS_MARK)}${
    shown ? ` ${ended ? "up to its last checkpoint" : "by"} ${formatSamples(shown.samples)}` : ""
  }.`;
}

/** Index of the last stop at or before `samples`; -1 before the first. */
function stopIndexAt(group: OnsetGroup, samples: number): number {
  let found = -1;
  group.stops.forEach((stop, index) => {
    if (stop.samples <= samples + 1) found = index;
  });
  return found;
}

function runSentence(run: OnsetRun, weights: Weights, cursor: number, stop: Stop, xMax: number): string {
  const at = standAt(run, weights, cursor, stop);
  const where = whereText(run, at, stop, xMax);
  if (!at) return `${run.label}: ${where}`;
  const { evaluation } = at;
  const values = `slope ${formatSlope(evaluation.slope)}, ${formatPercent(evaluation.named)} closed at the named object, success ${formatPercent(evaluation.rate)}`;
  return `${run.label}: ${values}${where ? ` (${where})` : ""}`;
}

export default function OnsetFigure({ caption }: FigureProps) {
  const [fix, setFix] = useState<PositionFix>(GROUPS[0]?.fix ?? "before");
  const group = GROUPS.find((entry) => entry.fix === fix) ?? GROUPS[0];

  const [weights, setWeights] = useState<Weights>(group?.defaultWeights ?? "ema");
  const [slots, setSlots] = useState<Record<string, number>>(() => (group ? initialSlots(group) : {}));
  const [cursor, setCursor] = useState(() => group?.xMax ?? 0);
  const cursorRef = useRef(cursor);
  const [playing, setPlaying] = useState(false);
  // "Replay" only once the reader has played it: the figure opens on its finished state.
  const [played, setPlayed] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(plot);
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const end = group?.stops.at(-1)?.samples ?? 0;
  const running = playing && onScreen && pageVisible && !reducedMotion;

  const moveCursor = (samples: number) => {
    cursorRef.current = samples;
    setCursor(samples);
  };

  // While playing, the cursor crosses the training axis at a constant rate and stops at the last checkpoint.
  useEffect(() => {
    if (!running || end <= 0) return;
    const rate = end / PLAY_MS;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last !== null) {
        const next = Math.min(end, cursorRef.current + (now - last) * rate);
        cursorRef.current = next;
        setCursor(next);
        if (next >= end) {
          setPlaying(false);
          return;
        }
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, end]);

  const drawn: DrawnRun[] = useMemo(
    () =>
      (group?.runs ?? [])
        .filter((run) => slots[run.name] !== undefined && run.has[weights])
        .map((run) => ({ run, slot: slots[run.name] })),
    [group, slots, weights],
  );
  const lead = useMemo(() => leadOf(drawn.map(({ run }) => run), weights, cursor), [drawn, weights, cursor]);

  if (!group) {
    return (
      <FigureFrame title={info.title} stamp={info.stamp} caption={caption}>
        <p className="onset-empty">No run on the named-object task is in the data yet.</p>
      </FigureFrame>
    );
  }

  const stopIndex = stopIndexAt(group, cursor);
  const stop: Stop | undefined = group.stops[Math.max(0, stopIndex)];
  const full = Object.keys(slots).length >= SERIES.length;
  const atEnd = cursor >= end;

  const selectGroup = (next: PositionFix) => {
    const target = GROUPS.find((entry) => entry.fix === next);
    if (!target) return;
    setFix(next);
    setWeights(target.defaultWeights);
    setSlots(initialSlots(target));
    setPlaying(false);
    setPlayed(false);
    moveCursor(target.xMax);
  };

  const toggleRun = (run: OnsetRun, on: boolean) => {
    setSlots((previous) => {
      const next = { ...previous };
      if (!on) {
        delete next[run.name];
        return next;
      }
      const used = new Set(Object.values(previous));
      const free = SERIES.findIndex((_, index) => !used.has(index));
      if (free < 0) return previous;
      next[run.name] = free;
      return next;
    });
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      // Settle on the checkpoint the cursor has reached, so the lines and the readout agree.
      moveCursor(stopIndex >= 0 ? group.stops[stopIndex].samples : 0);
      return;
    }
    if (atEnd) moveCursor(0);
    setPlayed(true);
    setPlaying(true);
  };

  const weightsWords = WEIGHTS[weights].label;
  const missingWeights = group.runs.filter((run) => slots[run.name] !== undefined && !run.has[weights]);
  const pendingCount = group.pending.length;

  let status: string;
  // Read out to screen readers with the status; the readout table shows the same values to the eye.
  let statusDetail = "";
  if (drawn.length === 0) {
    status =
      group.runs.length === 0
        ? `No run of this group has finished yet; ${pendingCount} in progress.`
        : missingWeights.length > 0
          ? `None of the selected runs reports ${weightsWords}. Choose the other weights or another run.`
          : "No run is selected. Select a run to draw it.";
  } else if (running) {
    status = `Playing: the lines are drawn as training goes on, up to ${formatSamples(end)} samples.`;
  } else if (stop) {
    status = `At ${stop.label} samples, ${weightsWords}.`;
    // The lead is shown under the chart; screen readers hear it with the status.
    statusDetail = `${lead ? `${leadSentence(lead, weights, cursor)} ` : ""}${drawn.map(({ run }) => runSentence(run, weights, cursor, stop, group.xMax)).join("; ")}.`;
  } else {
    status = "";
  }

  const drawnUpTo = stop && !atEnd ? ` Each run is drawn up to its last checkpoint at or before ${stop.label} samples.` : "";
  const chartLabel =
    drawn.length === 0
      ? `Three empty panels against training samples: no run is drawn. ${status}`
      : `Three panels against training samples, ${group.label.toLowerCase()}, ${weightsWords}: the slope of where the gripper closed against where the named object was, the share of episodes that closed at the named object (chance ${formatPercent(setup.chance.percent / 100)}), and success.${drawnUpTo} ` +
        (stop ? `${drawn.map(({ run }) => runSentence(run, weights, cursor, stop, group.xMax)).join("; ")}.` : "") +
        (lead ? ` ${leadSentence(lead, weights, cursor)}` : "") +
        " The table under the chart gives every value.";

  const groupSwitch = (
    <Segmented
      label="Position table"
      options={GROUPS.map((entry) => ({ value: entry.fix, label: capital(POSITION_FIX[entry.fix].short) }))}
      value={fix}
      onChange={selectGroup}
    />
  );

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      status={
        <>
          {status}
          {statusDetail ? <span className="sr-only"> {statusDetail}</span> : null}
        </>
      }
      note={
        <>
          Each point is one closed-loop evaluation of a saved checkpoint on layouts the policy never saw, one
          training seed per run. The slope is the least-squares slope of where the gripper first closed against
          where the named object was: 1 closes where the object is, 0 ignores the scene. Chance for the middle
          panel is {formatPercent(setup.chance.percent / 100)}. Each run is drawn up to its last checkpoint at or
          before the cursor; press or drag on the panels to move it (on a touch screen, slide sideways). Success at
          the cursor carries its 95% interval. The dotted leaders mark, for one drawn run, the first checkpoint whose
          slope reaches {SLOPE_MARK} and the first whose success reaches {formatPercent(SUCCESS_MARK)}: half of each
          scale, a threshold chosen for the drawing, not a measurement.
        </>
      }
      controls={
        <ControlButton aria-expanded={showTable} onClick={() => setShowTable((shown) => !shown)}>
          {showTable ? "Hide table" : "Show as table"}
        </ControlButton>
      }
    >
      <div ref={stage} className="onset-root">
        <div className="onset-toolbar">
          {groupSwitch}
          <Segmented
            label="Weights"
            showLabel
            options={WEIGHT_IDS.map((id) => ({ value: id, label: capital(WEIGHTS[id].short) }))}
            value={weights}
            onChange={setWeights}
          />
        </div>
        <div ref={plot} className="onset-plot">
          <Chart
            group={group}
            runs={drawn}
            weights={weights}
            cursor={cursor}
            stop={stopIndex >= 0 ? stop : undefined}
            lead={running ? undefined : lead}
            width={width}
            label={chartLabel}
            onScrub={(index) => {
              setPlaying(false);
              moveCursor(group.stops[index].samples);
            }}
          />
          {drawn.length === 0 ? (
            <p className="onset-empty onset-overlay">
              {group.runs.length === 0 ? "No run of this group has finished yet." : status}
            </p>
          ) : null}
        </div>
        <div className="onset-timeline">
          <PlayButton
            playing={running}
            ended={atEnd && played}
            onToggle={togglePlay}
            className="motion-reduce:hidden"
          />
          {group.stops.length > 1 ? (
            <Slider
              label="Training samples"
              min={0}
              max={group.stops.length - 1}
              value={Math.max(0, stopIndex)}
              onChange={(index) => {
                setPlaying(false);
                moveCursor(group.stops[index].samples);
              }}
              format={(index) => group.stops[index]?.label ?? ""}
              className="onset-slider"
            />
          ) : null}
        </div>
        {lead && !running ? (
          <p className="onset-lead" aria-hidden="true">
            <span className="onset-lead-key" />
            {leadSentence(lead, weights, cursor)}
          </p>
        ) : null}
        {stop && stopIndex >= 0 ? <Readout runs={drawn} xMax={group.xMax} weights={weights} cursor={cursor} stop={stop} /> : null}
        <RunPicker group={group} slots={slots} weights={weights} full={full} onToggle={toggleRun} />
        {full && group.runs.length > SERIES.length ? (
          <p className="onset-aside">
            {SERIES.length} runs at most are drawn at once; turn one off to draw another.
          </p>
        ) : null}
        {drawn.length > DIRECT_LABELS_MAX ? (
          <p className="onset-aside">
            With more than {DIRECT_LABELS_MAX} runs drawn the lines carry no labels: the list of runs above is the key.
          </p>
        ) : null}
        {showTable ? <DataTable runs={drawn} weights={weights} /> : null}
      </div>
    </FigureFrame>
  );
}
