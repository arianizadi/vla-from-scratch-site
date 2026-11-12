import Link from "next/link";
import { repoUrl, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="page-frame grid gap-8 py-10 text-14 text-ink-muted sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:gap-16">
        <div className="max-w-[420px]">
          <p className="text-16 font-bold text-ink stretch-90">{site.name}</p>
          <p className="mt-2">
            Every number on this site is copied from the{" "}
            <Link href="/lab" className="text-link">
              lab notebook
            </Link>
            .
          </p>
        </div>

        <nav aria-label="Pages">
          <h2 className="label text-ink-faint">Pages</h2>
          <ul className="mt-2 grid gap-1.5">
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
                Figure gallery
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Repositories">
          <h2 className="label text-ink-faint">Source</h2>
          <ul className="mt-2 grid gap-1.5">
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
          <h2 className="label text-ink-faint">Licence and credit</h2>
          <p className="mt-2">
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
