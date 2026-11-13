import type { Metadata } from "next";
import Link from "next/link";
import { CourseExtras, CourseOutline } from "@/components/curriculum/CourseOutline";
import { getCourse } from "@/lib/course";
import { lessonIdeas } from "@/lessons";

export const metadata: Metadata = {
  title: "The course",
  description:
    "Short lessons in order, from the big picture to testing a robot: how a model reads words, sees pictures, chooses movements and learns from examples.",
  alternates: { canonical: "/learn" },
};

export default async function LearnPage() {
  const course = getCourse();
  const ideas = await lessonIdeas();
  const first = course.lessons[0];
  const ready = new Map([...ideas].map(([slug, summary]) => [slug, { minutes: summary.minutes }]));

  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <header className="learn-header">
        <h1 className="learn-title">The course</h1>
        <p className="learn-lead">
          {course.lessons.length} short lessons in {course.modules.length} modules, from the big picture to testing a
          real robot. Each one explains one idea with a small animation. Go in order; no code needed.
        </p>
        {first ? (
          <p className="learn-actions">
            <Link href={`/learn/${first.slug}`} className="button button-primary">
              Start with lesson 1
            </Link>
            <span className="learn-actions-note">{first.title}</span>
          </p>
        ) : null}
      </header>

      <div className="mt-14 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[256px_minmax(0,1fr)] xl:gap-x-16">
        <nav aria-label="Modules" className="sticky top-24 hidden self-start lg:block">
          <ol className="learn-parts-nav">
            {course.modules.map((module) => (
              <li key={module.id}>
                <a href={`#${module.id}`}>
                  <span className="learn-parts-number" aria-hidden="true">
                    {module.number}
                  </span>
                  <span>{module.title}</span>
                </a>
              </li>
            ))}
            <li>
              <a href="#extras">
                <span className="learn-parts-number" aria-hidden="true" />
                <span>Beyond the course</span>
              </a>
            </li>
          </ol>
        </nav>

        <div className="max-w-[880px] min-w-0">
          <CourseOutline course={course} ready={ready} />
          <CourseExtras course={course} />
        </div>
      </div>
    </main>
  );
}
