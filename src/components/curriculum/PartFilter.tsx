"use client";

/**
 * The /learn filter by part (DESIGN.md, section 5): "All parts" or one part,
 * as joined segments. The static HTML lists every part; the filter hides the
 * others once the reader picks one. The parts come from the chapter files.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Segmented } from "@/figures/kit";

interface PartInfo {
  id: string;
  number: number;
  name: string;
}

const ALL = "all";

export function PartFilter({ parts, children }: { parts: PartInfo[]; children: ReactNode }) {
  const [shown, setShown] = useState<string>(ALL);
  const list = useRef<HTMLDivElement>(null);

  // Each part is a <section id=...> child of the list; hide the ones not picked.
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    for (const section of element.querySelectorAll<HTMLElement>(":scope > section[id]")) {
      section.hidden = shown !== ALL && section.id !== shown;
    }
  }, [shown]);

  // A link to a part that is filtered out (the sidebar, another page) shows every part again.
  useEffect(() => {
    const reveal = () => {
      const target = window.location.hash.slice(1);
      if (!target) return;
      const section = list.current?.querySelector<HTMLElement>(`:scope > section[id="${CSS.escape(target)}"]`);
      if (section?.hidden) {
        setShown(ALL);
        requestAnimationFrame(() => section.scrollIntoView());
      }
    };
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);

  return (
    <div className="grid max-w-[960px] gap-8">
      {parts.length > 1 ? (
        <Segmented
          label="Show"
          showLabel
          className="part-filter"
          value={shown}
          onChange={setShown}
          options={[{ value: ALL, label: "All parts" }, ...parts.map((part) => ({ value: part.id, label: `${part.number} ${part.name}` }))]}
        />
      ) : null}
      <div ref={list} className="grid gap-14">
        {children}
      </div>
    </div>
  );
}
