"use client";

import { AnimationFrame, Arrow, Box, Chip, Dot, Label } from "@/animations";

/**
 * A mid-grey pixel (128 on the 0-255 scale) prepared two ways. Path A divides
 * by 255 and then centres, (x / 255 - 0.5) / 0.5, giving about 0. Path B skips
 * the division, (x - 0.5) / 0.5, giving 255. Arithmetic from the chapter.
 */
const LINE_Y = 238;
const LINE_L = 140;
const LINE_R = 340;
const ZERO = (LINE_L + LINE_R) / 2;

export function PixelScale() {
  return (
    <AnimationFrame
      title="The same grey, two scales"
      description="A mid-grey pixel is stored as 128 on a scale from 0 to 255. Path A divides by 255 and then centres the value, so mid-grey becomes 0, inside the range from minus 1 to 1 the model learned. Path B forgot to divide, so the same grey becomes 255, hundreds of times outside that range. Nothing raises an error."
      steps={[
        "A mid-grey pixel is stored as 128, on a scale from 0 to 255.",
        "Path A divides by 255, then centres it. Mid-grey becomes 0.",
        "Path B forgot to divide. The same grey becomes 255.",
        "The model learned numbers between −1 and 1. Path B is far off the scale, silently.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <rect x={30} y={92} width={48} height={48} rx={8} className="t-muted a-fill-soft a-stroke" strokeWidth={2} style={{ fillOpacity: 0.5 }} />
          <Label x={54} y={116} tone="ink" size={16} weight={700} mono>
            128
          </Label>
          <Label x={54} y={160} tone="muted" size={14}>
            mid-grey
          </Label>

          {/* The brightness scale the pixel is stored on, with mid-grey marked. */}
          <g className="a-t" style={{ opacity: step === 0 ? 1 : 0.45 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <rect key={i} x={150 + i * 16} y={106} width={16} height={18} className="t-ink a-fill" style={{ fillOpacity: 0.94 - i * 0.09 }} />
            ))}
            <rect x={150} y={106} width={176} height={18} rx={3} className="t-faint a-stroke" fill="none" strokeWidth={1} />
            <Label x={140} y={115} tone="muted" size={13} anchor="end" mono>
              0
            </Label>
            <Label x={336} y={115} tone="muted" size={13} anchor="start" mono>
              255
            </Label>
            <path d="M238 100l-6 -8h12z" className="t-accent a-fill" />
          </g>

          <Arrow from={[84, 104]} to={[124, 60]} tone={step === 1 ? "accent" : "faint"} drawn={step >= 1} />
          <Box x={224} y={56} w={200} h={44} label="divide by 255, centre" tone="ink" active={step === 1} opacity={step >= 1 ? 1 : 0} />
          <Arrow from={[326, 56]} to={[360, 56]} tone="faint" drawn={step >= 1} />
          <Chip x={398} y={56} text="0" tone="accent" variant="outline" opacity={step >= 1 ? 1 : 0} />
          <Label x={398} y={30} tone="accent" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
            path A
          </Label>

          <Arrow from={[84, 128]} to={[124, 168]} tone={step === 2 ? "accent" : "faint"} drawn={step >= 2} />
          <Box x={224} y={172} w={200} h={44} label="centre only" sub="forgot to divide" tone="failure" active={step === 2} opacity={step >= 2 ? 1 : 0} />
          <Arrow from={[326, 172]} to={[360, 172]} tone="faint" drawn={step >= 2} />
          <Chip x={398} y={172} text="255" tone="failure" variant="outline" opacity={step >= 2 ? 1 : 0} />
          <Label x={398} y={146} tone="failure" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            path B
          </Label>

          {/* The range the model learned, and where each path lands. */}
          <rect x={LINE_L} y={LINE_Y - 9} width={LINE_R - LINE_L} height={18} rx={9} className="a-t t-accent a-fill-soft" style={{ opacity: step >= 3 ? 1 : 0 }} />
          <line x1={24} y1={LINE_Y} x2={456} y2={LINE_Y} className="a-t t-faint a-stroke" strokeWidth={1.5} style={{ opacity: step >= 3 ? 1 : 0 }} />
          <Label x={LINE_L} y={LINE_Y + 22} tone="muted" size={13} mono opacity={step >= 3 ? 1 : 0}>
            −1
          </Label>
          <Label x={LINE_R} y={LINE_Y + 22} tone="muted" size={13} mono opacity={step >= 3 ? 1 : 0}>
            1
          </Label>
          <Label x={ZERO} y={LINE_Y - 24} tone="accent" size={14} opacity={step >= 3 ? 1 : 0}>
            what the model learned
          </Label>
          <Dot x={ZERO} y={step >= 3 ? LINE_Y : 56} r={7} tone="accent" opacity={step >= 3 ? 1 : 0} />
          <Dot x={step >= 3 ? 452 : 398} y={step >= 3 ? LINE_Y : 172} r={7} tone="failure" opacity={step >= 3 ? 1 : 0} />
          <Label x={452} y={LINE_Y + 22} tone="failure" size={13} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
            255, far off →
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
