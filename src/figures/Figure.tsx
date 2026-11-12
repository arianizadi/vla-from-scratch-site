import type { ReactNode } from "react";
import { isFigureId } from "./catalog";
import { FigureMount } from "./FigureMount";
import { FigureFrame } from "./kit/FigureFrame";

export interface FigureEmbedProps {
  /** One of the ids in tutorial/STYLE.md ("flow-matching"). */
  id: string;
  /** The chapter's description of the figure, as plain text. */
  caption: string;
  /** Figure number within the chapter ("41.2"). */
  number?: string;
  /** The description with its inline formatting, when the chapter has any. */
  children?: ReactNode;
}

function hasContent(node: ReactNode): boolean {
  return Array.isArray(node) ? node.length > 0 : node !== undefined && node !== null && node !== "";
}

/**
 * An interactive figure named in a chapter with
 *   <!-- interactive: some-id -->
 *   *Figure: description.*
 * The id picks the component (registry.ts). An id that is not in the list is
 * shown as an empty frame with the chapter's description, so the page still
 * reads.
 */
export function Figure({ id, caption, number, children }: FigureEmbedProps) {
  const anchor = number ? `fig-${number.replace(".", "-")}` : undefined;
  const formatted = hasContent(children) ? children : undefined;

  if (isFigureId(id)) {
    return (
      <FigureMount id={id} caption={caption || undefined} number={number} anchor={anchor}>
        {formatted}
      </FigureMount>
    );
  }

  return (
    <FigureFrame id={anchor} number={number} title="Figure" stamp="schematic" caption={formatted ?? caption}>
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center sm:min-h-[280px]">
        <code>{id}</code>
        <p className="max-w-[420px] text-ink-muted">
          This figure id is not in the list of figures. The description below stands in for it.
        </p>
      </div>
    </FigureFrame>
  );
}
