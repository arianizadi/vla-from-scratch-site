"use client";

/**
 * Figure id -> component. Every id in catalog.ts (the table in the tutorial's
 * STYLE.md) has a folder, src/figures/<id>/, whose index.tsx default-exports a
 * client component taking FigureProps. The type below fails the build if an id
 * has no entry.
 *
 * The components are loaded lazily: a figure's code is in its own chunk,
 * fetched only by pages that show the figure. It is still drawn at build time,
 * so the static HTML of a chapter contains the figure. No `loading` fallback is
 * given on purpose: with one, the static HTML would hold the fallback and the
 * figure would be swapped in by a script.
 *
 * To build a figure, replace the contents of its folder. This file does not
 * change. (The import() calls are written out one by one because the bundler
 * has to see each path.)
 */

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { FigureId } from "./catalog";
import type { FigureProps } from "./kit";

export const FIGURE_COMPONENTS: Record<FigureId, ComponentType<FigureProps>> = {
  pipeline: dynamic(() => import("./pipeline")),
  tokenizer: dynamic(() => import("./tokenizer")),
  "padding-shift": dynamic(() => import("./padding-shift")),
  attention: dynamic(() => import("./attention")),
  rotary: dynamic(() => import("./rotary")),
  "training-step": dynamic(() => import("./training-step")),
  "loss-vs-success": dynamic(() => import("./loss-vs-success")),
  patchify: dynamic(() => import("./patchify")),
  "pooled-vs-tokens": dynamic(() => import("./pooled-vs-tokens")),
  "sequence-layout": dynamic(() => import("./sequence-layout")),
  "flow-matching": dynamic(() => import("./flow-matching")),
  "action-chunks": dynamic(() => import("./action-chunks")),
  copycat: dynamic(() => import("./copycat")),
  "grasp-map": dynamic(() => import("./grasp-map")),
  tolerance: dynamic(() => import("./tolerance")),
  "arm-replay": dynamic(() => import("./arm-replay")),
  timeline: dynamic(() => import("./timeline")),
  onset: dynamic(() => import("./onset")),
  disturbance: dynamic(() => import("./disturbance")),
};
