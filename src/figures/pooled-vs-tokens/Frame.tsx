"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { CUBE, CUBE_EDGE, FRAME_PX, GRID, PATCH_PX, clampToFrame, piecesAt, type Point } from "./model";
import { styles } from "./classes";

interface FrameProps {
  /** Where the cube is now, top-left corner in frame pixels. */
  now: Point;
  /** Where it was before the move: drawn as a dashed outline. */
  before: Point;
  /** The cube was put somewhere else by the pointer. */
  onMove: (to: Point) => void;
}

const LINES = Array.from({ length: GRID - 1 }, (_, index) => (index + 1) * PATCH_PX);

/**
 * The camera frame in its own pixels: the table, the 14 x 14 patch grid, the
 * patches the cube touches, the cube, and a dashed outline where it was.
 *
 * The cube follows the pointer: drag it, or click anywhere on the frame to put
 * it there. The keyboard moves it with the sliders in the control bar, so the
 * drawing itself takes no focus.
 */
export function Frame({ now, before, onMove }: FrameProps) {
  const svg = useRef<SVGSVGElement>(null);
  // Where on the cube the pointer took hold, in frame pixels from its corner.
  const grip = useRef<Point | null>(null);
  const [dragging, setDragging] = useState(false);

  /** A pointer position in frame pixels. */
  const toFrame = (event: MouseEvent): Point | null => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return null;
    return {
      x: ((event.clientX - box.left) / box.width) * FRAME_PX,
      y: ((event.clientY - box.top) / box.height) * FRAME_PX,
    };
  };

  const take = (event: PointerEvent<SVGGElement>) => {
    const at = toFrame(event);
    if (!at) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    grip.current = { x: at.x - now.x, y: at.y - now.y };
    setDragging(true);
  };
  const drag = (event: PointerEvent<SVGGElement>) => {
    const at = toFrame(event);
    if (!at || !grip.current) return;
    onMove(clampToFrame({ x: at.x - grip.current.x, y: at.y - grip.current.y }));
  };
  const release = () => {
    grip.current = null;
    setDragging(false);
  };
  /** A click or tap on the frame outside the cube puts the cube's centre there. A finger that scrolls does not. */
  const place = (event: MouseEvent<SVGSVGElement>) => {
    const at = toFrame(event);
    if (!at) return;
    onMove(clampToFrame({ x: at.x - CUBE.width / 2, y: at.y - CUBE.height / 2 }));
  };

  const pieces = piecesAt(now);

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${FRAME_PX} ${FRAME_PX}`}
      className={`${styles.scaled} ${styles.place}`}
      aria-hidden="true"
      onClick={place}
    >
      <rect width={FRAME_PX} height={FRAME_PX} className={styles.table} />
      {/* The patches the cube touches: the tokens that will hold it. */}
      {pieces.map((piece) => (
        <rect
          key={piece.token}
          x={piece.column * PATCH_PX}
          y={piece.row * PATCH_PX}
          width={PATCH_PX}
          height={PATCH_PX}
          className={styles.touched}
        />
      ))}
      <g className={styles.gridLines}>
        {LINES.map((at) => (
          <g key={at}>
            <line x1={at} x2={at} y1={0} y2={FRAME_PX} />
            <line x1={0} x2={FRAME_PX} y1={at} y2={at} />
          </g>
        ))}
      </g>
      <rect
        x={before.x}
        y={before.y}
        width={CUBE.width}
        height={CUBE.height}
        className={styles.ghost}
      />
      <g
        className={styles.handle}
        data-dragging={dragging}
        onPointerDown={take}
        onPointerMove={drag}
        onPointerUp={release}
        onPointerCancel={release}
        onClick={(event) => event.stopPropagation()}
      >
        {/* A larger target than the cube, so a finger can take hold of it. */}
        <rect x={now.x - 8} y={now.y - 8} width={CUBE.width + 16} height={CUBE.height + 16} fill="transparent" />
        <rect x={now.x} y={now.y} width={CUBE.width} height={CUBE.height} className={styles.cube} />
        <line x1={now.x} x2={now.x + CUBE.width} y1={now.y + CUBE_EDGE} y2={now.y + CUBE_EDGE} className={styles.cubeEdge} />
      </g>
      {pieces.map((piece) => (
        <rect
          key={piece.token}
          x={piece.column * PATCH_PX}
          y={piece.row * PATCH_PX}
          width={PATCH_PX}
          height={PATCH_PX}
          className={styles.touchedEdge}
        />
      ))}
      <rect width={FRAME_PX} height={FRAME_PX} className={styles.border} />
    </svg>
  );
}
