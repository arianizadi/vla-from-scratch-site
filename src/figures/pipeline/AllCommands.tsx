"use client";

import { CommandBlock } from "./CommandBlock";
import { EXTRA_COMMANDS, SCRIPTS, STATION_INDEX, STATIONS, type StationId } from "./content";

/** "1 to 3" or "6": the station numbers a script covers, as on the cards. */
function stationRange(stations: readonly StationId[]): string {
  const numbers = stations.map((id) => STATION_INDEX[id] + 1);
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  if (first === last) return `${first}`;
  return last === first + 1 ? `${first} and ${last}` : `${first} to ${last}`;
}

const nameOf = (id: StationId) => STATIONS[STATION_INDEX[id]].name;

/**
 * The whole loop as the three commands that run it, each with the stations it
 * covers and the files it writes; then the other commands, one line each. The
 * row of the station the item is at is highlighted. A list rather than a table,
 * so it reads the same at 320 px as at 960.
 */
export function AllCommands({ id, current }: { id: string; current: StationId }) {
  return (
    <section id={id} className="pl-all" aria-label="The loop as three commands, and the other commands">
      <h3 className="pl-all-heading">The loop is {SCRIPTS.length} commands</h3>
      <ol className="pl-all-list">
        {SCRIPTS.map((script) => {
          const here = script.stations.includes(current);
          return (
            <li key={script.code} className="pl-all-item" data-current={here || undefined}>
              <p className="pl-all-name">
                <span className="pl-path">{script.name}</span>
                <span className="pl-all-covers">
                  {script.stations.length > 1 ? "stations" : "station"} {stationRange(script.stations)}:{" "}
                  {script.stations.map(nameOf).join(", ")}
                  {here ? <span className="pl-all-here">, the item is at {nameOf(current)}</span> : null}
                </span>
              </p>
              <div className="pl-all-body">
                <CommandBlock command={{ label: "Run", code: script.code }} />
                <p className="pl-all-label">Writes</p>
                <ul className="pl-paths">
                  {script.writes.map((path) => (
                    <li key={path} className="pl-path pl-all-path">
                      {path}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
      <h3 className="pl-all-heading">Other commands</h3>
      <ul className="pl-all-extras">
        {EXTRA_COMMANDS.map((command) => (
          <li key={command.code} data-current={command.station === current || undefined}>
            <CommandBlock
              command={{
                label: `${STATION_INDEX[command.station] + 1}. ${nameOf(command.station)}: ${command.label}`,
                code: command.code,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
