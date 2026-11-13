import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import type { NeighbourRef } from "@/lib/course";

interface ChapterPagerProps {
  previous?: NeighbourRef;
  next?: NeighbourRef;
  /** "/full" on technical pages, so the pager stays among them. */
  suffix?: string;
}

function PagerRow({ item, direction, suffix }: { item: NeighbourRef; direction: "previous" | "next"; suffix: string }) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/learn/${item.slug}${suffix}`}
      // The page itself, not only the route's shell: it is static, so this costs no server render.
      prefetch
      rel={isNext ? "next" : "prev"}
      className="pager-row group"
    >
      <span className="pager-direction">
        {isNext ? "Next" : "Previous"}
        {item.label ? <span className="pager-number">{item.label}</span> : null}
      </span>
      <span className="pager-title">{item.title}</span>
      <Glyph name={isNext ? "arrow-right" : "arrow-left"} className="pager-arrow" />
    </Link>
  );
}

/** Previous and next lesson in course order, as two rows. */
export function ChapterPager({ previous, next, suffix = "" }: ChapterPagerProps) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="Previous and next" className="pager">
      {previous ? <PagerRow item={previous} direction="previous" suffix={suffix} /> : null}
      {next ? <PagerRow item={next} direction="next" suffix={suffix} /> : null}
    </nav>
  );
}
