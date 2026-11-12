"use client";

import { useId } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { MISSING, formatCount, formatInterval, formatPercent, formatSamples } from "@/data/format";
import { WEIGHTS } from "@/data/labels";
import type { RunDesign } from "@/data/types";
import type { SeriesStyle } from "@/figures/kit";
import { Marker, REFERENCE } from "@/figures/kit";
import { styles } from "./styles";
import type { RelatedRun, SlotProbe } from "./model";
import { relatedReasons } from "./notes";

export interface ProbeRowsProps {
  rows: SlotProbe[];
  selected: string;
  onSelect: (variant: string) => void;
  /** The colour and marker of the probed policy. */
  series: SeriesStyle;
  /** Share of episodes in which a gripper closing at random would be nearest the named object. */
  chance: number;
  /** Words for the chance level: "one in three". */
  chanceLabel: string;
  /** The other runs of the same policy with history, finished or in progress. */
  related: RelatedRun[];
  /** The design of the probed run, to say what each related run changes. */
  probedDesign: RunDesign;
  /** Names the radio group. */
  label: string;
  /** What the chosen row does to the rollout below, said next to the rows (the chart may be out of view). */
  echo: string | null;
}

const percent = (share: number) => `${Math.max(0, Math.min(100, share * 100))}%`;

function Scale({ chance }: { chance?: number }) {
  return (
    <div className={styles.scale} aria-hidden="true">
      <span style={{ left: 0 }}>0%</span>
      {chance !== undefined ? (
        <span style={{ left: percent(chance) }}>chance</span>
      ) : (
        <span style={{ left: "50%" }}>50%</span>
      )}
      <span style={{ left: "100%" }}>100%</span>
    </div>
  );
}

/** A related run: in progress without a value, or finished with its last reported checkpoint, and why it matters. */
function Related({ entry, probedDesign }: { entry: RelatedRun; probedDesign: RunDesign }) {
  const { run, result } = entry;
  const why = relatedReasons(probedDesign, run.design);
  const name = <strong className={styles.relatedName}>{run.label}</strong>;
  let body;
  if (run.status === "in_progress") {
    body = (
      <>
        <span className={styles.pendingBadge}>
          <Glyph name="clock" />
          In progress
        </span>{" "}
        {name}: no result yet.
      </>
    );
  } else if (result) {
    const { evaluation } = result;
    const named =
      evaluation.named === null ? "" : `; closed at the named object in ${formatPercent(evaluation.named)} of episodes`;
    body = (
      <>
        {name}:{" "}
        {`${formatCount(evaluation.successes, evaluation.episodes)} as served (${WEIGHTS[result.weights].label} after ${formatSamples(result.samples)} samples)${named}. Its start was not probed.`}
      </>
    );
  } else {
    body = <>{name}: no result reported.</>;
  }
  return (
    <li>
      {body}
      {why ? ` ${why}` : null}
    </li>
  );
}

/**
 * The probes as rows, one per condition: success with its 95% interval, and
 * how often the gripper closed at the named object against chance. The rows
 * are a radio group: choosing one sets, in the rollout below, what the slot
 * holds under that condition, and the line under the rows says what that is.
 */
export function ProbeRows({
  rows,
  selected,
  onSelect,
  series,
  chance,
  chanceLabel,
  related,
  probedDesign,
  label,
  echo,
}: ProbeRowsProps) {
  const name = useId();
  const labelId = `${name}-label`;

  return (
    <div>
      <p id={labelId} className="sr-only">
        {label}
      </p>
      <div className={styles.probeHead} aria-hidden="true">
        <span />
        <span className={styles.measure}>
          <span className={styles.headText}>Success, with 95% interval</span>
          <Scale />
          <span className={styles.value} />
        </span>
        <span className={styles.measure}>
          <span className={styles.headText}>Closed at the named object</span>
          <Scale chance={chance} />
          <span className={styles.value} />
        </span>
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.probes}>
        {rows.map((row) => {
          const { probe } = row;
          const isSelected = probe.variant === selected;
          const success = formatCount(probe.successes, probe.episodes);
          const named = probe.named === null ? MISSING : formatPercent(probe.named);
          return (
            <label key={probe.variant} className={styles.probe}>
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={isSelected}
                onChange={() => onSelect(probe.variant)}
              />
              <span className={styles.probeLabel}>
                <span className={styles.radio} aria-hidden="true" />
                {isSelected ? <mark>{row.label}</mark> : <span>{row.label}</span>}
              </span>
              <span className="sr-only">
                {`${success} succeeded (95% interval ${formatInterval(probe.ci)}); closed at the named object in ${named} of episodes, chance ${chanceLabel}.`}
              </span>

              <span className={styles.measure} aria-hidden="true">
                <span className={styles.measureName}>Success, 0 to 100%, with 95% interval</span>
                <span className={styles.track}>
                  <span className={styles.trackEnds} />
                  <span
                    className={styles.whisker}
                    style={{
                      left: percent(probe.ci[0]),
                      width: `calc(${percent(probe.ci[1] - probe.ci[0])} + 1.5px)`,
                    }}
                  />
                  <svg className={styles.dot} style={{ left: percent(probe.rate) }} viewBox="-7 -7 14 14">
                    <Marker x={0} y={0} size={10} shape={series.shape} color={series.color} />
                  </svg>
                </span>
                <span className={styles.value}>{success}</span>
              </span>

              <span className={styles.measure} aria-hidden="true">
                <span className={styles.measureName}>Closed at the named object, 0 to 100% (dashed: chance)</span>
                <span className={styles.track}>
                  <span className={styles.trackEnds} />
                  <span
                    className={styles.chance}
                    style={{
                      left: percent(chance),
                      borderColor: REFERENCE.color,
                    }}
                  />
                  {probe.named !== null ? (
                    <svg className={styles.dot} style={{ left: percent(probe.named) }} viewBox="-7 -7 14 14">
                      <Marker x={0} y={0} size={10} shape={series.shape} color={series.color} />
                    </svg>
                  ) : null}
                </span>
                <span className={styles.value}>{named}</span>
              </span>
            </label>
          );
        })}
      </div>
      {echo ? <p className={styles.echo}>{echo}</p> : null}
      {related.length > 0 ? (
        <ul className={styles.pending} aria-label="Related runs of the same policy">
          {related.map((entry) => (
            <Related key={entry.run.name} entry={entry} probedDesign={probedDesign} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
