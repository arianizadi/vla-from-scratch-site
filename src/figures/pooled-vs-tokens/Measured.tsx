"use client";

import { useId } from "react";
import { StampMark } from "@/figures/kit";
import type { Measured as MeasuredData, MeasuredResult } from "./model";
import { styles } from "./classes";

/** One policy: what reached its action head, its success with the 95% interval, and both on a 0 to 100% line. */
function Result({ result }: { result: MeasuredResult }) {
  return (
    <div className={styles.result}>
      <dt className={styles.small}>{result.reaches}</dt>
      <dd>
        <span className={styles.value}>{result.success}</span>{" "}
        <span className={`${styles.small} ${styles.interval}`}>95% interval {result.interval}</span>
      </dd>
      <dd aria-hidden="true">
        <span className={styles.track}>
          <span
            className={styles.whisker}
            style={{ left: `${result.low * 100}%`, width: `${(result.high - result.low) * 100}%` }}
          />
          <span className={styles.dot} style={{ left: `${result.rate * 100}%` }} />
        </span>
        <span className={`${styles.scale} ${styles.small} ${styles.faint}`}>
          <span>0%</span>
          <span>100%</span>
        </span>
      </dd>
      <dd className={`${styles.small} ${styles.policy}`}>
        {result.policy}; {result.parametersM}M parameters
      </dd>
    </div>
  );
}

/**
 * The two notebook rows that differ in what reaches the action head, under
 * the two columns of the drawing they belong to: patch tokens on the left,
 * the pooled vector on the right.
 */
export function Measured({ data }: { data: MeasuredData }) {
  const headingId = useId();
  return (
    <section className={styles.measured} aria-labelledby={headingId}>
      <div className={styles.measuredHead}>
        <h3 id={headingId} className={styles.title}>
          Measured on <code>pick_cube</code>, {data.task}
        </h3>
        <StampMark stamp="measured" />
      </div>
      <dl className={styles.results}>
        <Result result={data.tokens} />
        <Result result={data.pooled} />
      </dl>
      <div className={`${styles.measuredFoot} ${styles.small}`}>
        <p className={styles.measuredCaveat}>
          Not a controlled test of pooling: the two policies also differ in pretraining, patch size, model size and
          text input, and CLIP&rsquo;s pooled vector is its class token, not the mean drawn above.
        </p>
        <p>
          {capitalised(data.machine)}, {data.demos} demonstrations, {data.samples} training samples, {data.episodes}{" "}
          closed-loop episodes per policy on layouts it never saw. Lab notebook, &ldquo;{data.section}&rdquo;.
        </p>
      </div>
    </section>
  );
}

const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
