"use client";

import { useId } from "react";
import { Glyph } from "@/components/ui/Glyph";
import type { TraceInfo } from "@/data/files";
import { actorOptions, actorWords, conditionKey, conditionOptions, layoutLabel, layoutOptions } from "./model";

export interface RolloutPickerProps {
  list: TraceInfo[];
  /** The rollout shown. */
  value: TraceInfo;
  onChange: (id: string) => void;
}

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** A native select, styled as the kit's controls (32 px, 44 px on touch screens). */
function Select({ label, value, options, onChange }: SelectProps) {
  const id = useId();
  return (
    <div className="ar-select">
      <label htmlFor={id} className="fig-label">
        {label}
      </label>
      <span className="ar-select-box">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Glyph name="chevron" size={12} className="ar-select-chevron" />
      </span>
    </div>
  );
}

/**
 * Every published rollout, by conditions, actor and layout. The lists come
 * from the index: a condition or an actor added to the data appears here.
 * Changing the conditions or the actor keeps the layout when it exists.
 */
export function RolloutPicker({ list, value, onChange }: RolloutPickerProps) {
  const condition = conditionKey(value);
  const conditions = conditionOptions(list);
  const actors = actorOptions(list, condition);
  const layouts = layoutOptions(list, condition, value.actor);

  const choose = (nextCondition: string, nextActor: string, episode: number) => {
    const actorList = actorOptions(list, nextCondition);
    const actor = actorList.includes(nextActor) ? nextActor : actorList[0];
    if (actor === undefined) return;
    const options = layoutOptions(list, nextCondition, actor);
    const pick = options.find((option) => option.episode === episode) ?? options[0];
    if (pick) onChange(pick.id);
  };

  return (
    <div className="ar-picker">
      <Select
        label="Conditions"
        value={condition}
        options={conditions.map((option) => ({ value: option.key, label: option.label }))}
        onChange={(next) => choose(next, value.actor, value.episode)}
      />
      <Select
        label="Who acted"
        value={value.actor}
        options={actors.map((actor) => ({ value: actor, label: actorWords(actor) }))}
        onChange={(next) => choose(condition, next, value.episode)}
      />
      <Select
        label="Layout"
        value={value.id}
        options={layouts.map((option) => ({ value: option.id, label: layoutLabel(option) }))}
        onChange={onChange}
      />
    </div>
  );
}
