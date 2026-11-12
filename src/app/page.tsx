import type { Metadata } from "next";
import { FieldNotes } from "@/components/landing/FieldNotes";
import { Findings } from "@/components/landing/Findings";
import { Hero } from "@/components/landing/Hero";
import { PartsOverview } from "@/components/landing/PartsOverview";
import { QuickStart } from "@/components/landing/QuickStart";
import { StatusNote } from "@/components/landing/StatusNote";
import { listChapters, listParts } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const chapters = listChapters();
  return (
    <main id="main" tabIndex={-1} className="pb-8 outline-none">
      <Hero chapters={chapters} />
      <StatusNote chapters={chapters} />
      <PartsOverview parts={listParts()} />
      <Findings chapters={chapters} />
      <FieldNotes />
      <QuickStart firstRun={chapters.find((chapter) => chapter.slug === "01-setup-and-first-run")} />
    </main>
  );
}
