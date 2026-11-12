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

/** Label text of a node or a message: line breaks and markup become spaces. */
function plain(text: unknown): string {
  return String(text ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

interface FlowDb {
  getVertices(): Map<string, { id: string; text?: string }> | Record<string, { id: string; text?: string }>;
  getEdges(): { start: string; end: string; text?: string }[];
}
interface SequenceDb {
  getMessages(): { from?: string; to?: string; message?: unknown }[];
  getActors(): Map<string, { name: string; description?: string }>;
}

/**
 * The diagram as readable sentences, read from Mermaid's own parse: one line
 * per arrow of a flowchart ("actions [64, 15, 8] to add_noise"), one per
 * message of a sequence diagram. Undefined for other kinds, which keep their
 * source as the text form.
 */
async function describe(mermaid: MermaidApi, chart: string): Promise<string[] | undefined> {
  const diagram = await mermaid.mermaidAPI.getDiagramFromText(chart);
  const db = diagram.db as unknown as Partial<FlowDb & SequenceDb>;
  if (typeof db.getEdges === "function" && typeof db.getVertices === "function") {
    const raw = db.getVertices();
    const vertices = raw instanceof Map ? raw : new Map(Object.entries(raw));
    const name = (id: string) => plain(vertices.get(id)?.text) || id;
    return db.getEdges().map((edge) => {
      const label = plain(edge.text);
      return `${name(edge.start)} → ${name(edge.end)}${label ? ` (${label})` : ""}`;
    });
  }
  if (typeof db.getMessages === "function" && typeof db.getActors === "function") {
    const actors = db.getActors();
    const name = (id?: string) => plain(actors.get(id ?? "")?.description) || id || "";
    return db
      .getMessages()
      .filter((message) => message.from && message.to)
      .map((message) => `${name(message.from)} → ${name(message.to)}: ${plain(message.message)}`);
  }
  return undefined;
}

/**
 * A Mermaid diagram inside the figure plate, titled from the heading above it
 * and described by the sentence that introduces it (the pipeline supplies
 * both). The server sends the diagram's source as text; the drawing replaces
 * it once Mermaid has loaded, and is redrawn when the theme changes. Its text
 * form lists the diagram's arrows in words. If drawing fails, the source stays.
 */
export function Mermaid({ chart, title = "Diagram", lead }: { chart: string; title?: string; lead?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [svg, setSvg] = useState<string | undefined>(undefined);
  const [lines, setLines] = useState<string[] | undefined>(undefined);
  const [scrolls, setScrolls] = useState(false);

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

  // The drawing takes a tab stop only when it is wider than the plate and scrolls.
  useEffect(() => {
    const element = stage.current;
    if (!element || svg === undefined) return;
    const measure = () => setScrolls(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [svg]);

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
        let described: string[] | undefined;
        try {
          described = await describe(mermaid, chart);
        } catch {
          described = undefined;
        }
        if (!cancelled && thisRun === run) {
          setSvg(drawing);
          setLines(described && described.length > 0 ? described : undefined);
        }
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

  const summary = lead ? `${lead}.` : `${title}.`;
  const label = `${summary} ${lines ? "Its arrows are listed in words" : "Its source is"} under \u201cDiagram as text\u201d.`;

  return (
    <FigureFrame
      title={title}
      stamp="schematic"
      grid={svg !== undefined}
      controls={
        svg !== undefined ? (
          <details className="w-full">
            <summary className="cursor-pointer text-ink-muted">Diagram as text</summary>
            {lines ? (
              <ul className="mermaid-lines mt-2">
                {lines.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            ) : (
              <pre className="mermaid-source mt-2">{chart}</pre>
            )}
          </details>
        ) : undefined
      }
    >
      <div ref={host} className="min-h-[120px]">
        {svg !== undefined ? (
          <div
            ref={stage}
            className="mermaid-stage"
            tabIndex={scrolls ? 0 : undefined}
            role={scrolls ? "group" : undefined}
            aria-label={scrolls ? `${title}, scrolls sideways` : undefined}
          >
            <div role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        ) : (
          <pre className="mermaid-source">{chart}</pre>
        )}
      </div>
    </FigureFrame>
  );
}
