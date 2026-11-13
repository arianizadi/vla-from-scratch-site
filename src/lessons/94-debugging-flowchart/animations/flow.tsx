import type { ReactNode } from "react";
import { Arrow, Box, Label } from "@/animations";

/**
 * The debugging path drawn once and shared by this lesson's animations: five
 * questions top to bottom, each "no" leaving to the right toward a likely
 * cause, and the last "yes" ending at the grasp itself.
 */
export const QUESTIONS = [
  { ask: "Does the expert pass?", cause: "the test itself" },
  { ask: "Does it copy the expert?", cause: "training or inputs" },
  { ask: "Does the gripper close?", cause: "the motion" },
  { ask: "At the named object?", cause: "not looking" },
  { ask: "Close enough to grasp?", cause: "precision" },
];
export const Q_X = 146;
export const Q_W = 236;
export const EXIT_X = 400;
export const EXIT_W = 140;
export const rowY = (i: number) => 40 + i * 62;
export const LEAF_Y = rowY(5) - 6;
export const FLOW_SIZE: [number, number] = [480, 378];

export interface FlowProps {
  /** Question being asked now (0-4), 5 for the bottom leaf, or "exit-<i>" for a cause. */
  at: number | `exit-${number}`;
  /** Which causes are drawn. */
  exits: boolean[];
  /** Show the bottom leaf. */
  leaf: boolean;
  /** Text beside each "yes" arrow; default "yes". */
  yes?: (string | undefined)[];
  /** Questions answered so far are drawn solid; the rest faint. */
  reached?: number;
  children?: ReactNode;
}

export function Flow({ at, exits, leaf, yes = [], reached = 5, children }: FlowProps) {
  const exitAt = typeof at === "string" ? Number(at.slice(5)) : -1;
  const tokenX = exitAt >= 0 ? EXIT_X - EXIT_W / 2 - 14 : Q_X - Q_W / 2 - 14;
  const tokenY = exitAt >= 0 ? rowY(exitAt) : typeof at === "number" && at === 5 ? LEAF_Y : rowY(typeof at === "number" ? at : 0);
  return (
    <>
      {QUESTIONS.map((q, i) => {
        const y = rowY(i);
        const now = at === i;
        return (
          <g key={q.ask}>
            <Box x={Q_X} y={y} w={Q_W} h={40} label={q.ask} tone={i <= reached ? "ink" : "faint"} active={now} />
            <Arrow
              from={[Q_X, y + 22]}
              to={[Q_X, (i === 4 ? LEAF_Y : rowY(i + 1)) - 22]}
              tone="faint"
              width={1.5}
              drawn={i < 4 || leaf}
            />
            <Label x={Q_X + 12} y={y + 31} tone="muted" size={13} anchor="start" opacity={i < reached || (i === 4 && leaf) ? 1 : 0}>
              {yes[i] ?? "yes"}
            </Label>
            <Arrow from={[Q_X + Q_W / 2 + 4, y]} to={[EXIT_X - EXIT_W / 2 - 4, y]} tone={exitAt === i ? "failure" : "faint"} width={1.5} drawn={exits[i]} />
            <Label x={(Q_X + Q_W / 2 + EXIT_X - EXIT_W / 2) / 2} y={y - 12} tone="muted" size={13} opacity={exits[i] ? 1 : 0}>
              no
            </Label>
            <Box x={EXIT_X} y={y} w={EXIT_W} h={36} label={q.cause} tone={exitAt === i ? "failure" : "accent"} filled={exitAt === i} opacity={exits[i] ? 1 : 0} />
          </g>
        );
      })}
      <Box x={Q_X} y={LEAF_Y} w={Q_W} h={36} label="the grasp itself" tone="accent" opacity={leaf ? 1 : 0} />

      {/* Where we are: a highlighter dot that walks the path. */}
      <g className="a-t t-mark" style={{ transform: `translate(${tokenX}px, ${tokenY}px)` }}>
        <circle r={8} className="a-fill a-stroke" strokeWidth={2} />
      </g>
      {children}
    </>
  );
}
