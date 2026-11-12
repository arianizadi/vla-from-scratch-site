"use client";

/**
 * A box that scrolls sideways when its content is wider than it: tables on
 * chapter pages, the notes and the lab. While the content fits, the box is a
 * plain block: no tab stop, no landmark, no name. When it overflows, it
 * becomes a focusable, named group, so a keyboard can scroll it, and a fade at
 * the edge says there is more to the right until the reader gets there.
 *
 * The static HTML renders the quiet form; the first effect measures.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ScrollBox({
  label,
  className = "",
  children,
}: {
  /** Names the box while it scrolls ("Datasets, scrolls sideways"). */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => {
      const wider = element.scrollWidth > element.clientWidth + 1;
      setOverflow(wider);
      setMore(wider && element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    element.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, []);

  return (
    <div className={`table-frame ${className}`}>
      <div
        ref={box}
        className="table-scroll"
        role={overflow ? "group" : undefined}
        aria-label={overflow ? `${label}, scrolls sideways` : undefined}
        tabIndex={overflow ? 0 : undefined}
      >
        {children}
      </div>
      <span className="table-hint" data-shown={more ? "" : undefined} aria-hidden="true" />
    </div>
  );
}
