"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FigureFrame } from "@/figures/kit";
import { currentTheme, readToken, subscribeToTheme } from "@/lib/theme";

type MermaidApi = (typeof import("mermaid"))["default"];

let mermaidLoader: Promise<MermaidApi> | undefined;

/** Mermaid is large; it is fetched once, when the first diagram nears the viewport. */
function loadMermaid(): Promise<MermaidApi> {
  mermaidLoader ??= import("mermaid").then((module) => module.default);
  return mermaidLoader;
}

/** The direction keyword of a flowchart that runs sideways. */
const SIDEWAYS = /^(\s*(?:flowchart|graph)\s+)(?:LR|RL)\b/;

/** Width in px that Mermaid gave the drawing. */
function drawnWidth(svg: string): number {
  const width = /<svg[^>]*\swidth="([\d.]+)"/.exec(svg);
  return width ? Number(width[1]) : 0;
}

/** Mermaid's "base" theme, filled from the design tokens of the current theme. */
function themeVariables(): Record<string, string | boolean> {
  const surface = readToken("--surface");
  const surface2 = readToken("--surface-2");
  const page = readToken("--bg");
  const text = readToken("--text");
  const muted = readToken("--text-muted");
  const border = readToken("--border");
  const strong = readToken("--border-strong");
  const accentSoft = readToken("--accent-soft");
  return {
    darkMode: currentTheme() === "dark",
    fontFamily: getComputedStyle(document.body).fontFamily,
    fontSize: "14px",
    background: surface,
    primaryColor: surface,
    primaryTextColor: text,
    primaryBorderColor: strong,
    secondaryColor: surface2,
    secondaryTextColor: text,
    secondaryBorderColor: strong,
    tertiaryColor: page,
    tertiaryTextColor: text,
    tertiaryBorderColor: border,
    lineColor: muted,
    textColor: text,
    mainBkg: surface,
    nodeBorder: strong,
    clusterBkg: page,
    clusterBorder: border,
    titleColor: text,
    edgeLabelBackground: surface,
    actorBkg: surface,
    actorBorder: strong,
    actorTextColor: text,
    actorLineColor: strong,
    signalColor: muted,
    signalTextColor: text,
    labelBoxBkgColor: surface2,
    labelBoxBorderColor: strong,
    labelTextColor: text,
    loopTextColor: text,
    noteBkgColor: accentSoft,
    noteTextColor: text,
    noteBorderColor: strong,
    activationBkgColor: surface2,
    activationBorderColor: strong,
  };
}

/**
 * A Mermaid diagram inside the figure plate. The server sends the diagram's
 * source as text; the drawing replaces it once Mermaid has loaded, and is
 * redrawn when the theme changes. If drawing fails, the source stays.
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [svg, setSvg] = useState<string | undefined>(undefined);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let run = 0;

    const draw = async () => {
      run += 1;
      const thisRun = run;
      try {
        const mermaid = await loadMermaid();
        // Diagrams keep their drawn size (text never shrinks below the label
        // size); a diagram wider than the plate scrolls sideways.
        const natural = { useMaxWidth: false };
        const variables = themeVariables();
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          look: "classic",
          themeVariables: variables,
          // Labels are measured with this family, so it must be the one they are drawn in.
          fontFamily: String(variables.fontFamily),
          flowchart: { ...natural, nodeSpacing: 28, rankSpacing: 36, padding: 10 },
          sequence: natural,
          state: natural,
          class: natural,
          er: natural,
          gantt: natural,
          journey: natural,
          timeline: natural,
        });
        await mermaid.parse(chart);
        let drawing = (await mermaid.render(`mermaid-${id}-${thisRun}`, chart)).svg;

        // A left-to-right flowchart that is wider than the plate is drawn
        // top-down instead, when that makes it narrower.
        const available = host.current?.clientWidth ?? Number.POSITIVE_INFINITY;
        const turned = chart.replace(SIDEWAYS, "$1TB");
        if (turned !== chart && drawnWidth(drawing) > available) {
          const upright = (await mermaid.render(`mermaid-${id}-${thisRun}-tb`, turned)).svg;
          if (drawnWidth(upright) < drawnWidth(drawing)) drawing = upright;
        }
        if (!cancelled && thisRun === run) setSvg(drawing);
      } catch {
        if (!cancelled && thisRun === run) setSvg(undefined);
      }
    };

    void draw();
    const unsubscribe = subscribeToTheme(() => void draw());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [near, chart, id]);

  return (
    <FigureFrame
      title="Diagram"
      stamp="schematic"
      grid={svg !== undefined}
      controls={
        svg !== undefined ? (
          <details className="w-full">
            <summary className="cursor-pointer text-ink-muted">Diagram as text</summary>
            <pre className="mermaid-source mt-2">{chart}</pre>
          </details>
        ) : undefined
      }
    >
      <div ref={host} className="min-h-[120px]">
        {svg !== undefined ? (
          <div className="mermaid-stage" tabIndex={0} role="group" aria-label="Diagram, scrolls sideways when wide">
            <div
              role="img"
              aria-label="Diagram. Its source is available as text below."
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        ) : (
          <pre className="mermaid-source">{chart}</pre>
        )}
      </div>
    </FigureFrame>
  );
}
