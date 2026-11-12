"use client";

import { Glyph } from "@/components/ui/Glyph";
import { CommandBlock } from "./CommandBlock";
import type { Part, Station } from "./content";

function PartChip({ part }: { part: Part }) {
  const classes = ["pl-part", part.modality === "plain" ? "" : `pl-${part.modality}`, part.unused ? "pl-unused" : ""];
  return (
    <li className={classes.join(" ")}>
      {part.modality === "success" ? <Glyph name="check" size={12} /> : null}
      {part.modality === "failure" ? <Glyph name="cross" size={12} /> : null}
      {part.unused ? (
        <>
          <s>{part.label}</s>
          <span className="pl-unused-word">unused</span>
        </>
      ) : (
        part.label
      )}
    </li>
  );
}

export interface DetailsProps {
  id: string;
  station: Station;
  number: number;
  /** Drawn but not shown: in the wide layout it keeps its place, so the stack is as tall as its tallest panel. */
  hidden?: boolean;
  /** The command, the files and the longer description are shown. */
  open: boolean;
  onToggle: () => void;
}

/**
 * The station the item is at. Always shown: its name and what the item holds
 * there. On demand: what happens there, the command that runs it and the files
 * it writes, so that while the item moves the controls stay close to the loop.
 */
export function Details({ id, station, number, hidden = false, open, onToggle }: DetailsProps) {
  const headingId = `${id}-heading`;
  const moreId = `${id}-more`;
  return (
    <section
      id={id}
      className="pl-details"
      aria-labelledby={headingId}
      data-hidden={hidden || undefined}
      data-open={open || undefined}
      aria-hidden={hidden || undefined}
    >
      <div className="pl-details-head">
        <h3 id={headingId} className="pl-details-title">
          {number}. {station.name}
        </h3>
        <span className="pl-details-kind">
          {station.kind === "program" ? "a program" : "files on disk"}, <span className="pl-path">{station.tag}</span>
        </span>
      </div>

      {station.parts ? (
        <dl className="pl-groups">
          {station.parts.map((group) => (
            <div key={group.label} className="pl-group">
              <dt>{group.label}</dt>
              <dd>
                <ul className="pl-parts">
                  {group.parts.map((part) => (
                    <PartChip key={part.label} part={part} />
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <button
        type="button"
        className="pl-more-toggle"
        aria-expanded={open}
        aria-controls={moreId}
        onClick={onToggle}
      >
        <Glyph name="chevron" size={12} className="pl-more-chevron" />
        {open ? (
          "Hide the details"
        ) : (
          <span>
            <span className="pl-more-where">
              {number}. {station.name}:{" "}
            </span>
            Command, files and more
          </span>
        )}
      </button>

      <div id={moreId} className="pl-more" hidden={!open}>
        <p className="pl-summary">{station.summary}</p>

        <dl className="pl-facts">
          <dt>Runs in</dt>
          <dd>{station.runs}</dd>

          <dt>{station.commands.length > 1 ? "Commands" : "Command"}</dt>
          <dd className="pl-commands">
            {station.commands.map((command) => (
              <CommandBlock key={command.code} command={command} />
            ))}
          </dd>

          {station.options ? (
            <>
              <dt>Options</dt>
              <dd>
                {station.optionsNote ? <p className="pl-path-note pl-options-note">{station.optionsNote}</p> : null}
                <dl className="pl-options">
                  {station.options.map((option) => (
                    <div key={option.flag} className="pl-option">
                      <dt className="pl-path">{option.flag}</dt>
                      <dd>{option.purpose}</dd>
                    </div>
                  ))}
                </dl>
              </dd>
            </>
          ) : null}

          <dt>Writes</dt>
          <dd>
            <ul className="pl-paths">
              {station.writes.map((path) => (
                <li key={path} className="pl-path">
                  {path}
                </li>
              ))}
            </ul>
            {station.writesNote ? <p className="pl-path-note">{station.writesNote}</p> : null}
          </dd>
        </dl>
      </div>
    </section>
  );
}
