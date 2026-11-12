"use client";

import { useMemo, useRef, useState } from "react";
import { fixed, formatCount, formatPercent, formatSamples } from "@/data/format";
import { MACHINES, OBJECTS, WEIGHTS, instructionFor, policySeries } from "@/data/labels";
import { setup } from "@/data/notebook";
import { exportMachine } from "@/data/runs";
import { useTrace } from "@/data/use-public-data";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  Marker,
  POLICY_SERIES,
  REFERENCE,
  SERIES,
  Segmented,
  Slider,
  Stepper,
  useElementSize,
  type FigureProps,
  type SeriesStyle,
} from "@/figures/kit";
import { styles } from "./styles";
import {
  JOINTS,
  expertRollouts,
  jointMovedFirst,
  missSummary,
  probedHistoryRuns,
  relatedRuns,
  rolloutModel,
  slotProbes,
  type SlotProbe,
} from "./model";
import { firstQueryNote as noteLines, gripperSentence, slotWords, takeaway, trainingSlot } from "./notes";
import { ProbeRows } from "./ProbeRows";
import { RolloutChart } from "./RolloutChart";
import { ProbeTable, RolloutTable } from "./Tables";

const info = FIGURES.copycat;

// Read once from the data module: which runs were probed, which rollouts exist.
const HISTORY_RUNS = probedHistoryRuns();
const ROLLOUTS = expertRollouts();
const OBJECTS_ON_TABLE = setup.pickTarget.objectsOnTable;
const CHANCE = 1 / OBJECTS_ON_TABLE;
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];
const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const ordinal = (n: number) => ORDINALS[n - 1] ?? `number ${n}`;
const CHANCE_LABEL = `one in ${NUMBER_WORDS[OBJECTS_ON_TABLE] ?? OBJECTS_ON_TABLE}`;

const rad = (value: number) => fixed(value, 3);
const grip = (value: number) => (value >= 0.5 ? "open" : "closed");

function rolloutOptions() {
  const counts = new Map<string, number>();
  for (const entry of ROLLOUTS) counts.set(entry.target, (counts.get(entry.target) ?? 0) + 1);
  return ROLLOUTS.map((entry) => ({
    value: entry.id,
    label:
      (counts.get(entry.target) ?? 0) > 1
        ? `${OBJECTS[entry.target].short}, layout ${entry.episode + 1}`
        : OBJECTS[entry.target].short,
  }));
}
const ROLLOUT_OPTIONS = rolloutOptions();

/** The checkpoint the rows were measured on, when they share one. */
function checkpointPhrase(rows: SlotProbe[]): string | null {
  const first = rows[0]?.probe;
  if (!first) return null;
  const same = rows.every(
    (row) =>
      row.probe.checkpoint === first.checkpoint &&
      row.probe.weights === first.weights &&
      row.probe.episodes === first.episodes,
  );
  if (!same) return null;
  return `${WEIGHTS[first.weights].label} after ${formatSamples(first.samples)} samples, ${first.episodes} unseen layouts per row`;
}

