import type { Metadata } from "next";
import { MathSection } from "@/components/lesson/MathSection";
import example from "@/lessons/fixtures/math.example";
import { validateMath } from "@/lessons/validate";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "The math, step by step: preview",
  robots: { index: false },
};

/**
 * Shows the example math.ts (src/lessons/fixtures) the way a lesson shows its own, so the section
 * can be checked without touching a lesson folder. The build fails here if the example breaks a rule.
 */
export default function MathPreviewPage() {
  const { errors } = validateMath(example, "src/lessons/fixtures/math.example.ts");
  if (errors.length > 0) throw new Error(`[lessons] ${errors.join("\n- ")}`);
  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <div className="lesson max-w-[1040px]">
        <header className="page-header">
          <h1 className="page-title">The math, step by step</h1>
          <p className="page-lead">A preview of the optional maths section of a lesson, with the example from the authoring guide.</p>
        </header>
        <MathSection entries={example} />
      </div>
    </main>
  );
}
