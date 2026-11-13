import Link from "next/link";
import type { ChapterMeta } from "@/lib/content";
import { HeroAnimation } from "./HeroAnimation";

/** What the course teaches, in one line and a drawing that plays the whole loop. */
export function Hero({ chapters, firstLesson }: { chapters: ChapterMeta[]; firstLesson?: ChapterMeta }) {
  const start = firstLesson ?? chapters[0];
  return (
    <section aria-labelledby="hero-title" className="hero page-frame">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">
          Teach a robot to read, see and&nbsp;act.
        </h1>
        <p className="hero-lead">
          Short, animated lessons on the models behind robot arms. Build a language model, a vision-language model
          and a robot policy from scratch, then watch what each one does in a simulator.
        </p>
        <p className="hero-actions">
          <Link href="/learn" className="button button-primary">
            Start learning
          </Link>
          {start ? (
            <Link href={`/learn/${start.slug}`} className="button">
              Try a lesson: {start.title}
            </Link>
          ) : null}
        </p>
        <p className="hero-note">
          Free and open source. Every result comes from a real run, recorded in the{" "}
          <Link href="/lab" className="text-link">
            lab notebook
          </Link>
          .
        </p>
      </div>
      <div className="hero-visual">
        <HeroAnimation />
      </div>
    </section>
  );
}
