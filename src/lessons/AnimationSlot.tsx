import type { ComponentType } from "react";
import { isAnimationMarker, type AnimationMarker } from "./define";
import { LessonAnimation } from "./LessonAnimation";

/**
 * Draws a beat's or a math entry's animation. Authors write a component;
 * lessons read through src/lessons/index.ts carry a marker instead
 * (scripts/lesson-data-loader.cjs), drawn by <LessonAnimation>, which loads
 * only that animation's code.
 */
export function AnimationSlot({ animation }: { animation: ComponentType | AnimationMarker }) {
  if (isAnimationMarker(animation)) return <LessonAnimation id={animation.__animation} />;
  const Animation = animation;
  return <Animation />;
}
