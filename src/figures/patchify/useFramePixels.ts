"use client";

import { useEffect, useState } from "react";
import { findObjects, type ObjectMask } from "./segment";

export interface FramePixels {
  /** Side of the frame in pixels. */
  size: number;
  /** RGBA, row by row. */
  data: Uint8ClampedArray;
  /** The objects found in it by colour. */
  objects: ObjectMask[];
}

export type FrameState = { status: "loading" } | { status: "ready"; pixels: FramePixels } | { status: "error" };

const LOADING: FrameState = { status: "loading" };

/**
 * The pixels of a camera frame of this site, read in the browser after the
 * figure has mounted (the static HTML shows the frame as an image, without
 * them). Each frame is read once per figure; switching back is instant.
 */
export function useFramePixels(src: string): FrameState {
  const [read, setRead] = useState<Record<string, FrameState>>({});
  const known = read[src];

  useEffect(() => {
    if (known) return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      try {
        const size = Math.min(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("no 2d context");
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, size, size);
        const pixels: FramePixels = { size, data, objects: findObjects(data, size) };
        setRead((previous) => ({ ...previous, [src]: { status: "ready", pixels } }));
      } catch {
        setRead((previous) => ({ ...previous, [src]: { status: "error" } }));
      }
    };
    image.onerror = () => {
      if (!cancelled) setRead((previous) => ({ ...previous, [src]: { status: "error" } }));
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, known]);

  return known ?? LOADING;
}
