import Link from "next/link";
import { repoUrl, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-line bg-surface">
      <div className="page-frame grid gap-10 py-14 text-15 text-ink-muted sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:gap-16">
        <div className="max-w-[420px]">
          <p className="font-display text-28 leading-8 font-bold tracking-[-0.02em] text-ink">{site.name}</p>
          <p className="mt-3 text-16 leading-6">
            Every number on this site is copied from the{" "}
            <Link href="/lab" className="text-link">
              lab notebook
            </Link>
            .
          </p>
        </div>

        <nav aria-label="Pages">
          <h2 className="font-sans text-14 font-bold tracking-normal text-ink">Pages</h2>
          <ul className="mt-3 grid gap-2">
            <li>
              <Link href="/learn" className="text-link touch-target">
                Curriculum
              </Link>
            </li>
            <li>
              <Link href="/lab" className="text-link touch-target">
                Lab notebook
              </Link>
            </li>
            <li>
              <Link href="/figures" className="text-link touch-target">
                Interactive figures
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Repositories">
          <h2 className="font-sans text-14 font-bold tracking-normal text-ink">Source</h2>
          <ul className="mt-3 grid gap-2">
            <li>
              <a href={site.tutorialRepo} className="text-link touch-target">
                Tutorial, code and experiments
              </a>
            </li>
            <li>
              <a href={site.siteRepo} className="text-link touch-target">
                This website
              </a>
            </li>
          </ul>
        </nav>

        <div className="max-w-[320px]">
          <h2 className="font-sans text-14 font-bold tracking-normal text-ink">Licence and credit</h2>
          <p className="mt-3">
            Released under the{" "}
            <a href={repoUrl("LICENSE")} className="text-link">
              MIT licence
            </a>
            . Built on{" "}
            <a href={site.foundryRepo} className="text-link">
              VLA Foundry
            </a>{" "}
            by Toyota Research Institute.
          </p>
        </div>
      </div>
    </footer>
  );
}
