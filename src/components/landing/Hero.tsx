import Link from "next/link";
import { HeroAnimation } from "./HeroAnimation";

/** What the reader will understand, the way into lesson 1, and the whole loop playing beside it. */
export function Hero({ firstHref }: { firstHref?: string }) {
  return (
    <section aria-labelledby="hero-title" className="hero page-frame">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">
          How does a robot learn to do what you&nbsp;say?
        </h1>
        <p className="hero-lead">
          By the end of this course you will understand how one model reads an instruction, looks through a camera and
          moves an arm, and how it learns all three from examples.
        </p>
        <p className="hero-actions">
          {firstHref ? (
            <Link href={firstHref} className="button button-primary hero-start">
              Start lesson 1
            </Link>
          ) : null}
          <Link href="/learn" className="button">
            See all lessons
          </Link>
        </p>
        <p className="hero-note">Free. One idea per lesson, each with a small animation. School maths is enough.</p>
      </div>
      <div className="hero-visual">
        <HeroAnimation />
      </div>
    </section>
  );
}
