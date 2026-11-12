"use client";

import type { ComponentProps } from "react";
import { Glyph } from "@/components/ui/Glyph";

export interface PlayButtonProps {
  playing: boolean;
  /** Called on click, Enter or Space. Start, pause or restart the timeline. */
  onToggle: () => void;
  /** The timeline has reached its end: the button then offers to play it again. */
  ended?: boolean;
  className?: string;
}

/**
 * Play, Pause or Replay, as an icon and a word. The word names the action the
 * button will take, and the button keeps its width when the word changes.
 *
 * Under reduced motion a figure shows its finished state and nothing plays, so
 * hide this button there (className="motion-reduce:hidden") and leave the
 * Stepper and the sliders, which change the drawing at once.
 */
export function PlayButton({ playing, onToggle, ended = false, className = "" }: PlayButtonProps) {
  const action = playing ? "pause" : ended ? "replay" : "play";
  const word = playing ? "Pause" : ended ? "Replay" : "Play";
  return (
    <button type="button" className={`button button-small fig-play ${className}`} onClick={onToggle}>
      <Glyph name={action} />
      {word}
    </button>
  );
}

/** A small button for the control bar: Reset, "Show as table", and the like. */
export function ControlButton({ className = "", type = "button", ...rest }: ComponentProps<"button">) {
  return <button type={type} className={`button button-small ${className}`} {...rest} />;
}
