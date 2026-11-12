"use client";

import { useId, type CSSProperties } from "react";

export interface SliderProps {
  /** Visible label, also the accessible name ("Flow steps"). */
  label: string;
  value: number;
  min: number;
  max: number;
  /** Default 1. */
  step?: number;
  onChange: (value: number) => void;
  /** How the value reads next to the slider and to a screen reader: (v) => `${v} mm`. */
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

/**
 * A native range input with its label and a live value. Arrow keys move one
 * step, Page Up and Page Down move further, Home and End jump to the ends.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
  disabled = false,
  className = "",
}: SliderProps) {
  const id = useId();
  const text = format(value);
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  // The value column is as wide as its longest text, so the track does not move while dragging.
  const width = Math.max(format(min).length, format(max).length, text.length);
  const style = { "--fill": `${fill}%`, "--value-width": `${width}ch` } as CSSProperties;

  return (
    <div className={`fig-slider ${className}`} style={style}>
      <label htmlFor={id} className="fig-label">
        {label}
      </label>
      <input
        id={id}
        type="range"
        className="fig-range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={text}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {/* The input announces the value itself (aria-valuetext); this copy is for the eye. */}
      <span className="fig-slider-value" aria-hidden="true">
        {text}
      </span>
    </div>
  );
}
