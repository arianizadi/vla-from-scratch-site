"use client";

import { MISSING, formatWhole } from "@/data/format";
import { OBJECTS } from "@/data/labels";
import { Glyph } from "@/components/ui/Glyph";
import type { Dot } from "./model";

/**
 * The map as a table: one row per episode, the distances read from the
 * per-episode file. It scrolls inside its own box; the row of the episode
 * being inspected is marked.
 */
export function EpisodeTable({
  dots,
  disturbance,
  inspected,
  caption,
}: {
  dots: readonly Dot[];
  disturbance: boolean;
  inspected: number | null;
  caption: string;
}) {
  return (
    <div className="gm-table-box" tabIndex={0} role="region" aria-label="Episodes as a table">
      <table className="gm-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="gm-num">
              Episode
            </th>
            <th scope="col" className="gm-num">
              Layout
            </th>
            <th scope="col">Named object</th>
            <th scope="col">Outcome</th>
            <th scope="col" className="gm-num">
              {disturbance ? "To where it stood, mm" : "To the named object, mm"}
            </th>
            {disturbance ? (
              <th scope="col" className="gm-num">
                To where it was put, mm
              </th>
            ) : null}
            <th scope="col">Nearest object</th>
            <th scope="col" className="gm-num">
              To the nearest, mm
            </th>
            <th scope="col" className="gm-num">
              Closes
            </th>
          </tr>
        </thead>
        <tbody>
          {dots.map((dot, index) => (
            <tr key={dot.seed} className={dot.seed === inspected ? "gm-table-current" : undefined}>
              <th scope="row" className="gm-num">
                {index + 1}
              </th>
              <td className="gm-num">{dot.seed}</td>
              <td>{OBJECTS[dot.target].short}</td>
              <td>
                <span className="gm-outcome">
                  <Glyph name={dot.success ? "check" : "cross"} size={11} />
                  {dot.success ? "Lifted" : "Not lifted"}
                </span>
              </td>
              <td className="gm-num">{formatWhole(dot.toNamed)}</td>
              {disturbance ? <td className="gm-num">{formatWhole(dot.toMovedTo)}</td> : null}
              <td>{dot.nearest ? OBJECTS[dot.nearest].short : MISSING}</td>
              <td className="gm-num">{formatWhole(dot.toNearest)}</td>
              <td className="gm-num">{dot.closes ?? MISSING}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
