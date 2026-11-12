/**
 * The colour and marker of a run in a lab chart: its policy's, from the kit's
 * POLICY_SERIES, keyed on the run's design (never on its place in a list), so
 * a policy looks the same in every chart of the site.
 */

import { POLICY_SERIES, REFERENCE, type MarkerShape } from "@/figures/kit";
import { policySeries } from "@/data/labels";
import type { Run } from "@/data/runs";

export function policyStyle(entry: Pick<Run, "design"> | undefined): { color: string; shape: MarkerShape } {
  const key = entry ? policySeries(entry.design) : undefined;
  return key ? POLICY_SERIES[key] : { color: REFERENCE.color, shape: "circle" };
}
