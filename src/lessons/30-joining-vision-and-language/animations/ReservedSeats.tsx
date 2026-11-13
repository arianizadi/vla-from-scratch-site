"use client";

import { Arrow, AnimationFrame, Bracket, Chip, Label, Move, stagger } from "@/animations";

const ROW = 190;
const SEAT_W = 34;
const SEAT_H = 30;
const seatX = (i: number) => 40 + i * 44;
const SHADES = [0.35, 0.6, 0.85, 0.5, 0.95, 0.4];
const WORDS = [
  { text: "pick", x: 318 },
  { text: "up", x: 370 },
  { text: "cube", x: 426 },
];
/** The picture: 3 patches across, 2 down, read row by row. */
const tileAt = (i: number): [number, number] => [198 + (i % 3) * 42, 70 + Math.floor(i / 3) * 36];

export function ReservedSeats() {
  return (
    <AnimationFrame
      title="Seats saved for the picture"
      description="The prompt holds one placeholder seat for every patch the picture will make, followed by the words. The picture is cut into six patches, so there are six seats. Each patch token is copied into its seat in reading order, and the language model then reads the whole row as if it were all words."
      steps={[
        "The prompt saves one seat per patch, before any picture arrives.",
        "The picture is cut into patches: six here, so six seats.",
        "Each patch token drops into its seat, in reading order.",
        "The language model reads the row as if it were all words.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          {SHADES.map((_, i) => (
            <rect
              key={`seat-${i}`}
              x={seatX(i) - SEAT_W / 2}
              y={ROW - SEAT_H / 2}
              width={SEAT_W}
              height={SEAT_H}
              rx={6}
              fill="none"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              className="a-t t-vision a-stroke"
              style={{ opacity: step >= 2 ? 0 : 1, transitionDelay: step >= 2 ? `${stagger(i, 90) + 300}ms` : undefined }}
            />
          ))}
          {WORDS.map((word) => (
            <Chip key={word.text} x={word.x} y={ROW} text={word.text} tone="language" size={14} />
          ))}
          <Label x={seatX(2.5)} y={ROW + 34} tone="vision" size={14} opacity={step <= 1 ? 1 : 0}>
            {step === 0 ? "seats for the picture" : "six seats"}
          </Label>
          <Label x={372} y={ROW + 34} tone="language" size={14}>
            the words
          </Label>

          <Label x={tileAt(1)[0]} y={30} tone="vision" size={14} opacity={step === 1 ? 1 : 0}>
            six patches
          </Label>
          {SHADES.map((shade, i) => {
            const [x, y] = tileAt(i);
            const seated = step >= 2;
            return (
              <Move key={`tile-${i}`} x={seated ? seatX(i) : x} y={seated ? ROW : y} opacity={step >= 1 ? 1 : 0} delay={seated ? stagger(i, 90) : stagger(i)}>
                <rect x={-SEAT_W / 2} y={-SEAT_H / 2} width={SEAT_W} height={SEAT_H} rx={6} className="t-vision a-fill" style={{ fillOpacity: shade }} />
                <Label x={0} y={0} tone="ink" size={13} weight={700}>
                  {String(i + 1)}
                </Label>
              </Move>
            );
          })}

          <Arrow from={[seatX(0) - 10, ROW - 34]} to={[446, ROW - 34]} tone="accent" drawn={step === 3} opacity={step === 3 ? 1 : 0} flow={step === 3} />
          <Bracket x1={seatX(0) - 17} x2={451} y={ROW + 48} label="one row, read like words" tone="accent" below opacity={step === 3 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
