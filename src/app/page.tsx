import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { getCourse } from "@/lib/course";
import { lessonIdeas, lessonTitles } from "@/lessons";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const course = getCourse(await lessonTitles());
  const ideas = await lessonIdeas();
  const first = course.lessons[0];

  return (
    <main id="main" tabIndex={-1} className="pb-8 outline-none">
      <Hero firstHref={first ? `/learn/${first.slug}` : undefined} />

      {course.modules.length > 0 ? (
        <section aria-labelledby="modules-title" className="page-frame landing-section">
          <div className="section-intro">
            <h2 id="modules-title" className="section-title">
              What you will understand
            </h2>
            <p className="section-lead">
              {course.modules.length} modules, {course.lessons.length} short lessons, in the order the ideas build on
              each other.
            </p>
          </div>
          <ol className="modules">
            {course.modules.map((module) => {
              const ready = module.lessons.filter((lesson) => ideas.has(lesson.slug)).length;
              return (
                <li key={module.id}>
                  <Link href={`/learn#${module.id}`} className="module-card">
                    <span className="module-number" aria-hidden="true">
                      {module.number}
                    </span>
                    <span className="module-title">
                      <span className="sr-only">Module {module.number}: </span>
                      {module.title}
                    </span>
                    <span className="module-about">{module.about}</span>
                    <span className="module-meta">
                      {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
                      {ready > 0 ? `, ${ready} ready` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {first ? (
            <p className="modules-start">
              <Link href={`/learn/${first.slug}`} className="button button-primary">
                Start with lesson 1: {first.title}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Going further" className="page-frame landing-section landing-further">
        <p>
          <span className="landing-further-title">Curious how it holds up?</span>{" "}
          <Link href="/lab" className="text-link">
            See the experiments behind the lessons
          </Link>
          .
        </p>
        <p>
          <span className="landing-further-title">Want to try the code?</span>{" "}
          <Link href="/run-it-yourself" className="text-link">
            Run it yourself
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
