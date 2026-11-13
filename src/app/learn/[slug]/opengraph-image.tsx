import { getAllChapters, getChapter } from "@/lib/content";
import { courseBlurb, courseLesson, courseTitle } from "@/lib/course";
import { lessonTitles } from "@/lessons";
import { ogImage, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `A lesson of ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllChapters().map((chapter) => ({ slug: chapter.slug }));
}

/** The picture shown when a link to a lesson is shared: its number, its title and what it teaches. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return ogImage({ title: site.name });
  const titles = await lessonTitles();
  const place = courseLesson(slug);
  return ogImage({
    kicker: place ? `Lesson ${place.number}: ${place.module.title}` : undefined,
    title: courseTitle(chapter, titles),
    line: courseBlurb(chapter) || undefined,
  });
}
