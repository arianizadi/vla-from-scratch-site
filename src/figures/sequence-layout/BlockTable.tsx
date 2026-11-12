"use client";

import { blockNote } from "./layout";
import { formatCount, type Panel } from "./model";

function range(start: number, n: number): string {
  return n === 1 ? String(start) : `${start}–${start + n - 1}`;
}

/** The blocks of each sequence as rows: positions, part, block, tokens. */
export function BlockTable({ panels }: { panels: Panel[] }) {
  return (
    <div className="sl-tables">
      {panels.map((panel) => (
        <div key={panel.id} className="sl-table-wrap">
          <table className="sl-table">
            <caption>
              {panel.title}: {formatCount(panel.total)} tokens,{" "}
              <code>{panel.shape}</code>
            </caption>
            <thead>
              <tr>
                <th scope="col">Positions</th>
                <th scope="col">Part</th>
                <th scope="col">Block</th>
                <th scope="col" className="sl-num">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody>
              {panel.blocks.map((block) => (
                <tr key={block.key}>
                  <td className="sl-num-cell">{range(block.start, block.n)}</td>
                  <td>{panel.parts[block.part].label}</td>
                  <td>
                    {block.label}
                    {block.note ? (
                      <span className="sl-table-note">
                        , {blockNote(block)}
                      </span>
                    ) : null}
                  </td>
                  <td className="sl-num">{formatCount(block.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
