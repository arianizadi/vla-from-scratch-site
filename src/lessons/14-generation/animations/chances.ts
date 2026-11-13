/**
 * The chapter's four-word example, computed: logits 2, 1, 0 and -1 for red,
 * green, blue and yellow, turned into chances at a temperature, with an
 * optional tail cut (top-p). Rounded to three decimals so server and browser
 * draw the same.
 */

export const WORDS = ["red", "green", "blue", "yellow"];
const LOGITS = [2, 1, 0, -1];

const round = (value: number) => Math.round(value * 1000) / 1000;

export function chances(temperature: number, topP?: number): number[] {
  const exps = LOGITS.map((logit) => Math.exp(logit / temperature));
  const total = exps.reduce((sum, value) => sum + value, 0);
  const plain = exps.map((value) => value / total);
  if (topP === undefined) return plain.map(round);
  // Keep the shortest run of top words whose chances add up to more than p.
  let running = 0;
  const kept = plain.map((value) => {
    const keep = running <= topP;
    running += value;
    return keep;
  });
  const keptTotal = plain.reduce((sum, value, index) => sum + (kept[index] ? value : 0), 0);
  return plain.map((value, index) => round(kept[index] ? value / keptTotal : 0));
}
