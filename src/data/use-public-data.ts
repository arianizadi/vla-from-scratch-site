"use client";

/**
 * The public data files as React state, for a figure that draws them:
 *
 *   const episodes = useGrasp(evaluation.graspFile);
 *   if (episodes.status !== "ready") return <p>{episodes.status === "error" ? "Could not load." : "Loading."}</p>;
 *   episodes.data.episodes.map(...)
 *
 * The file is requested after the figure has mounted, so the page's static
 * HTML holds the "loading" state: draw something there that already reads.
 */

import { useEffect, useState } from "react";
import { loadGrasp, loadTrace, type GraspFile, type Trace } from "./files";

export type Loaded<Data> =
  | { status: "loading" }
  | { status: "ready"; data: Data }
  | { status: "error"; error: Error };

const LOADING = { status: "loading" } as const;

function useLoaded<Data>(id: string | undefined, load: (id: string) => Promise<Data>): Loaded<Data> {
  const [answer, setAnswer] = useState<{ id: string; result: Loaded<Data> }>();

  useEffect(() => {
    if (id === undefined) return;
    let current = true;
    load(id).then(
      (data) => {
        if (current) setAnswer({ id, result: { status: "ready", data } });
      },
      (error: unknown) => {
        if (current) setAnswer({ id, result: { status: "error", error: error instanceof Error ? error : new Error(String(error)) } });
      },
    );
    return () => {
      current = false;
    };
  }, [id, load]);

  // An answer for another id is not this one's: while the new file loads, say so.
  return answer !== undefined && answer.id === id ? answer.result : LOADING;
}

/** The episodes of one evaluation; stays "loading" while `id` is undefined. */
export function useGrasp(id: string | undefined): Loaded<GraspFile> {
  return useLoaded(id, loadGrasp);
}

/** One rollout; stays "loading" while `id` is undefined. */
export function useTrace(id: string | undefined): Loaded<Trace> {
  return useLoaded(id, loadTrace);
}
