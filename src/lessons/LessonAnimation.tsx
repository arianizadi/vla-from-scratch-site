"use client";

/**
 * Renders one lesson animation by its id ("10-tokens/animations/TokensToIds#TokensToIds"),
 * loading only that animation's code. The server renders it in full (the still
 * frame is in the static HTML); in the browser its chunk loads on its own and
 * the drawing hydrates when it arrives, so a page ships the animations it shows
 * and no others. See scripts/lesson-data-loader.cjs for where the ids come from.
 */

import { createElement, Suspense, use, type ComponentType } from "react";
import { ANIMATIONS } from "./generated/animations";

const loaded = new Map<string, Promise<ComponentType>>();

function loadAnimation(id: string): Promise<ComponentType> {
  const cached = loaded.get(id);
  if (cached) return cached;
  const [file, name] = id.split("#");
  const load = ANIMATIONS[file];
  const promise = (async () => {
    if (!load) throw new Error(`No animation src/lessons/${file}.tsx in the registry; run node scripts/gen-animation-registry.mjs`);
    const exports = await load();
    const found = exports[name];
    if (typeof found !== "function" && typeof found !== "object") throw new Error(`src/lessons/${file}.tsx has no export ${name}`);
    return found as ComponentType;
  })();
  loaded.set(id, promise);
  return promise;
}

function Loaded({ id }: { id: string }) {
  return createElement(use(loadAnimation(id)));
}

export function LessonAnimation({ id }: { id: string }) {
  return (
    <Suspense fallback={null}>
      <Loaded id={id} />
    </Suspense>
  );
}
