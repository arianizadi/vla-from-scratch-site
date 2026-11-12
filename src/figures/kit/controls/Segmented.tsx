"use client";

import { useId } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  /** Names the group ("Policy"). Read by screen readers; shown when `showLabel` is set. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Print the label in front of the segments. */
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * A choice of one among a few, drawn as joined segments. It is a native radio
 * group: Tab reaches the selected segment, the arrow keys move the selection.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  showLabel = false,
  disabled = false,
  className = "",
}: SegmentedProps<T>) {
  const name = useId();
  const labelId = `${name}-label`;

  return (
    <div className={`fig-field ${className}`}>
      <span id={labelId} className={showLabel ? "fig-label" : "sr-only"}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="segments">
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option.value === value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            <span className="segment">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
