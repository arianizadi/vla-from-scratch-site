/**
 * What the plan views may draw. Two sizes are stated in the text of the
 * chapter "What an Action Is": the cube's collision box is 45 mm wide and the
 * open fingers span 80 mm. They are geometry, not measurements. No source the
 * site may quote gives the size of the other three objects, so only the cube
 * is drawn to scale; the others are outlines drawn at the cube's width and
 * say so. The lab notebook says the can's and the hex nut's collision shapes
 * are cylinders, so both are drawn as circles in plan.
 */

import type { ObjectId } from "@/data/types";
import { OBJECT_LINES } from "./model";

/** The chapter the two sizes come from, by title: chapter numbers change, titles rarely do. */
export const GEOMETRY_SOURCE = "What an Action Is";
export const CUBE_WIDTH_MM = 45;
export const FINGER_SPAN_MM = 80;

export type PlanKind = "box" | "cylinder" | "tee";

export interface PlanShape {
  /** The outline in plan: the collision shape where a source names it. */
  kind: PlanKind;
  /** Drawn to the scale of the fingers. Only the cube's size is known. */
  toScale: boolean;
  /** The words under the drawing that say what it is. */
  tag: string;
}

export const PLAN_SHAPES: Record<ObjectId, PlanShape> = {
  cube: { kind: "box", toScale: true, tag: "Collision box, to scale." },
  hex: { kind: "cylinder", toScale: false, tag: "Collision shape: cylinder. Size not given." },
  can: { kind: "cylinder", toScale: false, tag: "Collision shape: cylinder. Size not given." },
  tblock: { kind: "tee", toScale: false, tag: "Outline only. Size not given." },
};

/** The objects whose collision shape is a cylinder, in the figure's order. */
export const CYLINDERS = OBJECT_LINES.filter((object) => PLAN_SHAPES[object.id].kind === "cylinder");
