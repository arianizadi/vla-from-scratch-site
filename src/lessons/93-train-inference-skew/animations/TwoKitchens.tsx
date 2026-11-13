"use client";

import { AnimationFrame, Arrow, Box, Cells, Label } from "@/animations";

/** Toy numbers: what one picture becomes on each path. Same length, different values. */
const TRAINED = [0.3, 0.55, 0.45, 0.75, 0.35];
const SERVED = [1, 1, 0.95, 1, 1];
const PICTURE = [0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.7, 0.5];

export function TwoKitchens() {
  return (
    <AnimationFrame
      title="One picture, two kitchens"
      description="The same camera picture is prepared twice: by the training path, from stored files, and by the serving path, from the live camera. Both give a row of numbers of the same length, but with different values. The model takes either one without complaint, so nothing warns that they differ."
      steps={[
        "One camera picture. Two pieces of code prepare it for the model.",
        "In training, the training path turns it into a row of numbers.",
        "On the robot, the serving path does the same job, its own way.",
        "Same length, different numbers. The model runs anyway: no error, no warning.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {/* The picture: a small grid of pixels. */}
          <g className="t-vision">
            {PICTURE.map((value, i) => (
              <rect
                key={i}
                x={28 + (i % 3) * 18}
                y={112 + Math.floor(i / 3) * 18}
                width={16}
                height={16}
                rx={2}
                className="a-fill"
                style={{ fillOpacity: 0.2 + value * 0.7 }}
              />
            ))}
          </g>
          <Label x={54} y={186} tone="vision" size={14} weight={700}>
            picture
          </Label>

          <Arrow from={[88, 128]} to={[132, 76]} tone={step === 1 ? "accent" : "faint"} flow={step === 1} />
          <Arrow from={[88, 152]} to={[132, 204]} tone={step === 2 ? "accent" : "faint"} flow={step === 2} />

          <Box x={200} y={70} w={136} h={52} label="training path" sub="stored files" active={step === 1} />
          <Box x={200} y={210} w={136} h={52} label="serving path" sub="live camera" active={step === 2} />

          <Arrow from={[272, 70]} to={[296, 70]} tone="faint" drawn={step >= 1} />
          <Arrow from={[272, 210]} to={[296, 210]} tone="faint" drawn={step >= 2} />
          <Cells x={344} y={70} values={TRAINED} tone="vision" cell={14} opacity={step >= 1 ? 1 : 0} />
          <Cells x={344} y={210} values={SERVED} tone="vision" cell={14} opacity={step >= 2 ? 1 : 0} />

          <rect
            x={296}
            y={192}
            width={96}
            height={36}
            rx={8}
            className="a-t t-mark a-stroke"
            fill="none"
            strokeWidth={3}
            style={{ opacity: step === 3 ? 1 : 0 }}
          />
          <Label x={344} y={250} tone="ink" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            different numbers
          </Label>

          <Box x={436} y={140} w={64} h={60} label="model" tone="ink" filled />
          <Arrow from={[394, 82]} to={[420, 106]} tone="faint" drawn={step >= 1} />
          <Arrow from={[394, 198]} to={[420, 174]} tone="faint" drawn={step >= 2} />
          <Label x={468} y={30} tone="ink" size={14} weight={700} anchor="end" opacity={step === 3 ? 1 : 0}>
            no warning
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
