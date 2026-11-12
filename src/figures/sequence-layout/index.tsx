"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ObjectId } from "@/data/types";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  Segmented,
  Slider,
  useElementSize,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { ConfigPicker, type ConfigRow } from "./ConfigPicker";
import { CONFIGS, configById, initialConfig, type ConfigId } from "./configs";
import { Drawing } from "./Drawing";
import { Legend } from "./Legend";
import { layoutPanel } from "./layout";
import {
  INSTRUCTIONS,
  describe,
  formatCount,
  hasTargets,
  instructionChange,
  lengthsFor,
  sequencesFor,
  stylesUsed,
  usesInstruction,
  type Panel,
  type PanelId,
} from "./model";
import { BlockTable } from "./BlockTable";
import "./sequence-layout.css";

const info = FIGURES["sequence-layout"];

/** How long a change of config or instruction moves the cells (DESIGN.md: an explanatory beat). */
const BEAT_MS = 650;

const NONE: readonly number[] = [];

interface Cursor {
  panel: PanelId;
  index: number;
}

function panelLabel(panel: Panel): string {
  const parts = panel.parts
    .map((part) => `${formatCount(part.n)} ${part.label}`)
    .join(", ");
  return `${panel.title}, drawn to scale, one cell per token: ${formatCount(panel.total)} tokens, ${parts}.`;
}

function describeAt(panel: Panel, index: number, panels: Panel[]): string {
  const text = describe(panel, index);
  // Prompt positions name their sequence already; head positions do when there are two sequences.
  return panel.id === "head" && panels.length > 1 ? `Action head. ${text}` : text;
}

function linkSentence(from: PanelId, to: number): string {
  return from === "prompt"
    ? ` In the action head it is position ${to}.`
    : ` It comes from prompt position ${to}.`;
}

/**
 * sequence-layout: the token sequences of the configs in the repository, to
 * scale. The prompt (with its image placeholders) and the action head's input
 * (time, conditioning, state, action steps) are drawn with one cell per token,
 * every cell the same size, so the one conditioning token of the VLA and the
 * hundreds of the same VLA reading every token can be compared by eye.
 *
 * The reader picks a config (each with its counts), an instruction (the ids
 * that change are framed and listed), and a token to inspect by clicking it or
 * with the Position slider; the token's counterpart in the other sequence is
 * marked too. Hovering only lights a cell up, so the announced status changes
 * on a choice, not on every pointer move.
 */
