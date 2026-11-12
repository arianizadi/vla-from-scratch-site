"use client";

export interface ToggleProps {
  /** Visible label, also the accessible name ("Causal mask"). */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** An on/off switch: a native checkbox, so Space toggles it and it is announced as a switch. */
export function Toggle({ label, checked, onChange, disabled = false, className = "" }: ToggleProps) {
  return (
    <label className={`fig-toggle ${className}`}>
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="fig-toggle-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
