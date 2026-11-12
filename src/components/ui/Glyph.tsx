/**
 * The small marks that carry meaning next to a word: provenance stamps
 * (filled square, half square, open circle, bracket), states (check, cross,
 * clock) and control icons (play, pause, replay, chevrons). Always decorative;
 * the word beside the glyph, or the control's accessible name, is the label.
 */

export type GlyphName =
  | "square-filled"
  | "square-half"
  | "circle-open"
  | "bracket"
  | "check"
  | "cross"
  | "clock"
  | "chevron"
  | "menu"
  | "close"
  | "arrow-left"
  | "arrow-right"
  | "chevron-left"
  | "play"
  | "pause"
  | "replay";

interface GlyphProps {
  name: GlyphName;
  size?: number;
  className?: string;
}

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;

function shape(name: GlyphName) {
  switch (name) {
    case "square-filled":
      return <rect x="2" y="2" width="8" height="8" fill="currentColor" />;
    case "square-half":
      return (
        <>
          <rect x="2.75" y="2.75" width="6.5" height="6.5" {...STROKE} />
          <rect x="2" y="2" width="4" height="8" fill="currentColor" />
        </>
      );
    case "circle-open":
      return <circle cx="6" cy="6" r="3.5" {...STROKE} />;
    case "bracket":
      return <path d="M8.5 2.25H3.5v7.5h5" {...STROKE} />;
    case "check":
      return <path d="M2.5 6.5l2.5 2.5 4.5-5.5" {...STROKE} />;
    case "cross":
      return <path d="M3 3l6 6M9 3l-6 6" {...STROKE} />;
    case "clock":
      return (
        <>
          <circle cx="6" cy="6" r="4.25" {...STROKE} />
          <path d="M6 3.5V6l1.75 1.25" {...STROKE} />
        </>
      );
    case "chevron":
      return <path d="M4.5 2.5L8 6l-3.5 3.5" {...STROKE} />;
    case "menu":
      return <path d="M1.5 3h9M1.5 6h9M1.5 9h9" {...STROKE} />;
    case "close":
      return <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" {...STROKE} />;
    case "arrow-left":
      return <path d="M10 6H2.5M5.5 2.5L2 6l3.5 3.5" {...STROKE} />;
    case "arrow-right":
      return <path d="M2 6h7.5M6.5 2.5L10 6 6.5 9.5" {...STROKE} />;
    case "chevron-left":
      return <path d="M7.5 2.5L4 6l3.5 3.5" {...STROKE} />;
    case "play":
      return <path d="M3.5 2.25v7.5L10 6z" fill="currentColor" />;
    case "pause":
      return <path d="M3 2.5h2v7H3zM7 2.5h2v7H7z" fill="currentColor" />;
    case "replay":
      return <path d="M2.5 6a3.5 3.5 0 1 0 1.2-2.6M2.25 1.75v2h2" {...STROKE} />;
  }
}

export function Glyph({ name, size = 12, className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {shape(name)}
    </svg>
  );
}
