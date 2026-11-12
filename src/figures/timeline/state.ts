import { ENTRY_BY_ID, LINKS, ancestorsOf, descendantsOf } from "./entries";

/**
 * How an entry is drawn relative to the focused one: the focused entry itself,
 * the earlier work it builds on (directly or not), the later work built on it,
 * the rest; or "plain" when nothing is focused.
 */
export type EntryState = "focus" | "ancestor" | "descendant" | "other" | "plain";

/** A line on the focused entry's lineage (back or forward), off it, or plain when nothing is focused. */
export type LinkState = "lineage" | "other" | "plain";

export interface Lineage {
  ancestors: Set<string>;
  descendants: Set<string>;
  entryState: (id: string) => EntryState;
  linkState: (from: string, to: string) => LinkState;
  /** Strands the ancestors come from. */
  ancestorStrands: number;
  /** Some line on the way back to the ancestors is inferred, not stated. */
  throughInferred: boolean;
}

const EMPTY = new Set<string>();

export function lineageOf(focusId: string | null): Lineage {
  if (!focusId || !ENTRY_BY_ID.has(focusId)) {
    return {
      ancestors: EMPTY,
      descendants: EMPTY,
      entryState: () => "plain",
      linkState: () => "plain",
      ancestorStrands: 0,
      throughInferred: false,
    };
  }
  const ancestors = ancestorsOf(focusId);
  const descendants = descendantsOf(focusId);
  const back = (id: string) => id === focusId || ancestors.has(id);
  const forward = (id: string) => id === focusId || descendants.has(id);
  return {
    ancestors,
    descendants,
    entryState: (id) => (id === focusId ? "focus" : ancestors.has(id) ? "ancestor" : descendants.has(id) ? "descendant" : "other"),
    linkState: (from, to) => ((ancestors.has(from) && back(to)) || (forward(from) && descendants.has(to)) ? "lineage" : "other"),
    ancestorStrands: new Set([...ancestors].map((id) => ENTRY_BY_ID.get(id)?.strand)).size,
    throughInferred: LINKS.some((link) => link.inferred && ancestors.has(link.from) && back(link.to)),
  };
}
