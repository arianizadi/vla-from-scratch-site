import type { Metadata } from "next";
import { Evidence } from "@/components/landing/Evidence";
import { Hero } from "@/components/landing/Hero";
import { PartsOverview } from "@/components/landing/PartsOverview";
import { StatementKey } from "@/components/landing/StatementKey";
import { StatusNote } from "@/components/landing/StatusNote";
import { listChapters, listParts } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const chapters = listChapters();
  return (
    <main id="main" tabIndex={-1} className="pb-8 outline-none">
      <Hero firstChapter={chapters[0]} />
      <StatusNote chapters={chapters} />
      <Evidence />
      <StatementKey />
      <PartsOverview parts={listParts()} />
    </main>
  );
}
