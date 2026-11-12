import { STRAND_BY_ID, type Modality, type StrandId } from "./entries";

const HUE: Record<Modality, string> = {
  language: "var(--language)",
  vision: "var(--vision)",
  action: "var(--action)",
};

/** The `d` of a pie sector of radius r from angle a0 to a1 (radians, 0 = up, clockwise). */
function sector(r: number, a0: number, a1: number): string {
  const point = (a: number) => `${(r * Math.sin(a)).toFixed(3)},${(-r * Math.cos(a)).toFixed(3)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M0,0 L${point(a0)} A${r},${r} 0 ${large} 1 ${point(a1)} Z`;
}

/**
 * Sectors of a marker, one per modality the strand works with, as SVG paths
 * centred on 0,0. A single modality is a full disc; a vision-language model is
 * split in two (image, text); a vision-language-action model in three.
 */
export function MarkerShape({ strand, r }: { strand: StrandId; r: number }) {
  const modalities = STRAND_BY_ID.get(strand)?.modalities ?? [];
  const n = modalities.length;
  return (
    <>
      <circle r={r + 1.5} fill="var(--surface)" />
      {n <= 1 ? (
        <circle r={r} fill={HUE[modalities[0] ?? "language"]} />
      ) : (
        modalities.map((modality, index) => {
          // Two halves split vertically (left, right); three sectors from the top.
          const start = n === 2 ? Math.PI + index * Math.PI : (index * 2 * Math.PI) / n;
          return <path key={modality} d={sector(r, start, start + (2 * Math.PI) / n)} fill={HUE[modality]} />;
        })
      )}
      <circle r={r} fill="none" stroke="var(--text)" strokeOpacity={0.55} strokeWidth={0.75} />
    </>
  );
}

/** The marker as a small inline image, for HTML labels. Decorative: the strand is always named beside it. */
export function StrandMarker({ strand, size = 12, className = "" }: { strand: StrandId; size?: number; className?: string }) {
  const half = size / 2 + 2;
  return (
    <svg
      className={`tl-marker ${className}`}
      width={size + 4}
      height={size + 4}
      viewBox={`${-half} ${-half} ${2 * half} ${2 * half}`}
      aria-hidden="true"
      focusable="false"
    >
      <MarkerShape strand={strand} r={size / 2} />
    </svg>
  );
}

/** One modality hue as a small disc, for the key. */
export function ModalitySwatch({ modality }: { modality: Modality }) {
  return (
    <svg className="tl-marker" width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">
      <circle r={5.5} fill={HUE[modality]} stroke="var(--text)" strokeOpacity={0.55} strokeWidth={0.75} />
    </svg>
  );
}
