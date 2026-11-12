"use client";

import { MISSING, formatPercent } from "@/data/format";
import { Marker, type MarkerShape } from "@/figures/kit";
import {
  LOSS_COLOR,
  evaluationAt,
  formatLoss,
  interval,
  lossChange,
  lossRelative,
  previousInterval,
  rateChange,
  weightsLegend,
  type RunModel,
} from "./model";

function Swatch({ color, shape, hollow }: { color: string; shape?: MarkerShape; hollow?: boolean }) {
  return (
    <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" focusable="false" className="flex-none">
      {shape ? (
        <Marker shape={shape} x={11} y={6} color={color} hollow={hollow} />
      ) : (
        <line x1={1} x2={21} y1={6} y2={6} stroke={color} strokeWidth={2} />
      )}
    </svg>
  );
}

/**
 * The loss's change across an interval: in its own units and as a share of
 * where it started ("−0.006 (−11%)"); on a narrow stage the share alone, which
 * is the part that compares with another interval.
 */
function LossChange({ from, to }: { from: number; to: number }) {
  return (
    <>
      <span className="hidden @[560px]:inline">{lossChange(from, to)} (</span>
      {lossRelative(from, to)}
      <span className="hidden @[560px]:inline">)</span>
    </>
  );
}

/**
 * The key to the chart, which is also its readout: one row per series, with
 * its value at both ends of the shaded interval, the change across it, and
 * the change across the interval before. The loss changes in its own units,
 * and as a share of where it started, so the two intervals can be compared:
 * a loss that keeps falling at its pace stands next to a success that jumps.
 *
 * Columns have fixed widths and cells never wrap, so nothing moves while
 * scrubbing.
 */
export function Readout({ model, at }: { model: RunModel; at: number }) {
  const { from, to } = interval(model, at);
  const before = previousInterval(model, at);
  const cell = "px-1 py-0.5 text-right whitespace-nowrap tabular-nums @[560px]:px-2";

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-auto border-collapse text-13 font-medium stretch-88">
        <caption className="sr-only">
          Legend, with each series at both ends of the shaded interval, the change across it, and the change across
          the interval before it
        </caption>
        <thead>
          <tr className="text-ink-faint">
            <th scope="col" className="py-0.5 pr-2 text-left font-medium">
              <span className="sr-only">Series</span>
            </th>
            <th scope="col" className={`${cell} min-w-[7ch] font-medium`}>
              {from.heading}
            </th>
            <th scope="col" className={`${cell} min-w-[7ch] font-medium`}>
              {to.heading}
            </th>
            <th scope="col" className={`${cell} min-w-[6ch] font-medium @[560px]:min-w-[13ch]`}>
              Change
            </th>
            <th scope="col" className={`${cell} min-w-[6ch] font-medium @[560px]:min-w-[13ch]`}>
              <span className="hidden @[560px]:inline">Interval before</span>
              <span className="@[560px]:hidden">Before</span>
              {before ? (
                <span className="sr-only">
                  , {before.from.row ? before.from.heading : "start"} to {before.to.heading}
                </span>
              ) : null}
            </th>
          </tr>
        </thead>
        <tbody className="text-ink-muted">
          <tr>
            <th scope="row" className="py-0.5 pr-2 text-left font-medium">
              <span className="inline-flex items-center gap-1.5 leading-tight @[560px]:whitespace-nowrap">
                <Swatch color={LOSS_COLOR} />
                Training loss
              </span>
            </th>
            <td className={`${cell} text-ink`}>{formatLoss(from.loss)}</td>
            <td className={`${cell} text-ink`}>{formatLoss(to.loss)}</td>
            <td className={`${cell} font-semibold text-ink`}>
              <LossChange from={from.loss} to={to.loss} />
            </td>
            <td className={cell}>{before ? <LossChange from={before.from.loss} to={before.to.loss} /> : MISSING}</td>
          </tr>
          {model.weights.map((kind) => {
            const style = model.styles[kind];
            const start = evaluationAt(from.row ?? undefined, kind);
            const end = evaluationAt(to.row ?? undefined, kind);
            return (
              <tr key={kind}>
                <th scope="row" className="py-0.5 pr-2 text-left font-medium">
                  <span className="inline-flex items-center gap-1.5 leading-tight @[560px]:whitespace-nowrap">
                    <Swatch color={style.color} shape={style.shape} hollow={style.hollow} />
                    {weightsLegend(kind, true)}
                  </span>
                </th>
                <td className={`${cell} text-ink`}>{formatPercent(start?.rate)}</td>
                <td className={`${cell} text-ink`}>{formatPercent(end?.rate)}</td>
                <td className={`${cell} font-semibold text-ink`}>{rateChange(start, end)}</td>
                <td className={cell}>
                  {before
                    ? rateChange(evaluationAt(before.from.row ?? undefined, kind), evaluationAt(before.to.row ?? undefined, kind))
                    : MISSING}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
