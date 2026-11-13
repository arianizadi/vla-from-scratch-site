"use client";

import { AnimationFrame, Arrow, Label, Move } from "@/animations";
import { DIAL, score, screenDegrees } from "./rotary";

const CX = 140;
const CY = 138;
const R = 100;
const PANEL = 286;
const VALUE = 462;

export function RotaryDial() {
  return (
    <AnimationFrame
      title="Each word turned by its place"
      description="Two words with the same content start as the same arrow. The word at place 3 is turned by 3 notches and the word at place 5 by 5; their match is −0.42. Moving both to places 13 and 15 turns both further by the same amount, so the angle between them and the match stay the same. Places 3 and 4 instead are 1 apart and match 0.54."
      steps={[
        "Two words with the same content start as the same arrow.",
        "Turn the word at place 3 by 3 notches, the word at place 5 by 5. Their match: −0.42.",
        "Move both 10 places on, to 13 and 15. Both turn further, but the angle between them stays, and so does the match.",
        "Places 3 and 4 instead: a smaller gap, a smaller angle, a different match.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const state = DIAL[step];
        const placed = state.query !== undefined && state.key !== undefined;
        return (
          <>
            <circle cx={CX} cy={CY} r={R} className="t-faint a-stroke" fill="none" strokeWidth={1.5} />
            <path d={`M${CX - R - 8} ${CY}H${CX + R + 8}M${CX} ${CY - R - 8}V${CY + R + 8}`} className="t-faint a-stroke" strokeWidth={1} strokeDasharray="3 4" />

            <Move x={CX} y={CY} rotate={screenDegrees(state.keyAngle)}>
              <Arrow from={[0, 0]} to={[R - 6, 0]} tone="ink" width={3} />
            </Move>
            <Move x={CX} y={CY} rotate={screenDegrees(state.queryAngle)}>
              <Arrow from={[0, 0]} to={[R - 6, 0]} tone="accent" width={3} />
            </Move>
            <circle cx={CX} cy={CY} r={4} className="t-ink a-fill" />

            <path d={`M${PANEL} 30h22`} className="t-accent a-stroke" strokeWidth={3} strokeLinecap="round" />
            <Label x={PANEL + 30} y={30} tone="ink" size={14} anchor="start">
              asks
            </Label>
            <path d={`M${PANEL + 92} 30h22`} className="t-ink a-stroke" strokeWidth={3} strokeLinecap="round" />
            <Label x={PANEL + 122} y={30} tone="ink" size={14} anchor="start">
              label
            </Label>

            {[
              { label: "asker at", value: state.query === undefined ? "" : String(state.query), y: 80 },
              { label: "label at", value: state.key === undefined ? "" : String(state.key), y: 108 },
              { label: "places apart", value: placed ? String(Math.abs(state.query! - state.key!)) : "", y: 136 },
            ].map((row) => (
              <g key={row.label}>
                <Label x={PANEL} y={row.y} tone="muted" size={14} anchor="start" opacity={placed ? 1 : 0}>
                  {row.label}
                </Label>
                <Label key={`${row.label}-${step}`} x={VALUE} y={row.y} tone="ink" size={15} anchor="end" mono weight={700} opacity={placed ? 1 : 0} enter>
                  {row.value}
                </Label>
              </g>
            ))}
            <path d={`M${PANEL} 160H${VALUE}`} className="a-t t-faint a-stroke" strokeWidth={1} style={{ opacity: placed ? 1 : 0 }} />
            <Label x={PANEL} y={190} tone="muted" size={14} anchor="start" opacity={placed ? 1 : 0}>
              match
            </Label>
            <Label key={`score-${step}`} x={VALUE} y={222} tone="ink" size={30} anchor="end" mono weight={700} opacity={placed ? 1 : 0} enter>
              {placed ? score(state.query!, state.key!) : ""}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
