"use client";

import { AnimationFrame, Dot, Label, Path, stagger } from "@/animations";
import { ACTION_POSITIONS, COLLAPSED, DISTINCT_AFTER } from "./bfloat16";

const LINE_Y = 176;
const X0 = 44;
const SPACING = 28;
const xOf = (position: number) => X0 + (position - 426) * SPACING;
const PILE = 21;

export function PositionCollapse() {
  return (
    <AnimationFrame
      title="Places that blurred together"
      description="One policy's 15 action steps sit at places 426 to 440. The old table stored places with too few digits, so up there only even numbers fit. Each odd place rounded to an even neighbour, and the 15 steps shared 8 places: 427, 428 and 429 all became 428. Steps on one place got the same turn, so their order was lost without an error. The fix keeps every digit."
      steps={[
        "One robot policy's 15 action steps sit at places 426 to 440.",
        "The old table stored places with too few digits. Up here, only even numbers fit.",
        `Each odd place rounds to an even neighbour: 15 steps now share ${DISTINCT_AFTER} places.`,
        "Steps on one place get the same turn. Their order is gone, and no error says so.",
        "The fix keeps every digit. Each step has a place of its own again.",
      ]}
      still={3}
      size={[480, 250]}
    >
      {(step) => {
        const collapsed = step >= 2 && step <= 3;
        const count = collapsed ? DISTINCT_AFTER : 15;
        return (
          <>
            <Label x={240} y={26} tone="muted" size={14}>
              separate places
            </Label>
            <Label key={`count-${count}`} x={240} y={56} tone={collapsed ? "failure" : "ink"} size={30} weight={700} enter>
              {`${count} of 15`}
            </Label>

            <Path d={`M${xOf(426) - 22} ${LINE_Y}H${xOf(440) + 22}`} tone="faint" width={1.5} />
            {ACTION_POSITIONS.map((position) => {
              const odd = position % 2 === 1;
              const gone = odd && step >= 1 && step <= 3;
              return (
                <g key={`tick-${position}`}>
                  <path
                    d={`M${xOf(position)} ${LINE_Y + 10}v${odd ? 5 : 9}`}
                    className="a-t t-faint a-stroke"
                    strokeWidth={1.5}
                    style={{ opacity: gone ? 0.2 : 1 }}
                  />
                  {odd ? null : (
                    <Label x={xOf(position)} y={LINE_Y + 32} tone="muted" size={13} mono>
                      {String(position)}
                    </Label>
                  )}
                </g>
              );
            })}

            {COLLAPSED.map((token, index) => (
              <Dot
                key={token.position}
                x={xOf(collapsed ? token.rounded : token.position)}
                y={collapsed ? LINE_Y - token.stack * PILE : LINE_Y}
                r={8}
                tone="action"
                delay={collapsed ? stagger(index, 30) : 0}
              />
            ))}

            <rect
              x={xOf(428) - 14}
              y={LINE_Y - 2 * PILE - 14}
              width={28}
              height={2 * PILE + 28}
              rx={14}
              className="a-t chip-ring"
              style={{ opacity: step === 3 ? 1 : 0 }}
            />
            <Label x={xOf(428) - 14} y={LINE_Y - 2 * PILE - 36} tone="ink" size={14} anchor="start" opacity={step === 2 ? 1 : 0}>
              427, 428 and 429 all become 428
            </Label>
            <Label x={xOf(428) - 14} y={LINE_Y - 2 * PILE - 36} tone="ink" size={14} anchor="start" opacity={step === 3 ? 1 : 0}>
              three steps, one turn
            </Label>
            <Label x={240} y={LINE_Y - 56} tone="muted" size={14} opacity={step === 1 ? 1 : 0}>
              only even places fit up here
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
