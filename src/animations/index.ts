/**
 * The explanation-animation kit. Import everything from "@/animations".
 * How to build one: src/animations/README.md.
 */

export { AnimationFrame, type AnimationFrameProps } from "./AnimationFrame";
export { DRAW, EASE, EASE_DRAW, HOLD, LAST_HOLD, MOVE, STAGGER, lerp, scale, shown, stagger } from "./motion";
export { type Tone } from "./primitives/shared";
export {
  Arrow,
  Box,
  Bracket,
  Cells,
  Chip,
  Dot,
  Label,
  Move,
  Path,
  type ArrowProps,
  type BoxProps,
  type BracketProps,
  type CellsProps,
  type ChipProps,
  type DotProps,
  type LabelProps,
  type MoveProps,
  type PathProps,
} from "./primitives/shapes";
export { Arm, GRIPPER_REACH, Gripper, Thing, reach, type ArmProps, type GripperProps, type ThingKind, type ThingProps } from "./primitives/robot";
export { Axes, Bar, Line, Timeline, type AxesProps, type BarProps, type LineProps, type TimelineProps } from "./primitives/chart";
