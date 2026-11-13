import { getAllChapters, getChapter } from "@/lib/content";
import { courseTitle } from "@/lib/course";
import { lessonTitles } from "@/lessons";
import { ogImage, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `The technical details of a lesson of ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllChapters().map((chapter) => ({ slug: chapter.slug }));
}

/** The picture shown when a link to a technical page is shared. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return ogImage({ title: site.name });
  return ogImage({
    kicker: "Technical details",
    title: courseTitle(chapter, await lessonTitles()),
    line: "The code, the exact numbers and how they were measured.",
  });
}
