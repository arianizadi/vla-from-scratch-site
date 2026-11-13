import type { MathEntry, MathTone } from "@/lessons/define";
import { DEFAULT_TONES, colourSymbols, exampleSteps, renderTex, splitMath } from "@/lib/math";
import { Inline } from "./Inline";

/** Plain text with $...$ maths and the lesson's inline marks. */
export function MathText({ text }: { text: string }) {
  const parts: { math: boolean; text: string; trail?: string }[] = splitMath(text);
  // A full stop or comma right after a formula stays on its line.
  for (let index = 0; index < parts.length - 1; index += 1) {
    const next = parts[index + 1];
    const punctuation = parts[index].math && !next.math ? /^[.,;:!?]+/.exec(next.text)?.[0] : undefined;
    if (punctuation) {
      parts[index] = { ...parts[index], trail: punctuation };
      parts[index + 1] = { ...next, text: next.text.slice(punctuation.length) };
    }
  }
  return (
    <>
      {parts.map((part, index) =>
        part.math ? (
          <span key={index} className="math-inline">
            <span dangerouslySetInnerHTML={{ __html: renderTex(part.text) }} />
            {part.trail}
          </span>
        ) : (
          <Inline key={index} text={part.text} />
        ),
      )}
    </>
  );
}

function tones(entry: MathEntry): { tex: string; meaning: string; tone: MathTone }[] {
  let next = 0;
  return entry.symbols.map((symbol) => {
    const [tex, meaning, tone] = symbol as readonly [string, string, MathTone?];
    return { tex, meaning, tone: tone ?? DEFAULT_TONES[next++ % DEFAULT_TONES.length] };
  });
}

function PictureGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="math-glyph">
      <circle cx="10" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 15.5h5M8.5 18h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MathCard({ entry, index, total }: { entry: MathEntry; index: number; total: number }) {
  const symbols = tones(entry);
  const formula = colourSymbols(entry.formula, symbols);
  const steps = exampleSteps(entry.example);
  const Animation = entry.animation;
  const id = `math-${index + 1}`;
  return (
    <li className="math-card" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="math-card-title">
        {total > 1 ? (
          <span className="math-card-number" aria-hidden="true">
            {index + 1}
          </span>
        ) : null}
        {entry.title}
      </h3>

      <div className="math-formula" dangerouslySetInnerHTML={{ __html: renderTex(formula, true) }} />

      <dl className="math-symbols" aria-label="What each symbol means">
        {symbols.map((symbol) => (
          <div key={symbol.tex} className="math-symbol">
            <dt className={`math-symbol-tex msym-${symbol.tone}`} dangerouslySetInnerHTML={{ __html: renderTex(symbol.tex) }} />
            <dd>
              <MathText text={symbol.meaning} />
            </dd>
          </div>
        ))}
      </dl>

      {Animation ? (
        <div className="math-visual">
          <Animation />
        </div>
      ) : null}

      <div className="math-pair">
        <aside className="math-metaphor" aria-label="Think of it like this">
          <p className="math-label">
            <PictureGlyph />
            Think of it like this
          </p>
          <p className="math-metaphor-text">
            <MathText text={entry.metaphor} />
          </p>
        </aside>
        <section className="math-example" aria-label="A worked example">
          <p className="math-label">A worked example</p>
          <ol className="math-steps">
            {steps.map((step, at) => (
              <li key={at}>
                <MathText text={step} />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </li>
  );
}

/** "The math, step by step": each formula with its symbols explained, one picture and one tiny worked example. */
export function MathSection({ entries, id = "math" }: { entries: MathEntry[]; id?: string }) {
  if (entries.length === 0) return null;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="lesson-math">
      <h2 id={`${id}-title`} className="lesson-section-title">
        The math, step by step
      </h2>
      <p className="lesson-section-lead">
        {entries.length === 1 ? "One formula" : `${entries.length} formulas`}, every symbol in colour and in words, then a
        small example worked by hand.
      </p>
      <ol className="math-cards">
        {entries.map((entry, index) => (
          <MathCard key={entry.title} entry={entry} index={index} total={entries.length} />
        ))}
      </ol>
    </section>
  );
}
