// scripts/showcase.ts
// The fixed benchmark sentences. Rerun after every scoring/mapping change and compare.
// Run: npm run showcase
// Columns: cos = cosine, int = intensity (raw 0..1), qual = weighted quality, adj = energy + prequel + short-series.
import { printResults } from "./printResults";

export const SHOWCASE = [
  "仕事で疲れた。寝る前に30分だけ笑えるやつ",
  "週末に一気見できる、泣ける作品",
  "家族で見られる、ワクワクするもの",
  "恋愛ものが見たい、でも重いのは嫌",
  "進撃の巨人みたいなやつ",
  "5分だけ時間ある",
];

async function main() {
  console.log("# Showcase");
  for (const text of SHOWCASE) await printResults(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
