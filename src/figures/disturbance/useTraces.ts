"use client";

import { useEffect, useState } from "react";
import { loadTrace, type Trace } from "@/data/files";

export interface TraceSet {
  /** The rollouts that have arrived, by id. */
  ready: Map<string, Trace>;
  /** True once every requested rollout has arrived or failed. */
  settled: boolean;
  /** True when one of them could not be loaded. */
  failed: boolean;
}

const EMPTY: TraceSet = { ready: new Map(), settled: false, failed: false };

/**
 * Several rollouts at once: every actor on one layout, so the plan can be
 * framed to hold all of them and does not rescale when the reader switches
 * actor. The files are requested after mount, and only once `enabled` (the
 * figure is near the screen); the loader caches them per page. Until they
 * arrive the set is empty and not settled.
 */
export function useTraces(ids: readonly string[], enabled = true): TraceSet {
  const key = enabled ? ids.join("|") : "";
  const [answer, setAnswer] = useState<{ key: string; set: TraceSet }>();

  useEffect(() => {
    const list = key ? key.split("|") : [];
    let current = true;
    const ready = new Map<string, Trace>();
    let pending = list.length;
    let failed = false;
    const publish = () => {
      if (current)
        setAnswer({
          key,
          set: { ready: new Map(ready), settled: pending === 0, failed },
        });
    };
    for (const id of list) {
      loadTrace(id).then(
        (trace) => {
          ready.set(id, trace);
          pending -= 1;
          publish();
        },
        () => {
          failed = true;
          pending -= 1;
          publish();
        },
      );
    }
    return () => {
      current = false;
    };
  }, [key]);

  return answer !== undefined && answer.key === key ? answer.set : EMPTY;
}
