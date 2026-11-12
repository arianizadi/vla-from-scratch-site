/**
 * Runs listed with where they ended, or as in progress: one row per run, the
 * final reported checkpoint of a finished run, a hatched row without a value
 * for a run that is still training or not in the data yet. The rows fill in
 * when the data module reports a run; nothing here assumes which.
 */

import { finalCheckpointRow } from "@/data/checkpoints";
import { MISSING, formatPercent, formatSlope } from "@/data/format";
import { POSITION_FIX, runLabel } from "@/data/labels";
import type { AwaitedRun, Run } from "@/data/runs";
import { InProgressBadge, RowLink, TableBox, both, namedOf, samplesText, slopeOf, successOf } from "./shared";
import styles from "./styles";

export type ListedRun = Run | AwaitedRun;

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** The run by its recipe: "4000 demonstrations, no history, random start poses, position fix". */
export function recipeOf(entry: ListedRun): string {
  const samplesPlanned = "status" in entry ? (entry as Run).samplesPlanned : 0;
  return runLabel({ ...entry, samplesPlanned }, { recipe: true });
}

export function RunStatusTable({
  runs,
  label,
  idPrefix,
  showFix = false,
}: {
  runs: ListedRun[];
  label: string;
  idPrefix: string;
  /** A column saying whether the run was trained before or after the position fix. */
  showFix?: boolean;
}) {
  if (runs.length === 0) return null;
  const width = 4;
  return (
    <TableBox label={label}>
      <thead>
        <tr>
          <th scope="col">Run</th>
          {showFix ? <th scope="col">Position table</th> : null}
          <th scope="col" className="num">
            Last reported checkpoint
          </th>
          <th scope="col" className="num">
            Success (trained / averaged)
          </th>
          <th scope="col" className="num">
            Closed at the named object
          </th>
          <th scope="col" className="num">
            Slope
          </th>
        </tr>
      </thead>
      <tbody>
        {runs.map((entry) => {
          const id = `${idPrefix}-${entry.name}`;
          const name = capital(entry.label);
          const recipe = recipeOf(entry);
          const finished = "status" in entry && entry.status === "finished";
          const row = finished ? finalCheckpointRow(entry.name) : undefined;
          return (
            <tr key={entry.name} id={id}>
              <th scope="row" className={styles.wrap}>
                {name}
                <RowLink id={id} label={name} />
                <span className={styles.cellDetail}>
                  {recipe !== name ? `${recipe}, ` : null}
                  <code className={styles.inlineCode}>{entry.name}</code>
                </span>
              </th>
              {showFix ? <td>{capital(POSITION_FIX[entry.group.fix].short)}</td> : null}
              {finished ? (
                row ? (
                  <>
                    <td className="num">{samplesText(row)}</td>
                    <td className="num">{both(row, successOf, formatPercent)}</td>
                    <td className="num">{both(row, namedOf, formatPercent)}</td>
                    <td className="num">{both(row, slopeOf, formatSlope)}</td>
                  </>
                ) : (
                  <td colSpan={width} className="text-ink-muted">
                    {MISSING}
                    <span className="sr-only"> no checkpoint evaluation reported</span>
                  </td>
                )
              ) : (
                <td colSpan={width} className={styles.hatched}>
                  <InProgressBadge />
                  <span className="ml-2 text-14">No value until the run is reported.</span>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </TableBox>
  );
}
