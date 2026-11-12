"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ControlButton, FIGURES, FigureFrame, Segmented, Stepper, useElementSize, type FigureProps } from "@/figures/kit";
import { graspFiles, loadGrasp, type GraspFile } from "@/data/files";
import { formatCount, formatMm, formatPercent } from "@/data/format";
import { MACHINES, WEIGHTS, instructionFor } from "@/data/labels";
import type { Weights } from "@/data/types";
import { GraspMap } from "./Map";
import {
  DEFAULT_ROW,
  EDGE_MM,
  GROUPS,
  RINGS_MM,
  ROWS,
  conditionsFor,
  dotsOf,
  evaluationOf,
  isDisturbance,
  machineOf,
  referenceOptions,
  referenceWords,
  reportedCount,
  weightsFor,
  type Reference,
} from "./model";
import { ConditionSelect, EvaluationList, EvaluationSelect } from "./Panel";
import { Key, Stats, episodeText, statsFor } from "./Readout";
import { LayoutPlan } from "./Plan";
import { EpisodeTable } from "./Table";
import "./grasp-map.css";

const info = FIGURES["grasp-map"];

/** Drawn this wide until the stage is measured, and in the static HTML. */
const DEFAULT_SIZE = 480;
const MAX_SIZE = 600;

const ringsText = `${RINGS_MM.slice(0, -1).join(", ")} and ${RINGS_MM[RINGS_MM.length - 1]} mm`;
const lower = (text: string) => `${text.charAt(0).toLowerCase()}${text.slice(1)}`;

/**
 * "Where the gripper closed". A top-down map, centred on the named object (or
 * on whichever object was nearest), with one mark per evaluation episode where
 * the gripper was first told to close: the named object's colour and shape,
 * filled where the object was lifted, a cross where it was not.
 *
 * The reader can
 *   - pick an evaluation: the scripted expert, a failing policy, one run at
 *     several points of training, the policy with history, the policies after
 *     the position fix (whatever has a per-episode file in the data module);
 *   - pick the weights and the conditions it was evaluated under (frozen
 *     cameras, an expert prefix, the object moved);
 *   - centre the map on the named object or the nearest one, and, for a moved
 *     object, on where it stood or where it was put;
 *   - inspect one episode, by a click or a tap or by stepping, to see its
 *     layout drawn to scale beside the map (the map itself compresses
 *     everything beyond 30 mm, which keeps distances from the centre only).
 *
 * Every layout keeps its mark from one evaluation to the next, so the marks
 * travel: they gather in the rings as training goes on, and they stay put or
 * jump when the centre changes, which says whether the gripper went to the
 * named object, to some object, or to none.
 */
