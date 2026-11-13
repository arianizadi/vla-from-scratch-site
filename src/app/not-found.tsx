import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <div className="page-header max-w-[680px]">
        <h1 className="page-title">This page is not here</h1>
        <p className="page-lead">It may have moved. Every lesson is listed in the course.</p>
        <p className="mt-8 flex flex-wrap gap-3">
          <Link href="/learn" className="button button-primary">
            Open the course
          </Link>
          <Link href="/" className="button">
            Go to the start page
          </Link>
        </p>
      </div>
    </main>
  );
}
