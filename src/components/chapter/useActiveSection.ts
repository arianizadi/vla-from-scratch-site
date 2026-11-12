"use client";

import { useEffect, useState } from "react";

/**
 * Distance from the top of the viewport at which a heading counts as reached:
 * the sticky header (56px), the headings' scroll-margin-top (80px) and some
 * slack, so a heading a link has just scrolled to is already the current one.
 */
const REACHED_AT = 160;

/**
 * The id of the last section heading scrolled past, or undefined above the
 * first one. `ids` are element ids in document order.
 */
export function useActiveSection(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined);
  const key = ids.join("\n");

  useEffect(() => {
    const elements = key
      .split("\n")
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | undefined;
      for (const element of elements) {
        if (element.getBoundingClientRect().top > REACHED_AT) break;
        current = element.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key]);

  return active;
}
