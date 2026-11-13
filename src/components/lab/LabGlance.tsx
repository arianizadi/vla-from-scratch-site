import Link from "next/link";
import { bigNumbers } from "@/components/landing/Findings";
import { pruning } from "@/data/notebook";
import type { Count } from "@/data/types";
import { SECTIONS } from "./sections";
import "./glance.css";

/** "77–84" for counts out of the same number of tries, one per training seed. */
function span(counts: Count[]): { value: string; of: number } {
  const values = counts.map((count) => count.successes).sort((a, b) => a - b);
  const low = values[0];
  const high = values[values.length - 1];
  return { value: low === high ? `${low}` : `${low}–${high}`, of: counts[0]?.episodes ?? 100 };
}

/**
 * The top of the lab page: the newest results (pruning a potted plant) as
 * plain headlines with one big number each, the two newest films, and below
 * them the first headline results. Every number comes from notebook.json or
 * findings.json.
 */
export function LabGlance() {
  const one = span(pruning.one.pruned);
  const turn = span(pruning.turn.pruned);
  const full = span(pruning.full.pruned);
  const filmed = pruning.full.film.result.split("/");

  const results = [
    {
      value: one.value,
      of: one.of,
      title: "It cuts a side shoot off the stem.",
      text: "One shoot, already facing the robot. Two training runs that differ only in their random start both land here.",
    },
    {
      value: turn.value,
      of: turn.of,
      title: "It turns the plant first, then cuts.",
      text: "The shoot can point any way. The robot holds a button only when the shoot faces away, and lets go once it faces the arm.",
    },
    {
      value: full.value,
      of: full.of,
      title: "It prunes the whole plant.",
      text: "Two or three shoots: turn, cut, turn, cut. This needed a longer training run. Two of three runs land near 80; the third learned late. Most misses run out of time.",
    },
  ];

  const films = [
    {
      name: pruning.turn.film.name,
      size: [1920, 1080],
      title: "Turn the plant, then cut",
      caption: `The learned policy partway through training, when it pruned ${pruning.turn.film.pruned.successes} of ${pruning.turn.film.pruned.episodes}.`,
    },
    {
      name: pruning.full.film.name,
      size: [1280, 720],
      title: "Prune the whole plant",
      caption: `The learned policy partway through training, when it pruned ${filmed[0]} of ${filmed[1]}. Quiet stretches play at double speed.`,
    },
  ];

  const earlier = bigNumbers();

  return (
    <section aria-labelledby="glance-title" className="lab-glance prune-glance">
      <p className="prune-kicker">Newest</p>
      <h2 id="glance-title" className="prune-title">
        A robot learns to prune a potted plant
      </h2>
      <p className="prune-lead">
        The plant stands on a turntable with two buttons. The robot must cut every side shoot off the main stem and
        leave the flower untouched: touching the flower counts as a failure.
      </p>

      <ul className="prune-results">
        {results.map((result) => (
          <li key={result.title} className="prune-result">
            <p className="prune-number">
              <span className="prune-number-value">{result.value}</span>
              <span className="prune-number-of">of {result.of} tries</span>
            </p>
            <h3 className="prune-result-title">{result.title}</h3>
            <p className="prune-result-text">{result.text}</p>
          </li>
        ))}
      </ul>

      <div className="prune-films">
        {films.map((film) => (
          <figure key={film.name} className="lab-glance-film">
            <video
              controls
              preload="none"
              playsInline
              muted
              poster={`/video/${film.name}.jpg`}
              width={film.size[0]}
              height={film.size[1]}
              aria-label={film.title}
            >
              <source src={`/video/${film.name}.mp4`} type="video/mp4" />
              <a href={`/video/${film.name}.mp4`} className="text-link">
                {film.title} (MP4)
              </a>
            </video>
            <figcaption>
              <strong>{film.title}.</strong> {film.caption}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="prune-note">
        In both films a script opens the jaws and pulls the arm back after the last cut, so you can see the plant.{" "}
        <Link href={`#${SECTIONS.flower.id}`} className="text-link">
          Every step toward pruning, with its numbers
        </Link>
      </p>

      {earlier.length > 0 ? (
        <div className="prune-earlier">
          <h3 className="prune-earlier-title">Where it started: picking up the object a sentence names</h3>
          <ul className="big-numbers lab-glance-numbers">
            {earlier.map((item) => (
              <li key={item.value}>
                <a href={item.href.replace(/^\/lab/, "")} className="big-number">
                  <span className="big-number-value">{item.value}</span>
                  <span className="big-number-caption">{item.caption}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
