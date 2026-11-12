/**
 * The figure kit: everything a figure is built from. Import from here.
 *
 *   import { FigureFrame, Slider, useReducedMotion, scaleLinear, Axis, type FigureProps } from "@/figures/kit";
 *
 * The contract for figure authors is in src/figures/README.md.
 */

/** The props every figure component receives. */
export interface FigureProps {
  /**
   * The chapter's sentence about the figure, as plain text. Pass it to
   * <FigureFrame caption={caption}>. Undefined when the figure is shown
   * without a caption.
   */
  caption?: string;
}

export { FigureFrame, type FigureFrameProps } from "./FigureFrame";
export { StampMark } from "./StampMark";
export { useFigureSlot, type FigureSlot } from "./slot";

export { Slider, type SliderProps } from "./controls/Slider";
export { Toggle, type ToggleProps } from "./controls/Toggle";
export { Stepper, type StepperProps } from "./controls/Stepper";
export { Segmented, type SegmentedOption, type SegmentedProps } from "./controls/Segmented";
export { PlayButton, ControlButton, type PlayButtonProps } from "./controls/PlayButton";

export {
  useReducedMotion,
  usePageVisible,
  useInView,
  useElementSize,
  chartHeight,
  type ElementSize,
  type InViewOptions,
} from "./hooks";

export { scaleLinear, niceTicks, tickStep, extent, type LinearScale, type ScaleOptions } from "./chart/scale";
export { linePath, type Curve, type LineOptions } from "./chart/line";
export { Axis, type AxisProps } from "./chart/Axis";
export { GridLines, type GridLinesProps } from "./chart/GridLines";
export { Legend, type LegendItem, type LegendProps } from "./chart/Legend";
export { Marker, type MarkerProps, type MarkerShape } from "./chart/Marker";
export {
  SERIES,
  SERIES_SHAPES,
  REFERENCE,
  OBJECT_SERIES,
  POLICY_SERIES,
  MODALITY,
  SEQUENTIAL,
  type SeriesStyle,
} from "./chart/series";

export { KitSpecimen } from "./Specimen";

export { FIGURES, STAMP_LABEL, type FigureId, type Stamp } from "../catalog";
