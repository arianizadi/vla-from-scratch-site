"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { camera, chunking, heroRuns, type HeroRunId } from "@/data/lab";
import { FigureFrame } from "@/figures/kit";
import { HeroDrawing } from "./HeroDrawing";
import { OBJECT_IDS, OBJECTS, START, buildScene, type ObjectId, type Point } from "./geometry";

gsap.registerPlugin(useGSAP, CustomEase);

const STANDARD = "0.2, 0, 0, 1";
const DRAW = "0.65, 0, 0.35, 1";
const OPEN_GAP = 24;
const RUN_IDS = Object.keys(heroRuns) as HeroRunId[];

/** One control step on screen: 20 Hz control, played at half speed. */
const STEP = (1 / chunking.controlHz) * 2;

function closedGapFor(run: HeroRunId, target: ObjectId): number {
  // The expert closes on the object; the policy without language closes on air.
  return run === "expert" ? OBJECTS[target].radius + 1 : 5;
}

/** Builds the seven-second timeline over the drawing's "hp-" handles. */
function buildTimeline(root: HTMLElement, scene: ReturnType<typeof buildScene>, closedGap: number) {
  const all = gsap.utils.selector(root);
  const standard = CustomEase.create("standard", STANDARD);
  const draw = CustomEase.create("draw", DRAW);
  const offset = (from: Point, to: Point) => ({ x: from.x - to.x, y: from.y - to.y });
  const along = (points: Point[]) =>
    points.map((at) => ({ ...offset(at, scene.close), duration: STEP, ease: "none" }));

  const gripper = all(".hp-gripper");
  gsap.set(gripper, offset(START, scene.close));

  const timeline = gsap.timeline({ paused: true, defaults: { ease: standard } });
  timeline
    // 0 s: the plan draws itself.
    .addLabel("plan", 0)
    .from(all("[data-draw]"), { strokeDashoffset: 1, fillOpacity: 0, duration: 0.8, ease: draw, stagger: 0.04 }, "plan")
    .from(all(".hp-label"), { opacity: 0, duration: 0.4 }, "plan+=0.5")
    .from(gripper, { opacity: 0, duration: 0.4 }, "plan+=0.5")
    // 1 s: the instruction becomes tokens.
    .addLabel("instruction", 1)
    .from(all(".hp-chip"), { opacity: 0, y: -8, duration: 0.5, stagger: 0.06 }, "instruction")
    // 2 s: the camera frame is cut into patches; the named object's patches are marked.
    .addLabel("patches", 2)
    .from(all(".hp-gridline"), { opacity: 0, duration: 0.3, stagger: 0.012 }, "patches")
    .from(all(".hp-mark"), { opacity: 0, duration: 0.3, stagger: 0.05 }, "patches+=0.55")
    // 3 s: 15 points of noise are carried onto a path in 10 flow steps.
    .addLabel("flow", 3)
    .from(all(".hp-first"), { opacity: 0, duration: 0.12 }, "flow")
    .from(
      all(".hp-first"),
      {
        x: (index: number) => scene.firstNoise[index].x,
        y: (index: number) => scene.firstNoise[index].y,
        duration: 1,
        ease: `steps(${chunking.flowSteps})`,
      },
      "flow",
    )
    .from(all(".hp-tail"), { opacity: 0, duration: 0.3 }, "flow+=1")
    // 4.2 s: 8 actions are executed; 7 stay behind as a discarded prediction.
    .addLabel("execute", 4.2)
    .from(all(".hp-executed-1"), { fillOpacity: 0, duration: 0.01, stagger: STEP, ease: "none" }, "execute")
    .from(all(".hp-segment-1"), { strokeDashoffset: 1, duration: STEP * chunking.executed, ease: "none" }, "execute")
    .to(gripper, { keyframes: along(scene.firstChunk.slice(0, chunking.executed)) }, "execute")
    // 5.1 s: plan again from where the gripper is.
    .addLabel("replan", 5.1)
    .from(all(".hp-second"), { opacity: 0, duration: 0.12 }, "replan")
    .from(
      all(".hp-second"),
      {
        x: (index: number) => scene.secondNoise[index].x,
        y: (index: number) => scene.secondNoise[index].y,
        duration: 0.5,
        ease: `steps(${chunking.flowSteps})`,
      },
      "replan",
    )
    .addLabel("execute-again", 5.7)
    .from(all(".hp-second"), { fillOpacity: 0, duration: 0.01, stagger: STEP, ease: "none" }, "execute-again")
    .from(all(".hp-segment-2"), { strokeDashoffset: 1, duration: STEP * chunking.executed, ease: "none" }, "execute-again")
    .to(gripper, { keyframes: along(scene.secondChunk) }, "execute-again")
    // 6.6 s: the jaws close and the miss is measured.
    .addLabel("close", 6.6)
    .from(all(".hp-jaw-left"), { x: closedGap - OPEN_GAP, duration: 0.25 }, "close")
    .from(all(".hp-jaw-right"), { x: OPEN_GAP - closedGap, duration: 0.25 }, "close")
    .from(all(".hp-result"), { opacity: 0, duration: 0.4 }, "close+=0.25");

  return timeline;
}

