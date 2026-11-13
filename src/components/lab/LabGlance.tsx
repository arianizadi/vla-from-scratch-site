import Link from "next/link";
import { bigNumbers } from "@/components/landing/Findings";
import { formatCount } from "@/data/format";
import { flowerTrimming } from "@/data/notebook";
import { SECTIONS } from "./sections";

/**
 * The top of the lab page: the results to read first, as big numbers, and the
 * newest films. Every value comes from findings.json or notebook.json, which
 * `npm run sync` checks against the notebook.
 */
export function LabGlance() {
  const { films } = flowerTrimming.cut;
  const clips = [
    {
      name: films.cutOne.name,
      title: "One flower: cut the stem",
      caption: `With the corrected physics it cuts the stem in ${formatCount(films.cutOne.newPhysics.successes, films.cutOne.newPhysics.episodes)} unseen layouts.`,
    },
    {
      name: films.cutStem.name,
      title: "Three flowers: cut the one named",
      caption: `With the corrected physics it cuts the named stem in ${formatCount(films.cutStem.newPhysics.successes, films.cutStem.newPhysics.episodes)}.`,
    },
  ];

  return (
    <section aria-labelledby="glance-title" className="lab-glance">
      <h2 id="glance-title" className="sr-only">
        At a glance
      </h2>
      <ul className="big-numbers lab-glance-numbers">
        {bigNumbers().map((item) => (
          <li key={item.value}>
            <a href={item.href.replace(/^\/lab/, "")} className="big-number">
              <span className="big-number-value">{item.value}</span>
              <span className="big-number-caption">{item.caption}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="lab-glance-films">
        <div className="lab-glance-films-text">
          <h3 className="findings-plate-title">Newest: toward trimming a flower</h3>
          <p>
            The next task: cut the stem the instruction names, among one or three flowers. The learned policy drives
            until the cut; a script then opens the jaws so the top can be seen to fall.
          </p>
          <p>
            <Link href={`#${SECTIONS.flower.id}`} className="text-link">
              Every step and its numbers
            </Link>
          </p>
        </div>
        {clips.map((clip) => (
          <figure key={clip.name} className="lab-glance-film">
            <video controls preload="none" playsInline muted poster={`/video/${clip.name}.jpg`} width={1920} height={1080} aria-label={clip.title}>
              <source src={`/video/${clip.name}.mp4`} type="video/mp4" />
              <a href={`/video/${clip.name}.mp4`} className="text-link">
                {clip.title} (MP4)
              </a>
            </video>
            <figcaption>
              <strong>{clip.title}.</strong> {clip.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
