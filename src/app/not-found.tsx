import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <div className="max-w-[680px] pt-10 lg:pt-14">
        <p className="label text-ink-faint">Error 404</p>
        <h1 className="mt-2 text-[2rem] leading-9 font-semibold stretch-90 sm:text-44 sm:leading-[3rem]">
          There is no page at this address
        </h1>
        <p className="mt-4 font-serif text-20 leading-[1.875rem] text-ink-muted">
          The chapter may have been renamed or not written yet. The curriculum lists every chapter that exists.
        </p>
        <p className="mt-8 flex flex-wrap gap-3">
          <Link href="/learn" className="button button-primary">
            Open the curriculum
          </Link>
          <Link href="/" className="button">
            Go to the start page
          </Link>
        </p>
      </div>
    </main>
  );
}
