import { ogImage, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

/** The picture shown when a link to the site is shared. */
export default function Image() {
  return ogImage({ title: "How robots learn to follow instructions", line: "A short, animated course, one idea at a time." });
}
