"use client";

import { useEffect, useId, useRef, useState } from "react";
import { OBJECTS } from "@/data/labels";
import type { ObjectId } from "@/data/types";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Segmented,
  Stepper,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { FRAME_GUTTER, FrameView } from "./FrameView";
import {
  INPUT_FRAMES,
  PATCH_OPTIONS,
  cameraName,
  cellOfToken,
  centreOf,
  count,
  coverageOf,
  gridOf,
  listTokens,
  patchOption,
  share,
  tokenAt,
  wholeFrame,
  windowAround,
  type PatchId,
} from "./model";
import { PatchZoom } from "./PatchZoom";
import { TokenStrip } from "./TokenStrip";
import { useFramePixels } from "./useFramePixels";
import "./patchify.css";

const info = FIGURES.patchify;

/** Reading the frame in token order: one patch per beat, linear, as the flatten does it. */
const BEAT_MS = 45;

/** The object the chapter talks about, when the frame has it. */
const PREFERRED_OBJECT: ObjectId = "cube";

const PATCH_SEGMENTS = PATCH_OPTIONS.map((option) => ({
  value: option.id,
  label: `${option.patch} px, ${option.who}`,
}));

/** What the live status says while the reading order plays: it stays still, and the token is announced when it stops. */
const PLAYING_STATUS = "Reading the frame row by row, one token per patch.";
const VIEW_SEGMENTS = [
  { value: "whole", label: "Whole frame" },
  { value: "object", label: "Around the object" },
] as const;
const CAMERA_SEGMENTS = INPUT_FRAMES.map((frame) => ({
  value: frame.id,
  label: cameraName(frame),
}));

/**
 * "A frame cut into patches". The frame a policy receives, at its own pixels,
 * under the patch grid of either vision transformer; the object the reader
 * picks, found in the frame by its colour, with its size in pixels and the
 * patches it touches; the focused patch up close, as the numbers it is and the
 * token it becomes; and the whole frame as the sequence of tokens.
 */
