"use client";

import { useEffect, useRef } from "react";

const HEADER_HEIGHT = 56;

/**
 * A 2px line under the header that fills as the element with `targetId`
 * scrolls past. Decorative: the sidebar's current section is the accessible
 * statement of position. Only a transform changes, so nothing reflows.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    const element = bar.current;
    if (!target || !element) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const distance = rect.height - window.innerHeight + HEADER_HEIGHT;
      const travelled = HEADER_HEIGHT - rect.top;
      const progress = distance > 0 ? Math.min(1, Math.max(0, travelled / distance)) : 1;
      element.style.transform = `scaleX(${progress})`;
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
  }, [targetId]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-[55px] z-50 h-0.5">
      <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
