"use client";

import type { CSSProperties } from "react";
import { Glyph } from "@/components/ui/Glyph";

export interface StepperProps {
  /** What is stepped through, singular and lower case: "step", "merge", "chunk". */
  label: string;
  /** The current position. */
  value: number;
  /** First position. Default 0. */
  min?: number;
  /** Last position. */
  max: number;
  onChange: (value: number) => void;
  /** Text between the buttons. Default "Step 3 of 10", from the label. */
  format?: (value: number, max: number) => string;
  className?: string;
}

/**
 * Previous and Next around the current position. At either end the button
 * stays focusable and is announced as unavailable, so keyboard focus is never
 * lost by stepping to the end.
 */
export function Stepper({ label, value, min = 0, max, onChange, format, className = "" }: StepperProps) {
  const name = label.charAt(0).toUpperCase() + label.slice(1);
  const read = format ?? ((position: number, last: number) => `${name} ${position} of ${last}`);
  const text = read(value, max);
  // As wide as the longest text, so the buttons do not move while stepping.
  const widest = Math.max(read(min, max).length, read(max, max).length, text.length);
  const style = { "--value-width": `${widest}ch` } as CSSProperties;
  const atStart = value <= min;
  const atEnd = value >= max;

  return (
    <div role="group" aria-label={`${label} controls`} className={`fig-stepper ${className}`} style={style}>
      <button
        type="button"
        aria-label={`Previous ${label}`}
        aria-disabled={atStart}
        onClick={() => {
          if (!atStart) onChange(value - 1);
        }}
      >
        <Glyph name="chevron-left" size={14} />
      </button>
      <output>{text}</output>
      <button
        type="button"
        aria-label={`Next ${label}`}
        aria-disabled={atEnd}
        onClick={() => {
          if (!atEnd) onChange(value + 1);
        }}
      >
        <Glyph name="chevron" size={14} />
      </button>
    </div>
  );
}