export default function CopycatFigure({ caption }: FigureProps) {
  const [runName, setRunName] = useState(HISTORY_RUNS[0]?.name);
  const historyRun = HISTORY_RUNS.find((entry) => entry.name === runName) ?? HISTORY_RUNS[0];
  const rows = useMemo(() => (historyRun ? slotProbes(historyRun.name) : []), [historyRun]);
  const [variantChoice, setVariant] = useState<string | undefined>(undefined);
  const selected = rows.find((row) => row.probe.variant === variantChoice) ?? rows[0];
  const firstPrev = selected?.firstPrev ?? "hold";
  const prefix = selected?.prefix ?? 0;
  const slot = { firstPrev, prefix };
  // What the selected policy's slot held at the first frame in training: it depends on its demonstrations.
  const training = trainingSlot(historyRun?.design);

  const [traceId, setTraceId] = useState(ROLLOUTS[0]?.id);
  const traceInfo = ROLLOUTS.find((entry) => entry.id === traceId);
  const loaded = useTrace(traceId);
  const trace = loaded.status === "ready" ? loaded.data : null;
  const model = useMemo(() => (trace ? rolloutModel(trace, { firstPrev, prefix }) : null), [trace, firstPrev, prefix]);
  // The rollout as served, for the sentence above the chart: it does not change with the chosen row.
  const served = useMemo(() => (trace ? missSummary(rolloutModel(trace, { firstPrev: "hold", prefix: 0 })) : null), [trace]);

  const [jointChoice, setJoint] = useState<number | null>(null);
  const defaultJoint = trace ? jointMovedFirst(trace) : 0;
  const joint = jointChoice ?? defaultJoint;
  const [step, setStep] = useState(0);
  // "chart": the cursor follows the pointer or the chart's own arrow keys, and the chart's value text speaks;
  // the live status then stays still instead of announcing every step.
  const [source, setSource] = useState<"discrete" | "chart">("discrete");
  const [showTable, setShowTable] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(root);

  const steps = model?.rows.length ?? traceInfo?.steps ?? 0;
  const last = Math.max(0, steps - 1);
  const shownStep = Math.min(step, last);

  const moveTo = (next: number) => {
    setSource("discrete");
    setStep(next);
  };
  const follow = (next: number) => {
    setSource("chart");
    setStep(next);
  };
  const choose = (variant: string) => {
    const row = rows.find((entry) => entry.probe.variant === variant);
    setVariant(variant);
    setSource("discrete");
    // Go to the policy's first query under that condition: where the slot matters.
    if (row) setStep(Math.min(row.prefix, last));
  };
  const reset = () => {
    setVariant(undefined);
    setJoint(null);
    setStep(0);
    setSource("discrete");
    setShowTable(false);
    setTraceId(ROLLOUTS[0]?.id);
    setRunName(HISTORY_RUNS[0]?.name);
  };

  const width = measured || 640;
  const current = model?.rows[shownStep];
  const summary = model ? missSummary(model) : null;
  const firstQuery = model?.firstQuery ?? 0;
  const narrow = width < 480;

  const firstQueryNote =
    model && summary?.first
      ? noteLines({ slot, training, firstQuery, firstMiss: summary.first.miss, narrow, rad })
      : [];

  const stepTag = (index: number) =>
    model === null
      ? ""
      : index === firstQuery
        ? ", the policy's first query"
        : index < firstQuery
          ? ", the expert drives"
          : "";
  const stepRange = `steps 0-${last}`;
  const stepSentence = current
    ? `Step ${shownStep} (of ${stepRange})${stepTag(shownStep)}: joint ${joint + 1} target ${rad(current.action[joint])} rad, repeated ${rad(current.previous[joint])} rad; miss over seven joints ${rad(current.miss)} rad; gripper ${grip(current.action[JOINTS])}, repeated ${grip(current.previous[JOINTS])}.`
    : "";
  const rolloutName = traceInfo ? OBJECTS[traceInfo.target].short.toLowerCase() : "";
  const prefixLabel = selected ? `${selected.label}. ` : "";
  const status = current
    ? source === "chart"
      ? `${prefixLabel}Rollout of the ${rolloutName}, joint ${joint + 1}: the chart follows the pointer and its arrow keys.`
      : `${prefixLabel}${stepSentence}`
    : loaded.status === "error"
      ? "The rollout could not be loaded."
      : "Loading the rollout.";

  const instruction = traceInfo ? instructionFor(traceInfo.target) : "";
  const rolloutSub = traceInfo
    ? `“${instruction}” on the ${ordinal(traceInfo.episode + 1)} evaluation layout, ${traceInfo.steps} control steps (${stepRange}). The demonstrations are recordings of the same expert.`
    : "No rollout of the scripted expert is published.";
  const lead = served?.first
    ? takeaway({
        holdMiss: served.first.miss,
        laterMax: served.laterMax,
        laterMedian: served.median,
        training,
        rad,
      })
    : null;

  const seriesKey = historyRun ? policySeries(historyRun.design) : undefined;
  const series: SeriesStyle = seriesKey
    ? POLICY_SERIES[seriesKey]
    : { label: "Policy", color: SERIES[0], shape: "circle" };
  const checkpoint = checkpointPhrase(rows);
  const inputs = historyRun?.design.language === true ? ", the instruction as input" : "";
  const probeSub = historyRun
    ? `${historyRun.label}${inputs}${checkpoint ? `: ${checkpoint}` : ""}. Choosing a row sets what the slot holds in the rollout below.`
    : "";
  const related = historyRun ? relatedRuns(historyRun) : [];
  const echo =
    model && summary?.first && selected
      ? `${selected.label}, in the rollout below: at step ${summary.first.step} the slot holds ${slotWords(slot)}${
          slot.prefix === 0 ? (slot.firstPrev === training ? ", as in training" : ", not what it held in training") : ""
        }; the repeat misses the expert's command by ${rad(summary.first.miss)} rad over seven joints.`
      : null;

  const textAlternative = [
    model && summary?.first
      ? `In a rollout of the scripted expert (${instruction}, ${model.rows.length} control steps), repeating the previous action misses the next seven joint targets by a median ${rad(summary.median)} rad and at most ${rad(summary.laterMax)} rad after the first query. At the first query (step ${summary.first.step}) the slot holds ${slotWords(slot)} and the miss is ${rad(summary.first.miss)} rad. ${gripperSentence(model.gripChanges)}`
      : "",
    rows.length > 0
      ? `The policy with history, by condition: ${rows
          .map(
            (row) =>
              `${row.label.toLowerCase()}, ${formatCount(row.probe.successes, row.probe.episodes)} succeeded${
                row.probe.named === null ? "" : ` and ${formatPercent(row.probe.named)} closed at the named object`
              }`,
          )
          .join("; ")}. Chance is ${CHANCE_LABEL}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const machine = exportMachine ? MACHINES[exportMachine].label : null;
  const jointNote =
    trace && joint === defaultJoint
      ? `Joint ${joint + 1} (joints numbered from the base) is shown first: the expert's first command moves it furthest from the hold command.`
      : null;

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      status={status}
      takeaway={
        historyRun && rows.length > 0
          ? `${historyRun.label}: ${rows
              .map((row) => `${row.label.toLowerCase()} ${formatCount(row.probe.successes, row.probe.episodes)}`)
              .join("; ")}.`
          : undefined
      }
      note={
        <>
          Measured{machine ? ` on ${machine}` : ""}. The rollout is the scripted expert through the evaluation loop; its
          hold command is not recorded, so its joint targets are drawn from the joint angles at step 0, where the arm
          holds it, and the miss at step 0 as served is approximate. The miss over seven joints is the length of the
          difference of the seven joint targets.
          {rows.length > 0 ? " The probes come from one training seed; whiskers are Wilson 95% intervals." : ""}
        </>
      }
      controls={
        <>
          <ControlButton aria-pressed={showTable} onClick={() => setShowTable((shown) => !shown)}>
            {showTable ? "Hide tables" : "Show as tables"}
          </ControlButton>
          <ControlButton onClick={reset}>Reset</ControlButton>
        </>
      }
    >
      <div ref={root} className={styles.root}>
        <p className="sr-only">{textAlternative}</p>

        <section className={styles.part} aria-label="The policy with history under each condition">
          <h3 className={styles.heading}>What the policy with history does when its slot is filled</h3>
          {historyRun && selected ? (
            <>
              <p className={styles.sub}>{probeSub}</p>
              {HISTORY_RUNS.length > 1 ? (
                <div className={styles.controls}>
                  <Segmented
                    label="Policy"
                    showLabel
                    options={HISTORY_RUNS.map((entry) => ({
                      value: entry.name,
                      label: entry.label,
                    }))}
                    value={historyRun.name}
                    onChange={(name) => {
                      setRunName(name);
                      setVariant(undefined);
                      setSource("discrete");
                      setStep(0);
                    }}
                  />
                </div>
              ) : null}
              <ProbeRows
                rows={rows}
                selected={selected.probe.variant}
                onSelect={choose}
                series={series}
                chance={CHANCE}
                chanceLabel={CHANCE_LABEL}
                related={related}
                probedDesign={historyRun.design}
                label="Condition of the evaluation"
                echo={echo}
              />
              {showTable ? (
                <div className="mt-4">
                  <ProbeTable
                    rows={rows}
                    selected={selected.probe.variant}
                    title={`${historyRun.label}, by condition`}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <p className={styles.sub}>No probe of a policy with history is reported.</p>
          )}
        </section>
        <section className={styles.part} aria-label="The expert's actions and the previous action repeated">
          <h3 className={styles.heading}>The scripted expert, and its previous action repeated</h3>
          <p className={styles.sub}>{rolloutSub}</p>
          {lead ? <p className={styles.takeaway}>{lead}</p> : null}

          <div className={styles.controls}>
            {ROLLOUT_OPTIONS.length > 1 ? (
              <Segmented
                label="Rollout"
                showLabel
                options={ROLLOUT_OPTIONS}
                value={traceId ?? ""}
                onChange={(id) => {
                  setTraceId(id);
                  setJoint(null);
                  setSource("discrete");
                  setStep(Math.min(slot.prefix, last));
                }}
              />
            ) : null}
          </div>
          <div className={styles.controls}>
            <Stepper
              label="step"
              value={shownStep}
              max={last}
              onChange={moveTo}
              format={(value, max) => `Step ${value} (0-${max})`}
            />
            <Slider
              label="Joint"
              min={1}
              max={JOINTS}
              value={joint + 1}
              onChange={(value) => {
                setJoint(value - 1);
                setSource("discrete");
              }}
              format={(value) => `${value} of ${JOINTS}`}
            />
          </div>

          <ul aria-label="Legend" className={styles.legend}>
            <li>
              <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" focusable="false">
                <line x1={1} x2={21} y1={6} y2={6} stroke={REFERENCE.color} strokeWidth={2} strokeDasharray="4 3" />
                <Marker x={11} y={6} color={REFERENCE.color} hollow />
              </svg>
              Expert&rsquo;s command
            </li>
            <li>
              <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" focusable="false">
                <line x1={1} x2={21} y1={6} y2={6} stroke={SERIES[0]} strokeWidth={2} />
                <Marker x={11} y={6} color={SERIES[0]} />
              </svg>
              Previous action, repeated
            </li>
            {firstQuery > 0 ? (
              <li>
                <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" focusable="false">
                  <rect x={1.5} y={1.5} width={19} height={9} className="copycat-band-swatch" />
                </svg>
                Shaded: the expert drives
              </li>
            ) : null}
          </ul>
          <dl className={styles.readout} aria-hidden="true">
            <div>
              <dt>Control step</dt>
              <dd>
                {current ? shownStep : "-"}
                <span>{current ? ` (of ${stepRange})${stepTag(shownStep)}` : ""}</span>
              </dd>
            </div>
            <div>
              <dt>Joint {joint + 1} target (rad)</dt>
              <dd>
                {current ? rad(current.action[joint]) : "-"}
                <span> expert</span>
                <br />
                {current ? rad(current.previous[joint]) : "-"}
                <span> repeated</span>
              </dd>
            </div>
            <div>
              <dt>Miss, seven joints</dt>
              <dd>{current ? `${rad(current.miss)} rad` : "-"}</dd>
            </div>
            <div>
              <dt>Gripper</dt>
              <dd>
                {current ? grip(current.action[JOINTS]) : "-"}
                <span> expert</span>
                <br />
                {current ? grip(current.previous[JOINTS]) : "-"}
                <span> repeated</span>
              </dd>
            </div>
          </dl>
          <RolloutChart
            model={model}
            steps={steps}
            joint={joint}
            step={shownStep}
            onStep={follow}
            hz={trace?.hz ?? null}
            width={width}
            valueText={stepSentence || status}
            firstQueryNote={firstQueryNote}
            loadingText={
              loaded.status === "error" ? "The rollout could not be loaded." : model ? null : "Loading the rollout."
            }
          />
          <p className={styles.hint}>
            Point at the chart, or focus it and use the arrow keys, to move along the control steps.
            {jointNote ? ` ${jointNote}` : ""}
          </p>
          {showTable && model ? (
            <RolloutTable
              model={model}
              joint={joint}
              step={shownStep}
              title={`Every control step of the rollout: joint ${joint + 1}, the miss over seven joints, the gripper`}
            />
          ) : null}
        </section>

      </div>
    </FigureFrame>
  );
}
