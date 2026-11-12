"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/**
 * True when the reader asked for reduced motion. A figure then shows its
 * finished state, never plays by itself, and keeps every control working
 * (a step or a slider changes the drawing at once, without a transition).
 *
 * The server renders as if motion were allowed; the value is corrected right
 * after hydration, before any effect runs.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

function subscribeToVisibility(callback: () => void): () => void {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

/** False while the tab is in the background. Timelines pause then. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  );
}

export interface InViewOptions {
  /**
   * Share of the element that must be on screen, 0 to 1. For an element taller
   * than the screen it is the share of the screen the element covers.
   * Default 0.25: below that, timelines pause.
   */
  amount?: number;
  /** Grows or shrinks the screen edge, as in CSS margin ("200px 0px"). */
  margin?: string;
  /** Stay true after the first time the element was in view. */
  once?: boolean;
}

const THRESHOLDS = Array.from({ length: 21 }, (_, index) => index / 20);

/**
 * Whether the element is on screen. Use it to start a timeline when the figure
 * arrives (amount 0.6) and to pause it when the figure leaves (amount 0.25).
 * False on the server and until the first observation.
 */
export function useInView<T extends Element>(ref: RefObject<T | null>, options: InViewOptions = {}): boolean {
  const { amount = 0.25, margin = "0px", once = false } = options;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const full = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? Infinity) || 1;
        const visible = entry.isIntersecting && entry.intersectionRect.height / full >= amount;
        setInView(visible);
        if (visible && once) observer.disconnect();
      },
      { rootMargin: margin, threshold: THRESHOLDS },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, amount, margin, once]);

  return inView;
}

export interface ElementSize {
  width: number;
  height: number;
}

const NO_SIZE: ElementSize = { width: 0, height: 0 };

/**
 * The element's content box in CSS pixels, kept up to date as it resizes.
 * { width: 0, height: 0 } on the server and until the first measurement, so
 * draw from a viewBox or a sensible default until width is known.
 */
export function useElementSize<T extends Element>(ref: RefObject<T | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>(NO_SIZE);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
