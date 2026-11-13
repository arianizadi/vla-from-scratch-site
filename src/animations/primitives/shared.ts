import type { CSSProperties } from "react";

/**
 * What a shape stands for, as a colour. Use the modality tones for the thing a
 * shape is made of (a word is `language`, an image patch `vision`, an action
 * `action`); `mark` means "this one, now"; `accent` is for the one shape the
 * reader should follow when no modality applies. Everything else is ink.
 */
export type Tone =
  | "ink"
  | "muted"
  | "faint"
  | "language"
  | "vision"
  | "action"
  | "accent"
  | "mark"
  | "success"
  | "failure";

export function toneClass(tone: Tone): string {
  return `t-${tone}`;
}

export interface Animated {
  /** 0 hides the shape (it fades), 1 shows it. Default 1. */
  opacity?: number;
  /** Wait this long before moving, ms: use stagger(i) from motion.ts. */
  delay?: number;
  /**
   * Pop in when the shape first appears (mounts). Use it for a shape that a
   * step creates, such as the token a merge makes; a shape that is always
   * there fades in with `opacity` instead.
   */
  enter?: boolean;
}

/** Inline style of an element that moves to (x, y) with the frame's transition. */
export function at(x: number, y: number, extra: { opacity?: number; delay?: number; scale?: number; rotate?: number } = {}): CSSProperties {
  const parts = [`translate(${round(x)}px, ${round(y)}px)`];
  if (extra.rotate) parts.push(`rotate(${round(extra.rotate)}deg)`);
  if (extra.scale !== undefined && extra.scale !== 1) parts.push(`scale(${round(extra.scale)})`);
  return {
    transform: parts.join(" "),
    opacity: extra.opacity ?? 1,
    transitionDelay: extra.delay ? `${Math.round(extra.delay)}ms` : undefined,
    animationDelay: extra.delay ? `${Math.round(extra.delay)}ms` : undefined,
  };
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Rough width of a text run in SVG units, for sizing chips around it. */
export function textWidth(text: string, size: number, mono: boolean): number {
  return text.length * size * (mono ? 0.6 : 0.56);
}
