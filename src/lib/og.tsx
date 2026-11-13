/**
 * The shared picture for links to the site (Open Graph and Twitter cards):
 * the mark, a title and one line, on paper, with the three things a robot
 * model works with drawn as small chips (words, a picture, a move). Rendered
 * with next/og at build time; no fonts to load, so it uses the default face.
 */

import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#15171e";
const PAPER = "#f3f4f7";
const MUTED = "#4e5563";
const LANGUAGE = "#2d5be3";
const VISION = "#087b6e";
const ACTION = "#c04710";
const MARK = "#ffd43b";

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 56,
        padding: "0 22px",
        borderRadius: 12,
        border: `3px solid ${color}`,
        color,
        fontSize: 28,
        fontWeight: 700,
        background: "#ffffff",
      }}
    >
      {text}
    </div>
  );
}

function Arrow() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24">
      <path d="M2 12h32M26 4l8 8-8 8" fill="none" stroke={MUTED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A 1200x630 card: `kicker` above (a lesson number), `title` large, `line` below. */
export function ogImage({ kicker, title, line }: { kicker?: string; title: string; line?: string }) {
  const long = title.length > 34;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          background: PAPER,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 28 28">
            <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="8" fill={INK} />
            <path d="M14 5v4M8 9h12M9 9v8M19 9v8" fill="none" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="11" y="16" width="6" height="6" rx="1.6" fill={MARK} />
          </svg>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>{site.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {kicker ? <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: MUTED }}>{kicker}</div> : null}
          <div
            style={{
              display: "flex",
              maxWidth: 1000,
              fontSize: long ? 68 : 84,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>
          {line ? (
            <div style={{ display: "flex", maxWidth: 980, fontSize: 32, lineHeight: 1.35, color: MUTED }}>{line}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Chip text="“pick up the cube”" color={LANGUAGE} />
          <div style={{ display: "flex", fontSize: 28, color: MUTED }}>+</div>
          <Chip text="camera picture" color={VISION} />
          <Arrow />
          <Chip text="the arm's next move" color={ACTION} />
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