export default function GraspMapFigure({ caption }: FigureProps) {
  const [rowKey, setRowKey] = useState(DEFAULT_ROW?.key ?? "");
  const [preferredWeights, setPreferredWeights] = useState<Weights>("ema");
  const [variant, setVariant] = useState("plain");
  const [reference, setReference] = useState<Reference>("named");
  const [inspected, setInspected] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const row = ROWS.find((entry) => entry.key === rowKey) ?? ROWS[0];
  const weights = row ? weightsFor(row, preferredWeights) : undefined;
  const conditions = useMemo(() => (row ? conditionsFor(row, weights) : []), [row, weights]);
  const condition = conditions.find((option) => option.variant === variant) ?? conditions[0];
  const disturbance = isDisturbance(condition);
  const shownReference: Reference = !disturbance && reference === "moved_to" ? "named" : reference;
  const file = condition?.file;
  const evaluation = file ? evaluationOf(file) : undefined;

  // The episodes, fetched after mount. The last file that arrived stays drawn while the next one loads,
  // so its marks can travel to their new places.
  const [loaded, setLoaded] = useState<{ id: string; data: GraspFile; disturbance: boolean } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const fileId = file?.id;
  useEffect(() => {
    if (!fileId) return;
    let current = true;
    loadGrasp(fileId).then(
      (data) => {
        if (!current) return;
        setLoaded({ id: fileId, data, disturbance: graspFiles({ id: fileId })[0]?.kind === "disturbance" });
        setFailed(null);
      },
      () => {
        if (current) setFailed(fileId);
      },
    );
    return () => {
      current = false;
    };
  }, [fileId, attempt]);

  const ready = loaded !== null && loaded.id === fileId;
  const loadFailed = failed !== null && failed === fileId;
  // While the next file loads, the drawn one keeps its own kind of centre.
  const drawnDisturbance = loaded?.disturbance ?? false;
  const drawnReference: Reference = !drawnDisturbance && shownReference === "moved_to" ? "named" : shownReference;
  // When the file could not be loaded, the previous evaluation's marks go: they would read as this one's.
  const dots = useMemo(
    () => (loaded && !loadFailed ? dotsOf(loaded.data.episodes, drawnReference, drawnDisturbance) : []),
    [loaded, loadFailed, drawnReference, drawnDisturbance],
  );
  // Episodes that count but have no mark: the gripper never closed.
  const unclosed = useMemo(
    () =>
      ready && loaded
        ? loaded.data.episodes.filter((episode) => (!drawnDisturbance || episode.moved) && !episode.tcp).length
        : 0,
    [ready, loaded, drawnDisturbance],
  );
  const inspectedDot = inspected === null ? undefined : dots.find((dot) => dot.seed === inspected);
  const inspectedIndex = inspectedDot ? dots.indexOf(inspectedDot) + 1 : 0;

  const stage = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stage);
  const size = Math.min(MAX_SIZE, measured || DEFAULT_SIZE);

  if (!row || !condition || !file) {
    return (
      <FigureFrame title={info.title} stamp={info.stamp} caption={caption}>
        <p className="text-ink-muted">No evaluation has its episodes published yet.</p>
      </FigureFrame>
    );
  }

  // ------------------------------------------------------------ words

  const evaluationWords = [
    row.label,
    row.samplesText,
    weights ? WEIGHTS[weights].label : null,
    condition.variant === "plain" ? null : lower(condition.label),
  ]
    .filter(Boolean)
    .join(", ");
  const centreWords = referenceWords(shownReference, disturbance);
  const count = reportedCount(condition);
  const countWords = count ? `${formatCount(count.successes, count.episodes)} lifted` : null;

  let summary: string;
  if (condition.moved) {
    const moved = condition.moved;
    summary = [
      `${formatCount(moved.successes, moved.episodes)} lifted of the episodes in which the object was moved`,
      moved.fromOldMm !== null && moved.fromNewMm !== null
        ? `the gripper closed a median ${formatMm(moved.fromOldMm)} from where it stood and ${formatMm(moved.fromNewMm)} from where it was put`
        : null,
    ]
      .filter(Boolean)
      .join("; ");
  } else if (evaluation) {
    summary = [
      countWords,
      evaluation.named !== null ? `closed at the named object in ${formatPercent(evaluation.named)}` : null,
      evaluation.missMm !== null ? `a median ${formatMm(evaluation.missMm)} from the named object` : null,
      evaluation.missNearestMm !== null ? `${formatMm(evaluation.missNearestMm)} from the nearest object` : null,
      evaluation.within10 !== null ? `${formatPercent(evaluation.within10)} within 10 mm of the named object` : null,
    ]
      .filter(Boolean)
      .join("; ");
  } else {
    summary = "the notebook does not report this evaluation's numbers";
  }

  const mapLabel = ready
    ? `Top-down map centred on ${centreWords}, rings at ${ringsText}, one mark per episode where the gripper first closed. ${evaluationWords}, ${dots.length} episodes drawn: ${summary}.`
    : `Top-down map centred on ${centreWords}, rings at ${ringsText}. ${evaluationWords}: ${
        loadFailed ? "the episodes could not be loaded" : "the episodes are loading"
      }.`;

  const status = loadFailed
    ? `The episodes of ${evaluationWords} could not be loaded.`
    : !ready
      ? `Loading the episodes of ${evaluationWords}.`
      : inspectedDot
        ? `Episode ${inspectedIndex} of ${dots.length}. ${episodeText(inspectedDot, disturbance)}`
        : `${evaluationWords}: ${countWords ?? "no reported count"}. Centred on ${centreWords}.`;

  const machineId = machineOf(file);
  const machine = machineId ? `, on ${MACHINES[machineId].label}` : "";
  const layouts = evaluation?.episodes ?? file.episodes;
  const note = (
    <>
      One mark per episode, where the gripper was when it was first told to close, on the {layouts} layouts of this
      evaluation, which no policy saw in training{machine}; one training seed per run.
      {disturbance
        ? ` With a moved object, only the episodes in which it could be moved are drawn, as the notebook counts them${
            condition.moved ? ` (${condition.moved.episodes})` : ""
          }.`
        : ""}
      {unclosed > 0 ? ` In ${unclosed} of them the gripper never closed: they have no mark.` : ""}{" "}
      The map is to scale inside the {RINGS_MM[RINGS_MM.length - 1]} mm ring and compressed beyond it (logarithmic, to{" "}
      {EDGE_MM} mm), which keeps each mark&rsquo;s distance from the centre and nothing else; an inspected episode&rsquo;s
      layout is drawn to scale beside it. The counts are the lab notebook&rsquo;s; the shares, medians and slope are
      computed from the same evaluation&rsquo;s export, and the notebook prints some of them, not all. The distances of
      single episodes are read from the per-episode file.
    </>
  );

  const planTitle = inspectedDot
    ? `Episode ${inspectedIndex} of ${dots.length}, layout ${inspectedDot.seed}: “${instructionFor(inspectedDot.target)}”, ${
        inspectedDot.success ? "lifted" : "not lifted"
      }.`
    : "";

  // ------------------------------------------------------------ changes

  const chooseRow = (key: string) => {
    setRowKey(key);
    const next = ROWS.find((entry) => entry.key === key);
    // Keep the conditions when the new evaluation was run under them too.
    if (next && !conditionsFor(next, weightsFor(next, preferredWeights)).some((option) => option.variant === variant)) {
      setVariant("plain");
    }
  };

  const weightOptions = row.weights.map((id) => ({ value: id, label: WEIGHTS[id].short.replace(/^./, (c) => c.toUpperCase()) }));

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      note={note}
      status={status}
      controls={
        <>
          {weights && row.weights.length > 1 ? (
            <Segmented
              label="Weights"
              showLabel
              options={weightOptions}
              value={weights}
              onChange={setPreferredWeights}
            />
          ) : null}
          {conditions.length > 1 ? (
            <ConditionSelect options={conditions} value={condition.variant} onChange={setVariant} />
          ) : null}
          {ready && dots.length > 0 ? (
            <Stepper
              label="episode"
              value={inspectedIndex}
              max={dots.length}
              format={(value, max) => (value === 0 ? `Episode – of ${max}` : `Episode ${value} of ${max}`)}
              onChange={(value) => setInspected(value === 0 ? null : (dots[value - 1]?.seed ?? null))}
            />
          ) : null}
          <ControlButton aria-expanded={showTable} onClick={() => setShowTable((shown) => !shown)}>
            {showTable ? "Hide table" : "Show as table"}
          </ControlButton>
        </>
      }
    >
      <div className="gm-root">
        <div className="gm-layout">
          <div className="gm-main">
            <EvaluationSelect groups={GROUPS} value={row.key} onChange={chooseRow} weights={preferredWeights} />
            <div className="gm-head">
              <Segmented
                label="Centre"
                showLabel
                options={referenceOptions(disturbance)}
                value={shownReference}
                onChange={setReference}
              />
              <Key />
            </div>
            <div ref={stage} className="gm-stage">
              <GraspMap
                size={size}
                dots={dots}
                inspected={inspected}
                onInspect={setInspected}
                stale={!ready}
                label={mapLabel}
              />
              {loadFailed ? (
                <div className="gm-stage-notice">
                  <p>The episodes of this evaluation could not be loaded.</p>
                  <ControlButton
                    onClick={() => {
                      setFailed(null);
                      setAttempt((count) => count + 1);
                    }}
                  >
                    Try again
                  </ControlButton>
                </div>
              ) : !ready && loaded === null ? (
                <div className="gm-stage-notice">
                  <p>Loading the episodes&hellip;</p>
                </div>
              ) : null}
            </div>
            <Stats stats={statsFor(evaluation, condition.moved, shownReference)} />
          </div>
          <div className="gm-side">
            <EvaluationList groups={GROUPS} value={row.key} onChange={chooseRow} weights={preferredWeights} />
            <div className="gm-plan">
              <p className="gm-list-title">Layout of one episode</p>
              {inspectedDot ? (
                <LayoutPlan dot={inspectedDot} title={planTitle} />
              ) : (
                <p className="gm-plan-hint">
                  Click or tap a mark, or step through the episodes, to see that layout drawn to scale: where the gripper
                  closed and how far it was from each object.
                </p>
              )}
            </div>
          </div>
        </div>
        {showTable && ready ? (
          <EpisodeTable
            dots={dots}
            disturbance={disturbance}
            inspected={inspected}
            caption={`Where the gripper first closed in each episode of ${evaluationWords}.`}
          />
        ) : null}
      </div>
    </FigureFrame>
  );
}
