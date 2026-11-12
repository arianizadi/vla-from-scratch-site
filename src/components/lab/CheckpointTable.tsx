/**
 * Every reported checkpoint of one run, as the notebook's per-run tables print
 * them: samples, success, closed at the named object, slope and median miss,
 * each as trained / averaged ("-" where a run saved no averaged weights).
 */

import type { CheckpointRow } from "@/data/checkpoints";
import { formatCount } from "@/data/format";
import { RateTrack, RowLink, TableBox, checkpointCells, samplesText } from "./shared";

export function CheckpointTable({ rows, label, idPrefix }: { rows: CheckpointRow[]; label: string; idPrefix: string }) {
  return (
    <TableBox label={label}>
      <thead>
        <tr>
          <th scope="col">Samples</th>
          <th scope="col" className="num">
            Success (trained / averaged)
          </th>
          <th scope="col">
            <span className="sr-only">Success on a 0 to 100% line, with its 95% interval</span>
          </th>
          <th scope="col" className="num">
            Closed at the named object
          </th>
          <th scope="col" className="num">
            Slope
          </th>
          <th scope="col" className="num">
            Median miss to named
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const cells = checkpointCells(row);
          const shown = row.ema ?? row.raw;
          const id = `${idPrefix}-${row.checkpoint}`;
          return (
            <tr key={row.checkpoint} id={id}>
              <th scope="row" className="whitespace-nowrap">
                {samplesText(row)}
                <RowLink id={id} label={samplesText(row)} />
              </th>
              <td className="num">
                {cells.success}
                <span className="sr-only">
                  {" "}
                  ({formatCount(row.raw.successes, row.raw.episodes)}
                  {row.ema ? ` / ${formatCount(row.ema.successes, row.ema.episodes)}` : ""})
                </span>
              </td>
              <td>
                <RateTrack rate={shown.rate} ci={shown.ci} />
              </td>
              <td className="num">{cells.named}</td>
              <td className="num">{cells.slope}</td>
              <td className="num">{cells.miss}</td>
            </tr>
          );
        })}
      </tbody>
    </TableBox>
  );
}
