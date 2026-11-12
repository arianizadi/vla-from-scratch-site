import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import type { ChapterMeta } from "@/lib/content";

interface ChapterPagerProps {
  previous?: ChapterMeta;
  next?: ChapterMeta;
}

function PagerRow({ chapter, direction }: { chapter: ChapterMeta; direction: "previous" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/learn/${chapter.slug}`}
      // The chapter itself, not only the route's shell: it is static, so this costs no server render.
      prefetch
      rel={isNext ? "next" : "prev"}
      className="group grid grid-cols-[72px_28px_minmax(0,1fr)_16px] items-baseline gap-x-3 border-t border-line py-4 no-underline last:border-b"
    >
      <span className="label text-ink-faint">{isNext ? "Next" : "Previous"}</span>
      <span className="text-14 text-ink-faint tabular-nums">{chapter.orderLabel}</span>
      <span className="text-18 leading-6 font-semibold text-ink group-hover:text-accent">{chapter.title}</span>
      <Glyph name={isNext ? "arrow-right" : "arrow-left"} className="self-center text-ink-faint group-hover:text-accent" />
    </Link>
  );
}

/** Previous and next chapter in reading order, as two rows. */
export function ChapterPager({ previous, next }: ChapterPagerProps) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="Previous and next chapter" className="mt-16 max-w-[680px]">
      {previous ? <PagerRow chapter={previous} direction="previous" /> : null}
      {next ? <PagerRow chapter={next} direction="next" /> : null}
    </nav>
  );
}
