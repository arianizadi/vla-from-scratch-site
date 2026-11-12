"use client";

import { useId } from "react";
import type { Trace } from "@/data/files";
import { formatCount } from "@/data/format";
import { Glyph } from "@/components/ui/Glyph";
import { Thumbnail } from "./Plan";
import { GROUP_HEADING, GROUP_ORDER, type Actor, type Bounds, type DisturbanceOption } from "./model";

export interface ActorListProps {
  actors: readonly Actor[];
  option: DisturbanceOption;
  episode: number;
  /** Words of the actor shown on the plan. */
  value: string;
  onChange: (words: string) => void;
  /** The rollouts loaded so far, by id, for the thumbnails. */
  loaded: Map<string, Trace>;
  bounds: Bounds | null;
  thumbnail: number;
  /** Rows side by side, when the list spans a wide stage. */
  columns?: 1 | 2;
}

const sentenceCase = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const times = (count: number) => (count === 1 ? "once" : count === 2 ? "twice" : `${count} times`);

/**
 * Who acts: a radio group, one row per actor, grouped by how it came by its
 * behaviour. Each row is also the comparison: a small plan of its rollout on
 * the same layout under the same disturbance, whether it lifted the object
 * there, and what the notebook reports over the whole evaluation.
 */
export function ActorList({
  actors,
  option,
  episode,
  value,
  onChange,
  loaded,
  bounds,
  thumbnail,
  columns = 1,
}: ActorListProps) {
  const name = useId();
  const groups = GROUP_ORDER.map((group) => ({
    group,
    actors: actors.filter((actor) => actor.group === group),
  })).filter((entry) => entry.actors.length > 0);

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="fig-label mb-1 p-0">Who acts, on layout {episode + 1}</legend>
      <div className="flex flex-col gap-3">
        {groups.map(({ group, actors: members }) => (
          <div key={group} className="flex flex-col gap-1">
            <p className="m-0 text-13 font-medium text-ink-faint [font-stretch:88%]">
              {members.length === 1 ? GROUP_HEADING[group].one : GROUP_HEADING[group].many}
            </p>
            <div className={columns === 2 ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"}>
              {members.map((actor) => {
                const under = option.actors.get(actor.words);
                const info = under?.traces.find((entry) => entry.episode === episode);
                const trace = info ? loaded.get(info.id) : undefined;
                const disabled = !info;
                const selected = actor.words === value && !disabled;
                const reported = under?.reported ?? null;
                return (
                  <label
                    key={actor.words}
                    className={`flex min-w-0 items-start gap-2.5 rounded-control border p-2 ${
                      selected
                        ? "border-accent bg-accent-soft shadow-[inset_3px_0_0_var(--accent)]"
                        : disabled
                          ? "border-dashed border-line"
                          : "border-line hover:border-line-strong"
                    } ${disabled ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={actor.words}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onChange(actor.words)}
                      className="mt-0.5 size-4 flex-none cursor-[inherit] accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    {trace && bounds ? (
                      <Thumbnail trace={trace} bounds={bounds} size={thumbnail} />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`block flex-none rounded-plate border border-line ${disabled ? "border-dashed" : "bg-surface-2"}`}
                        style={{ width: thumbnail, height: thumbnail }}
                      />
                    )}
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className={`text-14 font-semibold ${disabled ? "text-ink-muted" : "text-ink"}`}>
                        {sentenceCase(actor.words)}
                      </span>
                      <span className="text-13 text-ink-faint [font-stretch:88%]">{actor.recipe}</span>
                      {info ? (
                        <span className="text-13 text-ink">
                          <Glyph
                            name={info.success ? "check" : "cross"}
                            size={11}
                            className={`inline-block align-[-1px] ${info.success ? "text-success" : "text-failure"}`}
                          />{" "}
                          {info.success ? "lifted" : "not lifted"}
                          {info.closes > 0 ? `, closed ${times(info.closes)}` : ", never closed"}
                        </span>
                      ) : (
                        <span className="text-13 text-ink-muted">
                          {under ? "No rollout on this layout" : "No rollouts under this disturbance"}
                        </span>
                      )}
                      {under ? (
                        <span className="text-13 text-ink-muted">
                          {reported
                            ? `Evaluation: ${formatCount(reported.successes, reported.episodes)} lifted`
                            : "No evaluation reported under these conditions"}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