export default function PatchifyFigure({ caption }: FigureProps) {
  const [patchId, setPatchId] = useState<PatchId>(PATCH_OPTIONS[0].id);
  const [frameId, setFrameId] = useState(INPUT_FRAMES[0]?.id ?? "");
  const [objectChoice, setObjectChoice] = useState<ObjectId | null>(null);
  // The focus is kept as a point of the frame, so a new patch size lands on the same place.
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [closeUp, setCloseUp] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Paused part-way through the reading order: Play then carries on from the focused token.
  const [paused, setPaused] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stage);
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();
  const describedBy = useId();

  const frame = INPUT_FRAMES.find((entry) => entry.id === frameId) ?? INPUT_FRAMES[0];
  const frameState = useFramePixels(frame?.file ?? "");
  const pixels = frameState.status === "ready" ? frameState.pixels : undefined;
  const objects = pixels?.objects ?? [];
  const mask =
    objects.find((entry) => entry.id === objectChoice) ??
    objects.find((entry) => entry.id === PREFERRED_OBJECT) ??
    objects[0];

  const option = patchOption(patchId);
  const patch = option.patch;
  const frameSize = frame?.width ?? 0;
  // A few hundred object pixels at most: cheap enough to count on every render.
  const grid = gridOf(frameSize, patch);
  const coverage = mask ? coverageOf(grid, mask) : undefined;
  const comparison = PATCH_OPTIONS.map((entry) => {
    const entryGrid = gridOf(frameSize, entry.patch);
    return {
      option: entry,
      grid: entryGrid,
      coverage: mask ? coverageOf(entryGrid, mask) : undefined,
    };
  });

  const view = closeUp && coverage && coverage.tokens.length > 0 ? windowAround(grid, coverage) : wholeFrame(grid);
  const focus = focusPoint ? tokenAt(grid, focusPoint.x, focusPoint.y) : (coverage?.best ?? 0);
  const cell = cellOfToken(grid, focus);
  const objectPixelsHere = coverage?.byToken.get(focus) ?? 0;
  const objectName = mask ? OBJECTS[mask.id].label : undefined;

  // Reading order: only while the figure is on screen in a visible tab, and never under reduced motion.
  const running = playing && focus < grid.tokens - 1 && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const next = centreOf(gridOf(frameSize, patch), focus + 1);
    const timer = setTimeout(() => setFocusPoint(next), BEAT_MS);
    return () => clearTimeout(timer);
  }, [running, focus, frameSize, patch]);

  const focusOn = (token: number) => {
    setPlaying(false);
    setPaused(false);
    setFocusPoint(centreOf(grid, token));
  };

  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      setPaused(true);
      return;
    }
    // The reading order covers the whole frame, so it is shown whole.
    setCloseUp(false);
    // Play reads the frame from its first patch, unless it was paused part-way.
    if (!paused || focus >= grid.tokens - 1) setFocusPoint(centreOf(grid, 0));
    setPaused(false);
    setPlaying(true);
  };

  if (!frame) {
    return (
      <FigureFrame title={info.title} stamp={info.stamp} caption={caption}>
        <p className="pf-small">No camera frame at the size the policy receives is published yet.</p>
      </FigureFrame>
    );
  }

  // ------------------------------------------------------------ layout

  // Until the stage is measured (and in the static HTML) the drawing is laid out for 640 px
  // and scales down with its container, so the first paint fits any width.
  const width = measured || 640;
  const wide = width >= 720;
  const gutters = FRAME_GUTTER.left + FRAME_GUTTER.right;
  // Wide: the side column keeps at least 400 px, so the patch close-up and its steps sit side by side.
  const frameDrawn = Math.max(120, wide ? Math.min(448, width - gutters - 24 - 400) : Math.min(448, width - gutters));
  const camera = cameraName(frame);
  const close = view.n < grid.side;
  const focusShown =
    cell.row >= view.row0 && cell.row < view.row0 + view.n && cell.col >= view.col0 && cell.col < view.col0 + view.n;

  // ------------------------------------------------------------ words

  const gridSentence = `${frameSize} × ${frameSize} pixels, cut into ${grid.side} × ${grid.side} = ${grid.tokens} patches of ${grid.patch} px`;
  const cutWords = mask?.cut ? ", cut by the frame edge (only the part in view is counted)," : "";
  const objectSentence =
    mask && coverage && objectName
      ? `The ${objectName}${cutWords} covers ${count(mask.pixels.length)} pixels, a box ${mask.box.width} × ${mask.box.height} px, and touches ${coverage.tokens.length} of the ${grid.tokens} patches (${listTokens(coverage.tokens)}); it fills at most ${share(coverage.bestShare)} of one patch.`
      : "";
  const alt = `${camera} frame, ${gridSentence}. ${objectSentence}`.trim();
  const focusSentence = `Token ${focus} of ${grid.tokens}: row ${cell.row}, column ${cell.col}, pixels x ${cell.x} to ${cell.x + grid.patch - 1}, y ${cell.y} to ${cell.y + grid.patch - 1}.${
    mask && objectName
      ? ` ${count(objectPixelsHere)} of its ${count(grid.patch * grid.patch)} pixels are the ${objectName}.`
      : ""
  }`;

  let status: string;
  if (running) status = PLAYING_STATUS;
  else if (frameState.status === "error")
    status = `${focusSentence} The frame's pixels could not be read, so no object is outlined.`;
  else status = focusSentence;

  // ------------------------------------------------------------ controls

  // Above the frame: what is cut, and how.
  const setup = (
    <div className="pf-toolbar" role="group" aria-label="What the figure shows">
      <Segmented
        label="Patch"
        showLabel
        options={PATCH_SEGMENTS}
        value={patchId}
        onChange={(next) => {
          setPlaying(false);
          setPatchId(next);
        }}
      />
      {CAMERA_SEGMENTS.length > 1 ? (
        <Segmented
          label="Camera"
          showLabel
          options={CAMERA_SEGMENTS}
          value={frame.id}
          onChange={(next) => {
            setPlaying(false);
            setFrameId(next);
            setFocusPoint(null);
          }}
        />
      ) : null}
      {objects.length > 0 && mask ? (
        <Segmented
          label="Object"
          showLabel
          options={objects.map((entry) => ({
            value: entry.id,
            label: OBJECTS[entry.id].short,
          }))}
          value={mask.id}
          onChange={(next) => {
            setPlaying(false);
            setObjectChoice(next);
            setFocusPoint(null);
          }}
        />
      ) : null}
      {coverage ? (
        <Segmented
          label="Show"
          showLabel
          options={VIEW_SEGMENTS}
          value={closeUp ? "object" : "whole"}
          onChange={(next) => {
            setPlaying(false);
            setCloseUp(next === "object");
          }}
        />
      ) : null}
    </div>
  );

  // Under the drawing: moving through the tokens.
  const controls = (
    <>
      <Stepper
        label="token"
        value={focus}
        max={grid.tokens - 1}
        // While playing, the stepper's text stays still: it is announced as it changes.
        format={(value, max) => (running ? "Reading in order" : `Token ${value} of ${max + 1}`)}
        onChange={focusOn}
      />
      <PlayButton
        playing={running}
        ended={focus >= grid.tokens - 1}
        onToggle={togglePlay}
        className="motion-reduce:hidden"
      />
      {coverage ? <ControlButton onClick={() => focusOn(coverage.best)}>Focus the object</ControlButton> : null}
      <ControlButton
        onClick={() => {
          setPlaying(false);
          setPaused(false);
          setCloseUp(false);
          setPatchId(PATCH_OPTIONS[0].id);
          setFrameId(INPUT_FRAMES[0].id);
          setObjectChoice(null);
          setFocusPoint(null);
        }}
      >
        Reset
      </ControlButton>
    </>
  );

  const table =
    mask && objectName ? (
      <div className="pf-table-wrap">
        <table className="pf-table">
          <caption className="pf-step-label">
            The same {objectName} under each patch size; in brackets, the rows × columns of patches it spans
          </caption>
          <thead>
            <tr>
              <th scope="col">Patch</th>
              <th scope="col">Tokens</th>
              <th scope="col">Touched</th>
              <th scope="col">Fullest</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.option.id} className={row.option.id === option.id ? "pf-row-on" : undefined}>
                <th scope="row">
                  {row.option.patch} px, {row.option.who}
                </th>
                <td>{count(row.grid.tokens)}</td>
                <td>
                  {row.coverage ? `${row.coverage.tokens.length} (${row.coverage.rows} × ${row.coverage.cols})` : "-"}
                </td>
                <td>{row.coverage ? share(row.coverage.bestShare) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null;

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      controls={controls}
      status={status}
      note={
        <>
          Computed in your browser from the {camera.toLowerCase()} frame at the size the policy receives ({frameSize} ×{" "}
          {frameSize} px). An object&apos;s pixels are those whose colour matches its paint, the largest connected
          region; pixels blended with the table at its edge are not counted, and an object cut by the frame edge is
          measured only where it is in view.{" "}
          {PATCH_OPTIONS.map((entry) => `${entry.patch} px: ${entry.who}`).join("; ")}. The pixel ranges are the
          processors the chapter lists for each config.
        </>
      }
    >
      <div ref={stage} className="pf-root">
        {setup}

        <div className="pf-head">
          <p className="pf-grid-sentence">
            <strong>
              {grid.side} × {grid.side} = {grid.tokens} tokens
            </strong>{" "}
            <span>
              from {frameSize} × {frameSize} px in patches of {grid.patch} px
            </span>
          </p>
          <ul className="fig-legend pf-legend" aria-label="Key">
            <li>
              <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M3 3h10v10H3z" className="pf-outline-halo" />
                <path d="M3 3h10v10H3z" className="pf-outline" />
              </svg>
              Object pixels
            </li>
            <li>
              <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <rect x={2} y={2} width={12} height={12} className="pf-touched" />
              </svg>
              {close ? "Patches the object touches, with the share it fills" : "Patches the object touches"}
            </li>
            <li>
              <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <rect x={2} y={2} width={12} height={12} className="pf-focus" />
              </svg>
              Focused patch
            </li>
          </ul>
        </div>

        <div
          className={wide ? "pf-main pf-main-wide" : "pf-main"}
          style={
            wide
              ? {
                  gridTemplateColumns: `${frameDrawn + gutters}px minmax(0, 1fr)`,
                }
              : undefined
          }
        >
          <div className="pf-left">
            <FrameView
              src={frame.file}
              alt={alt}
              grid={grid}
              view={view}
              size={frameDrawn}
              mask={mask}
              coverage={coverage}
              focus={focus}
              onFocus={focusOn}
              label={`${camera} frame cut into ${grid.side} by ${grid.side} patches. Click a patch, or use the arrow keys, to focus it; Home and End go to the first and the last.`}
              describedBy={describedBy}
            />
            {wide ? table : null}
          </div>

          <div className="pf-side">
            {mask && coverage && objectName ? (
              <section className="pf-object" aria-label="The object">
                <h3 className="pf-object-name">
                  {OBJECTS[mask.id].short}
                  {mask.cut ? <span className="pf-cut"> cut by the frame edge</span> : null}
                </h3>
                <dl className="pf-facts">
                  <div>
                    <dt>Pixels{mask.cut ? " in view" : ""}</dt>
                    <dd>
                      {count(mask.pixels.length)} <span>of {count(frameSize * frameSize)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Box{mask.cut ? " in view" : ""}</dt>
                    <dd>
                      {mask.box.width} × {mask.box.height} px
                    </dd>
                  </div>
                  <div>
                    <dt>Patches</dt>
                    <dd>
                      {coverage.tokens.length} <span>of {grid.tokens}</span>
                    </dd>
                  </div>
                </dl>
                <p className="pf-small">
                  In {listTokens(coverage.tokens)}. No patch is more than {share(coverage.bestShare)}{" "}
                  {objectName}.
                </p>
              </section>
            ) : (
              <p className="pf-small pf-object">
                {frameState.status === "loading" ? "Reading the frame's pixels…" : "No object found in this frame."}
              </p>
            )}

            <section className="pf-readout" aria-label="The focused patch">
              <p className="pf-token-head">
                <span className="pf-token-number">Token {focus}</span> of {grid.tokens}
              </p>
              <p id={describedBy} className="pf-formula">
                <code>
                  row {cell.row} × {grid.side} + column {cell.col} = {focus}
                </code>
              </p>
              {!focusShown ? (
                <p className="pf-small pf-outside">
                  This patch is outside the close-up around the object. Choose Whole frame to see it.
                </p>
              ) : null}
              <PatchZoom
                src={frame.file}
                grid={grid}
                cell={cell}
                tokenWidth={option.width}
                processors={option.processors}
                pixels={pixels}
                mask={mask}
                collapsed={!wide}
              />
            </section>
          </div>
        </div>

        <section className="pf-sequence" aria-label="The sequence">
          <p className="pf-step-label">
            The sequence the transformer reads: {grid.tokens} tokens in a row. Tall ticks mark where each row of patches
            began; the layout in two dimensions is gone.
          </p>
          <TokenStrip
            grid={grid}
            width={width}
            coverage={coverage}
            focus={focus}
            onFocus={focusOn}
            label="Token sequence"
            valueText={focusSentence}
          />
        </section>

        {wide ? null : table}
      </div>
    </FigureFrame>
  );
}
