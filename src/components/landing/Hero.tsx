import Link from "next/link";
import type { ChapterMeta } from "@/lib/content";
import { HeroPlate } from "./hero/HeroPlate";

/** Headline and two ways in on the left, the hero plate on the right. */
export function Hero({ firstChapter }: { firstChapter?: ChapterMeta }) {
  const start = firstChapter
    ? { href: `/learn/${firstChapter.slug}`, label: `Start at chapter ${firstChapter.order}` }
    : { href: "/learn", label: "Open the curriculum" };

  return (
    <section className="page-frame grid gap-x-8 gap-y-10 pt-10 xl:grid-cols-12 xl:pt-16">
      <div className="xl:col-span-5">
        <h1 className="text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-bold tracking-[-0.02em] text-balance stretch-80">
          From one sentence to a closed gripper
        </h1>
        <p className="mt-6 max-w-[520px] font-serif text-20 leading-[1.875rem] text-ink-muted">
          A hands-on guide to the models behind robot manipulation: a language model, a vision-language model
          and a vision-language-action policy, each built from the ground up and measured in a simulator.
        </p>
        <p className="mt-8 flex flex-wrap gap-3">
          <Link href={start.href} className="button button-primary">
            {start.label}
          </Link>
          <Link href="/lab" className="button">
            Open the lab notebook
          </Link>
        </p>
      </div>
      <div className="min-w-0 max-w-[820px] xl:col-span-7">
        <HeroPlate />
      </div>
    </section>
  );
}
