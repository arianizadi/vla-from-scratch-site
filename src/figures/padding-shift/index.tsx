"use client";

import { useRef, useState } from "react";
import {
  FIGURES,
  FigureFrame,
  Segmented,
  useElementSize,
  type FigureProps,
  type SegmentedOption,
} from "@/figures/kit";
import type { TokenPlace } from "./algorithm";
import { Drawing } from "./Drawing";
import { Ledger } from "./Ledger";
import { FOLLOWED, OUTCOMES, count, type Arrival, type Placement } from "./model";
import "./padding-shift.css";

const info = FIGURES["padding-shift"];

/** Labels for a stage wide enough to hold both groups on one line each, and shorter ones for a phone. */
const PLACEMENT_LABELS: Record<Placement, { wide: string; narrow: string }> = {
  append: { wide: "Appended to the batch", narrow: "After the pads" },
  insert: { wide: "After the last real token", narrow: "After last real token" },
};

/** Below this stage width (CSS px) the placement options take their short labels. */
const NARROW_STAGE = 480;

function placementOptions(narrow: boolean): readonly SegmentedOption<Placement>[] {
  return (["append", "insert"] as const).map((value) => ({
    value,
    label: PLACEMENT_LABELS[value][narrow ? "narrow" : "wide"],
  }));
}

const ARRIVAL_OPTIONS: readonly SegmentedOption<Arrival>[] = [
  { value: "batch", label: "In a training batch" },
  { value: "alone", label: "Served alone" },
];

/**
 * Where the token stands relative to the row's padding, in words that do not
 * depend on which way the reader faces: "with 1 pad between it and the last
 * real token" when the padding comes first, "the pad moves to the end, after
 * it" when the token comes first.
 */
function relativeToPadding(place: TokenPlace): string {
  if (place.padsBefore > 0) {
    return `with ${count(place.padsBefore, "pad")} between it and the last real token`;
  }
  if (place.padsAfter > 0) {
    const pads = place.padsAfter === 1 ? "the pad moves" : "the pads move";
    return `directly after the last real token; ${pads} to the end of the row, after it`;
  }
  return "directly after the last real token";
}

/** The current state in one or two sentences: where the token is now, and where it is on the other path. */
function statusText(placement: Placement, arrival: Arrival): string {
  const { batch, alone, shift } = OUTCOMES[placement].followed;
  const prompt = `"${FOLLOWED.text}"`;

  if (arrival === "batch") {
    const served =
      shift > 0
        ? `Served alone, the same prompt has it at index ${alone.index}, ${count(shift, "position")} earlier.`
        : `Served alone, the same prompt has it at index ${alone.index} too.`;
    return `${prompt} in a training batch: the action token is at index ${batch.index}, ${relativeToPadding(batch)}. ${served}`;
  }

  const trained =
    shift > 0
      ? `In a training batch it was at index ${batch.index}, ${relativeToPadding(batch)}.`
      : `In a training batch it is at index ${batch.index} too.`;
  return `${prompt} served alone: nothing is padded, and the action token is at index ${alone.index}. ${trained}`;
}

/**
 * padding-shift: two prompts of different length as one right-padded batch,
 * and the extra token a VLM backbone adds to every row. Appended to the batch
 * it lands after the padding, so the shorter prompt's token sits at one index
 * in training and at another when the prompt is served alone; inserted after
 * the last real token it sits at the same index both ways.
 *
 * Two choices: where the token is put, and how the prompt reaches the model.
 * Everything drawn is computed in model.ts from real token ids.
 */
export default function PaddingShiftFigure({ caption }: FigureProps) {
  const [placement, setPlacement] = useState<Placement>("append");
  const [arrival, setArrival] = useState<Arrival>("batch");
  const root = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(root);
  // Until the stage is measured (and on the server) the full labels are used.
  const narrow = width > 0 && width < NARROW_STAGE;

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      controls={
        <>
          <Segmented
            label="Action token"
            showLabel
            options={placementOptions(narrow)}
            value={placement}
            onChange={setPlacement}
          />
          <Segmented label="Prompt" showLabel options={ARRIVAL_OPTIONS} value={arrival} onChange={setArrival} />
        </>
      }
      status={statusText(placement, arrival)}
      note={
        <>
          Computed in the browser from the tokenizer&rsquo;s ids for two of the task&rsquo;s instructions, in the chat
          template with one placeholder per image, as in the tokens chapter&rsquo;s command; more placeholders per image
          move every index by the same amount and leave the shift as it is. Both placements work as the
          repository&rsquo;s code does: the token is concatenated to the padded batch, and{" "}
          <code>insert_after_last_real_token</code> then sorts each row so that real tokens come first.
        </>
      }
    >
      <div className="ps-root" ref={root}>
        <Drawing placement={placement} arrival={arrival} />
        <Ledger placement={placement} arrival={arrival} />
      </div>
    </FigureFrame>
  );
}
