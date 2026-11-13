import Link from "next/link";
import { getCourse } from "@/lib/course";
import { repoUrl, site } from "@/lib/site";

export function Footer() {
  const first = getCourse().lessons[0];
  return (
    <footer className="mt-32 border-t border-line bg-surface">
      <div className="page-frame grid gap-10 py-14 text-15 text-ink-muted sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:gap-16">
        <div className="max-w-[420px]">
          <p className="font-display text-28 leading-8 font-bold tracking-[-0.02em] text-ink">{site.name}</p>
          <p className="mt-3 text-16 leading-6">
            A free course on how robots learn to follow instructions.{" "}
            {first ? (
              <>
                Start with{" "}
                <Link href={`/learn/${first.slug}`} className="text-link">
                  lesson 1
                </Link>
                .
              </>
            ) : null}
          </p>
        </div>

        <nav aria-label="Course">
          <h2 className="font-sans text-14 font-bold tracking-normal text-ink">Learn</h2>
          <ul className="mt-3 grid gap-2">
            <li>
              <Link href="/learn" className="text-link touch-target">
                The course
              </Link>
            </li>
            <li>
              <Link href="/learn/120-glossary" className="text-link touch-target">
                Glossary
              </Link>
            </li>
            <li>
              <Link href="/figures" className="text-link touch-target">
                Interactive figures
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Going further">
          <h2 className="font-sans text-14 font-bold tracking-normal text-ink">Going further</h2>
          <ul className="mt-3 grid gap-2">
            <li>
              <Link href="/lab" className="text-link touch-target">
                Experiments
              </Link>
            </li>
            <li>
              <Link href="/notes" className="text-link touch-target">
                Field notes
              </Link>
            </li>
            <li>
              <Link href="/run-it-yourself" className="text-link touch-target">
                Run it yourself
              </Link>
            </li>
            <li>
              <a href={site.tutorialRepo} className="text-link touch-target">
                GitHub
              </a>
            </li>
          </ul>
        </nav>

        <div className="max-w-[320px]">
          <h2 className="font-sans text-14 font-bold tracking-normal text-ink">Licence and credit</h2>
          <p className="mt-3">
            Free under the{" "}
            <a href={repoUrl("LICENSE")} className="text-link">
              MIT licence
            </a>
            . Built on{" "}
            <a href={site.foundryRepo} className="text-link">
              VLA Foundry
            </a>{" "}
            by Toyota Research Institute. The{" "}
            <a href={site.siteRepo} className="text-link">
              website&rsquo;s source
            </a>{" "}
            is open too.
          </p>
        </div>
      </div>
    </footer>
  );
}
