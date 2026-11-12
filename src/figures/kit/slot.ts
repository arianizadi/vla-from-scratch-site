"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * What the place a figure is shown in tells its frame: the figure's number in
 * the chapter, the anchor readers can link to, and the chapter's caption with
 * its inline formatting. Set by the host (FigureMount) and read by FigureFrame,
 * so a figure component never has to pass these along.
 */
export interface FigureSlot {
  /** "41.2", printed as "Fig. 41.2". */
  number?: string;
  /** Element id of the frame ("fig-41-2"). */
  anchor?: string;
  /** The chapter's caption as formatted nodes; shown instead of the plain string. */
  caption?: ReactNode;
}

export const FigureSlotContext = createContext<FigureSlot | null>(null);

export function useFigureSlot(): FigureSlot | null {
  return useContext(FigureSlotContext);
}
