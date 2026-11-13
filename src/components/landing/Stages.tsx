import Link from "next/link";
import { stages } from "@/data/lab";
import type { Part } from "@/lib/content";

type Modality = "language" | "vision" | "action";

/** What each stage adds, in plain words, and what it is made of. */
const ADDS: Record<number, { text: string; modalities: Modality[] }> = {
  1: { text: "Turns text into tokens and learns to predict the next one.", modalities: ["language"] },
  2: { text: "Cuts images into patches and reads them next to the words.", modalities: ["vision", "language"] },
  3: { text: "Adds an action head that turns what it sees and reads into arm motion.", modalities: ["vision", "language", "action"] },
};

const WORD: Record<Modality, string> = { language: "words", vision: "images", action: "actions" };

/**
 * The three models the course builds, each on top of the one before: what it
 * adds, and the result the lab notebook records for it.
 */
export function Stages({ parts }: { parts: Part[] }) {
  return (
    <ol className="stages">
      {stages.map((stage) => {
        const part = parts.find((candidate) => candidate.number === stage.part);
        const adds = ADDS[stage.number];
        return (
          <li key={stage.number} className="stage">
            <span className="stage-number" aria-hidden="true">
              {stage.number}
            </span>
            <h3 className="stage-name">
              {part ? (
                <Link href={`/learn#${part.id}`} className="stage-link">
                  {stage.name}
                </Link>
              ) : (
                stage.name
              )}
            </h3>
            {adds ? (
              <>
                <p className="stage-text">{adds.text}</p>
                <ul className="stage-modalities" aria-label="Works with">
                  {adds.modalities.map((modality) => (
                    <li key={modality} className={`modality modality-${modality}`}>
                      {WORD[modality]}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="stage-result">
              <span className="stage-result-label">Measured</span>
              {stage.result}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