export default function SequenceLayoutFigure({ caption }: FigureProps) {
  const [configId, setConfigId] = useState<ConfigId>(() =>
    initialConfig(caption),
  );
  const [object, setObject] = useState<ObjectId | undefined>(
    () =>
      (INSTRUCTIONS.find((i) => i.object === "cube") ?? INSTRUCTIONS[0])
        ?.object,
  );
  const [cursor, setCursor] = useState<Cursor | null>(null);
  /** The instruction before the last change, for marking what changed; cleared with the config. */
  const [previous, setPrevious] = useState<ObjectId | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [animate, setAnimate] = useState(false);
  const reducedMotion = useReducedMotion();

  const stage = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stage);
  const width = measured || 640;

  const config = configById(configId);
  const instruction =
    INSTRUCTIONS.find((i) => i.object === object) ?? INSTRUCTIONS[0];
  const sequences = useMemo(
    () => (instruction ? sequencesFor(config, instruction) : null),
    [config, instruction],
  );
  const geometries = useMemo(
    () =>
      sequences
        ? sequences.panels.map((panel) => layoutPanel(panel, width))
        : [],
    [sequences, width],
  );
  const before = previous
    ? INSTRUCTIONS.find((i) => i.object === previous)
    : undefined;
  const change = useMemo(() => {
    if (!before || !instruction || !sequences || !usesInstruction(config))
      return null;
    const old = sequencesFor(config, before);
    return old ? instructionChange(old, sequences, before, instruction) : null;
  }, [before, instruction, sequences, config]);
  const rows = useMemo<ConfigRow[]>(
    () =>
      instruction
        ? CONFIGS.map((c) => ({ config: c, ...lengthsFor(c, instruction) }))
        : [],
    [instruction],
  );

  // Cells move for one beat after a change of config or instruction, never on a resize.
  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setAnimate(false), BEAT_MS + 50);
    return () => clearTimeout(timer);
  }, [animate, configId, object]);

  const chooseConfig = (id: ConfigId) => {
    if (id === configId) return;
    setAnimate(!reducedMotion);
    setCursor(null);
    setPrevious(null);
    setConfigId(id);
  };
  const chooseInstruction = (next: ObjectId) => {
    if (next === object) return;
    setAnimate(!reducedMotion);
    setPrevious(object ?? null);
    setObject(next);
  };

  if (!sequences || !instruction) {
    return (
      <FigureFrame title={info.title} stamp={info.stamp} caption={caption} grid={false}>
        <p className="sl-missing">
          The tokenizer&rsquo;s output for the task&rsquo;s instructions is
          missing from the data module, so the sequences cannot be built.
        </p>
      </FigureFrame>
    );
  }

  const panels = sequences.panels;
  const inspectedId: PanelId = cursor?.panel ?? panels[panels.length - 1].id;
  const inspected =
    panels.find((p) => p.id === inspectedId) ?? panels[panels.length - 1];
  // A cursor past the end (the prompt got one token shorter) is clamped.
  const cursorIndex =
    cursor && cursor.panel === inspected.id
      ? Math.min(cursor.index, inspected.total - 1)
      : null;
  const linked =
    cursorIndex !== null ? sequences.link(inspected.id, cursorIndex) : null;

  const status =
    cursorIndex !== null
      ? `${describeAt(inspected, cursorIndex, panels)}${linked ? linkSentence(inspected.id, linked.index) : ""}`
      : change
        ? `${change.text} ${sequences.summary}`
        : sequences.summary;
  const showInstruction = usesInstruction(config) && INSTRUCTIONS.length > 1;

  const usedStyles = stylesUsed(sequences);

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      // The drawing is itself a grid or a table: no graph paper behind it.
      grid={false}
      caption={caption}
      status={status}
      note={
        <>
          To scale: one cell is one token, the same size in every sequence; B is
          the batch size, and the widths in the shapes are not drawn. The counts
          follow the configs in <code>sim/pickup/configs/</code> through the
          model code that reads them (<code>diffusion_policy.py</code>, the
          backbones in <code>vision_language_backbones/</code>, the data
          processors). The prompts are the tokenizer&rsquo;s real output for the
          task&rsquo;s instructions and for one generated caption; a prompt in a
          batch is padded to the longest one, which this drawing of a single
          sample leaves out. For the Qwen configs only the action head is
          drawn: their prompts come from Qwen&rsquo;s own tokenizer, whose
          output the site does not have.
        </>
      }
      controls={
        <>
          {showInstruction ? (
            <Segmented
              label="Instruction"
              showLabel
              options={INSTRUCTIONS.map((i) => ({
                value: i.object,
                label: i.label,
              }))}
              value={instruction.object}
              onChange={chooseInstruction}
            />
          ) : null}
          {panels.length > 1 ? (
            <Segmented
              label="Inspect"
              showLabel
              options={panels.map((p) => ({
                value: p.id,
                label: p.id === "prompt" ? "Prompt" : "Action head",
              }))}
              value={inspected.id}
              onChange={(id) => {
                const there = linked && linked.panel === id ? linked.index : 0;
                setCursor({ panel: id, index: there });
              }}
            />
          ) : null}
          {/* Until a token is chosen the slider reads "none"; reaching it from the keyboard chooses position 0. */}
          <div
            className="contents"
            onFocus={() => {
              if (cursorIndex === null)
                setCursor({ panel: inspected.id, index: 0 });
            }}
          >
            <Slider
              label="Position"
              min={0}
              max={inspected.total - 1}
              value={cursorIndex ?? 0}
              onChange={(index) => setCursor({ panel: inspected.id, index })}
              format={(value) =>
                cursorIndex === null && value === 0
                  ? "none"
                  : `${value} of ${inspected.total - 1}`
              }
            />
          </div>
          <ControlButton
            aria-expanded={showTable}
            onClick={() => setShowTable((shown) => !shown)}
          >
            {showTable ? "Hide table" : "Show as table"}
          </ControlButton>
        </>
      }
    >
      <div className="sl-root">
        <ConfigPicker rows={rows} value={configId} onChange={chooseConfig} />

        <div ref={stage} className="sl-panels">
          {panels.map((panel, index) => {
            const geometry = geometries[index];
            const here =
              cursorIndex !== null && inspected.id === panel.id
                ? cursorIndex
                : null;
            const there =
              linked && linked.panel === panel.id ? linked.index : null;
            const bridgeHere =
              sequences.bridge &&
              (panels.length === 1 ? index === 0 : index === 1);
            return (
              <Fragment key={panel.id}>
                {bridgeHere ? (
                  <p className="sl-bridge">
                    <svg
                      viewBox="0 0 12 16"
                      width={12}
                      height={16}
                      aria-hidden="true"
                      className="sl-bridge-arrow"
                    >
                      <path d="M6 1V14M2 10L6 14L10 10" />
                    </svg>
                    <span>{sequences.bridge}</span>
                  </p>
                ) : null}
                <section className="sl-panel" aria-label={panel.title}>
                  <div className="sl-panel-head">
                    <h3 className="sl-panel-title">{panel.title}</h3>
                    <p className="sl-panel-total">
                      <span className="sl-panel-count">
                        {formatCount(panel.total)}
                      </span>
                      {panel.parts.length > 1 ? (
                        <span className="sl-panel-formula">
                          {" "}
                          = {panel.formula}
                        </span>
                      ) : null}{" "}
                      {panel.shapeLabel ? (
                        <span className="sl-shape-label">
                          {panel.shapeLabel}
                        </span>
                      ) : null}
                      <code className="sl-shape">{panel.shape}</code>
                    </p>
                  </div>
                  <p className="sl-panel-sub">{panel.subtitle}</p>
                  {showInstruction && panel.id === "prompt" ? (
                    <p className="sl-change">
                      {change && before ? (
                        <>
                          <strong>
                            Changed from &ldquo;{before.label}&rdquo;
                          </strong>{" "}
                          (framed): {change.short}.
                        </>
                      ) : (
                        <>
                          Pick another instruction: the ids that change are
                          framed and listed here.
                        </>
                      )}
                    </p>
                  ) : null}
                  {geometry ? (
                    <Drawing
                      panel={panel}
                      geometry={geometry}
                      cursor={here}
                      linked={there}
                      changed={change?.changed[panel.id] ?? NONE}
                      animate={animate}
                      label={panelLabel(panel)}
                      onSelect={(position) =>
                        setCursor({ panel: panel.id, index: position })
                      }
                    />
                  ) : null}
                </section>
              </Fragment>
            );
          })}
        </div>

        <Legend
          styles={usedStyles}
          targets={hasTargets(sequences)}
          changed={Boolean(change && Object.keys(change.changed).length > 0)}
        />

        {showTable ? <BlockTable panels={panels} /> : null}
      </div>
    </FigureFrame>
  );
}