/**
 * The landing page's hero: one control cycle of a pick, drawn in plan. The
 * server renders the finished drawing; with motion allowed, a GSAP timeline
 * plays it once and again whenever a control changes.
 */
export function HeroPlate() {
  const [runId, setRunId] = useState<HeroRunId>("expert");
  const [target, setTarget] = useState<ObjectId>("can");
  const [replays, setReplays] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);
  const replayed = useRef(0);

  const run = heroRuns[runId];
  const scene = useMemo(() => buildScene(target, run.medianMissMm), [target, run.medianMissMm]);
  const closedGap = closedGapFor(runId, target);
  const instruction = scene.words.join(" ");
  const result = `${run.label}: the gripper closes ${run.medianMissMm} mm from the named object (median), and ${run.successes} of ${run.episodes} episodes succeed.`;

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        element.dataset.state = "ready";
        const timeline = buildTimeline(element, scene, closedGap);

        const isFirst = firstRun.current;
        const isReplay = replayed.current !== replays;
        firstRun.current = false;
        replayed.current = replays;

        // The first run waits until the plate has been 60% visible for 400 ms.
        // After that, a change of control plays at once, skipping the plan's
        // drawing unless Replay was pressed.
        let started = !isFirst;
        let visible = true;
        let timer: ReturnType<typeof setTimeout> | undefined;
        if (started) timeline.play(isReplay ? 0 : "instruction");

        const sync = () => {
          if (!started) return;
          if (visible && !document.hidden) {
            if (timeline.progress() < 1) timeline.play();
          } else {
            timeline.pause();
          }
        };
        // Visibility is the share of the drawing's height that is on screen, or
        // of the screen's height when the drawing is taller than the screen.
        const stage = element.querySelector(".plate-stage") ?? element;
        const observer = new IntersectionObserver(
          ([entry]) => {
            const full = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? Infinity) || 1;
            const share = entry.intersectionRect.height / full;
            visible = share >= 0.25;
            if (!started) {
              clearTimeout(timer);
              if (share >= 0.6) {
                timer = setTimeout(() => {
                  started = true;
                  sync();
                }, 400);
              }
            }
            sync();
          },
          { threshold: Array.from({ length: 21 }, (_, index) => index / 20) },
        );
        observer.observe(stage);
        document.addEventListener("visibilitychange", sync);

        return () => {
          clearTimeout(timer);
          observer.disconnect();
          document.removeEventListener("visibilitychange", sync);
        };
      });

      return () => media.revert();
    },
    { scope: root, dependencies: [scene, closedGap, replays], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="hero-plate" data-state="pending">
      <FigureFrame
        title="One control cycle, drawn in plan"
        stamp="schematic"
        className="[&_.plate-stage]:overflow-x-auto [&_.plate-stage]:p-3 sm:[&_.plate-stage]:p-6"
        controls={
          <>
            <fieldset className="segments">
              <legend className="sr-only">Policy</legend>
              {RUN_IDS.map((id) => (
                <label key={id}>
                  <input
                    type="radio"
                    name="hero-policy"
                    className="sr-only"
                    checked={runId === id}
                    onChange={() => setRunId(id)}
                  />
                  <span className="segment">{heroRuns[id].label}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="segments">
              <legend className="sr-only">Object named in the instruction</legend>
              {OBJECT_IDS.map((id) => (
                <label key={id}>
                  <input
                    type="radio"
                    name="hero-object"
                    className="sr-only"
                    checked={target === id}
                    onChange={() => setTarget(id)}
                  />
                  <span className="segment">{OBJECTS[id].label}</span>
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              className="button button-small motion-reduce:hidden"
              onClick={() => setReplays((count) => count + 1)}
            >
              Replay
            </button>
            <p aria-live="polite" className="w-full text-14 text-ink-muted">
              &ldquo;{instruction}&rdquo;. {result}
            </p>
          </>
        }
        caption={
          <>
            The instruction becomes tokens, the camera frame becomes {camera.grid * camera.grid} patches, and the policy carries{" "}
            {chunking.predicted} points of noise onto a path in {chunking.flowSteps} flow steps, executes{" "}
            {chunking.executed} of them and plans again. The layout is illustrative; the distances and counts are
            measured on the <code>pick_target</code> task and recorded in the{" "}
            <Link href="/lab" className="text-link">
              lab notebook
            </Link>
            .
          </>
        }
      >
        <HeroDrawing
          scene={scene}
          run={run}
          closedGap={closedGap}
          description={`Plan view of a table with a red cube, a green can and a blue hex nut. The instruction "${instruction}" is split into tokens, the camera frame is cut into a ${camera.grid} by ${camera.grid} grid of patches, and the gripper follows a path of predicted actions. ${result}`}
        />
      </FigureFrame>
    </div>
  );
}
