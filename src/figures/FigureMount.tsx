"use client";

import { Component, useMemo, type ReactNode } from "react";
import type { FigureId } from "./catalog";
import { FigureNotice } from "./FigureNotice";
import { FigureSlotContext, type FigureSlot } from "./kit/slot";
import { FIGURE_COMPONENTS } from "./registry";

interface BoundaryProps {
  id: FigureId;
  caption?: string;
  children: ReactNode;
}

/** A figure that throws while drawing is replaced by a notice; the chapter around it is unaffected. */
class FigureBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`The figure "${this.props.id}" could not be drawn.`, error);
  }

  render() {
    if (this.state.failed) {
      return (
        <FigureNotice id={this.props.id} caption={this.props.caption}>
          <p>This figure could not be drawn. Its caption describes what it shows.</p>
        </FigureNotice>
      );
    }
    return this.props.children;
  }
}

export interface FigureMountProps {
  id: FigureId;
  /** The caption as plain text; handed to the figure component. */
  caption?: string;
  /** Figure number within the chapter ("41.2"). */
  number?: string;
  /** Element id of the frame, for links to the figure. */
  anchor?: string;
  /** The caption with its inline formatting, when a chapter supplies one. */
  children?: ReactNode;
}

/**
 * Shows the figure registered under an id. The figure component only receives
 * its caption; the number, the anchor and the formatted caption reach its
 * FigureFrame through the slot.
 */
export function FigureMount({ id, caption, number, anchor, children }: FigureMountProps) {
  const FigureComponent = FIGURE_COMPONENTS[id];
  const slot = useMemo<FigureSlot>(() => ({ number, anchor, caption: children }), [number, anchor, children]);

  return (
    <FigureSlotContext value={slot}>
      <FigureBoundary id={id} caption={caption}>
        <FigureComponent caption={caption} />
      </FigureBoundary>
    </FigureSlotContext>
  );
}
