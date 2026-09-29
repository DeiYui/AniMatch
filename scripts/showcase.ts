// scripts/showcase.ts
// The fixed benchmark sentences. Rerun after every scoring/mapping change and compare.
// Prints the results and appends them to docs/showcase-log.md with the date and git commit.
// Always uses the rules parser, so the log compares ranking changes, not LLM variance.
// Run: npm run showcase [-- "short label for this run"]
// Columns (raw 0..1): cos = cosine, int = intensity, theme = theme match, qual = averageScore/100;
//          adj = energy + prequel + long-series + short-series + era + popularity. "mode" = scoring mode.
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { formatResults } from "./printResults";

export const SHOWCASE = [
  "仕事で疲れた。寝る前に30分だけ笑えるやつ",
  "週末に一気見できる、泣ける作品",
  "家族で見られる、ワクワクするもの",
  "恋愛ものが見たい、でも重いのは嫌",
  "進撃の巨人みたいなやつ",
  "5分だけ時間ある",
  // format / completed-only / era / popularity (added with those conditions)
  "最近の完結済みで、隠れた名作の泣けるアニメ",
  "映画で、昔の名作が見たい",
  // English (added with the JA/EN UI); same intents as above where possible.
  "Tired from work. Something funny for 30 minutes before bed",
  "A tearjerker I can binge this weekend",
  "Something exciting to watch with my family",
  "Romance, but nothing too heavy",
  "Something like Attack on Titan",
  "I only have 5 minutes",
  // themes, exact titles, non-anime references, and requests we can't answer (added with themes / intent)
  "cooking",
  "スポーツもので熱くなりたい",
  "ハリー・ポッターみたいな",
  "鬼滅の刃",
  "今日の天気は？",
  "asdfgh",
];

const LOG_PATH = resolve(__dirname, "../docs/showcase-log.md");
const LOG_HEADER = `# Showcase log

Before/after history of \`npm run showcase\`. Newest run at the bottom.
Columns: cos = cosine, int = intensity (0..1), qual = weighted quality (averageScore/100 × 0.2), adj = energy + prequel + long-series + short-series adjustments.
`;

function gitVersion(): string {
  try {
    const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim() !== "";
    return dirty ? `${hash} + uncommitted changes` : hash;
  } catch {
    return "unknown (not a git checkout)";
  }
}

async function main() {
  const label = process.argv.slice(2).join(" ").trim();
  const now = new Date();
  const date = `${now.toLocaleDateString("sv-SE")} ${now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;

  const sections = [];
  for (const text of SHOWCASE) sections.push(await formatResults(text));

  const run = [`## ${date} — ${gitVersion()}${label ? ` — ${label}` : ""}`, "", ...sections].join("\n");
  console.log(run);

  if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, LOG_HEADER);
  appendFileSync(LOG_PATH, "\n" + run);
  console.log(`\nAppended to ${LOG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
