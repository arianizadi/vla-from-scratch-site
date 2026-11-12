"use client";

import { useEffect, useState } from "react";

/**
 * True once a measured width has held for a frame. A drawing turns its
 * transitions on only then, so the first measurement and every resize move
 * the crosshair and the grippers into place at once, and only a change of the
 * offset, made while the width stays put, is animated.
 */
export function useSettledWidth(width: number): boolean {
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    if (width === 0) return;
    const frame = requestAnimationFrame(() => setSettled(width));
    return () => cancelAnimationFrame(frame);
  }, [width]);
  return width > 0 && settled === width;
}
