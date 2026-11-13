import type { Metadata } from "next";
import { FieldNotes } from "@/components/landing/FieldNotes";
import { Findings } from "@/components/landing/Findings";
import { Hero } from "@/components/landing/Hero";
import { LessonShowcase } from "@/components/landing/LessonShowcase";
import { PartsOverview } from "@/components/landing/PartsOverview";
import { QuickStart } from "@/components/landing/QuickStart";
import { StatusNote } from "@/components/landing/StatusNote";
import { listChapters, listParts } from "@/lib/content";
import { lessonIdeas } from "@/lessons";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** How many lessons the landing page offers to start with. */
const SHOWCASE = 3;

export default async function HomePage() {
  const chapters = listChapters();
  const ideas = await lessonIdeas();
  const withLessons = chapters.filter((chapter) => ideas.has(chapter.slug));
  const showcase = withLessons.slice(0, SHOWCASE).map((chapter) => ({
    chapter,
    idea: ideas.get(chapter.slug)?.idea ?? "",
    beats: ideas.get(chapter.slug)?.beats ?? 0,
  }));

  return (
    <main id="main" tabIndex={-1} className="pb-8 outline-none">
      <Hero chapters={chapters} firstLesson={withLessons[0]} />
      <LessonShowcase items={showcase} />
      <PartsOverview parts={listParts()} lessons={new Set(ideas.keys())} />
      <Findings chapters={chapters} />
      <FieldNotes />
      <QuickStart firstRun={chapters.find((chapter) => chapter.slug === "01-setup-and-first-run")} />
      <StatusNote chapters={chapters} />
    </main>
  );
}
