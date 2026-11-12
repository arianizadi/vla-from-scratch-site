import { Glyph } from "@/components/ui/Glyph";
import type { TokenPlace } from "./algorithm";
import type { ViewProps } from "./Drawing";
import { FOLLOWED, OTHER, OUTCOMES, count, type Arrival, type Prompt, type Reading } from "./model";

const PATHS: readonly { arrival: Arrival; heading: string }[] = [
  { arrival: "batch", heading: "In a training batch" },
  { arrival: "alone", heading: "Served alone" },
];

/**
 * Where the row's padding is relative to the extra token, if the row has any:
 * "1 pad before it" (between the last real token and it) or "1 pad after it".
 */
function aside(place: TokenPlace): string | null {
  if (place.padsBefore > 0) return `${count(place.padsBefore, "pad")} before it`;
  if (place.padsAfter > 0) return `${count(place.padsAfter, "pad")} after it`;
  return null;
}

interface LedgerRowProps {
  prompt: Prompt;
  reading: Reading;
  /** The path the drawing shows. */
  drawn: Arrival;
  /** The drawing follows this prompt, so its two indices carry the ruler's marks. */
  followed: boolean;
}

function LedgerRow({ prompt, reading, drawn, followed }: LedgerRowProps) {
  const differs = reading.shift > 0;
  return (
    <tr>
      <th scope="row">
        {prompt.text}
        <span className="ps-ids">{count(prompt.ids.length, "id")} with the template</span>
        <span className={`ps-verdict ${differs ? "ps-differs" : "ps-same"}`}>
          <Glyph name={differs ? "cross" : "check"} />
          {differs ? `Differs by ${count(reading.shift, "position")}` : "Same index both ways"}
        </span>
      </th>
      {PATHS.map(({ arrival }) => {
        const place = reading[arrival];
        const mark = !followed ? "" : arrival === drawn ? "ps-index-drawn" : "ps-index-elsewhere";
        const note = aside(place);
        return (
          <td key={arrival} className="ps-num">
            <span className={`ps-index ${mark}`}>{place.index}</span>
            {note ? <span className="ps-aside">{note}</span> : null}
          </td>
        );
      })}
    </tr>
  );
}

/**
 * The reading of the figure: the index of the extra token on both paths, for
 * both prompts. The followed prompt's two numbers wear the marks of the ruler
 * (highlighter for the path that is drawn, dashed for the other), so the table
 * is also the key to the drawing.
 */
export function Ledger({ placement, arrival }: ViewProps) {
  const outcome = OUTCOMES[placement];
  return (
    <table className="ps-ledger">
      <caption className="sr-only">
        Index of the action token in each prompt, in a training batch and served alone.
      </caption>
      <colgroup>
        <col />
      </colgroup>
      <colgroup span={PATHS.length} />
      <thead>
        <tr>
          <th scope="col" rowSpan={2} className="ps-head-prompt">
            Prompt
          </th>
          <th scope="colgroup" colSpan={PATHS.length} className="ps-num ps-head-group">
            Index of the action token
          </th>
        </tr>
        <tr>
          {PATHS.map((path) => (
            <th key={path.arrival} scope="col" className="ps-num">
              {path.heading}
              {path.arrival === arrival ? <span className="sr-only"> (drawn above)</span> : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <LedgerRow prompt={FOLLOWED} reading={outcome.followed} drawn={arrival} followed />
        <LedgerRow prompt={OTHER} reading={outcome.other} drawn={arrival} followed={false} />
      </tbody>
    </table>
  );
}
