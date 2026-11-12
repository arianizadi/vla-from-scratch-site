"use client";

import { useId } from "react";
import { Glyph } from "@/components/ui/Glyph";
import type { RunGroup } from "./model";

export interface RunSelectProps {
  groups: readonly RunGroup[];
  /** Name of the selected run. */
  value: string;
  onChange: (name: string) => void;
}

/**
 * Which run the figure draws. A native select: the kit's segments are for a
 * choice among a few, and there are more runs than fit in a row. Runs still
 * in progress are listed, disabled, so the reader sees what is coming. It is
 * styled as the other controls are (32px high, 44px on touch screens).
 */
export function RunSelect({ groups, value, onChange }: RunSelectProps) {
  const id = useId();
  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <label htmlFor={id} className="fig-label flex-none">
        Run
      </label>
      <div className="relative min-w-0 flex-1 sm:max-w-[560px]">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="block h-8 w-full min-w-0 cursor-pointer appearance-none truncate rounded-control border border-line-strong bg-surface py-0 pr-8 pl-2.5 text-14 font-medium text-ink hover:border-ink pointer-coarse:h-11"
        >
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.name} value={option.name} disabled={!option.available}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Glyph
          name="chevron"
          size={12}
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rotate-90 text-ink-muted"
        />
      </div>
    </div>
  );
}
