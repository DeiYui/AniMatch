// scripts/report-vectors.ts
// Review aid for src/data/tagMapping.ts and src/data/avoidMap.ts. Prints Markdown.
// Run: npm run report:vectors
import { DATASET, type Title } from "../src/lib/dataset";
import { GENRE_WEIGHTS, TAG_WEIGHTS } from "../src/data/tagMapping";
import { AVOID_KEYS, AVOID_MAP, DEFAULT_EXCLUDE_GENRES, FAMILY_EXCLUDE } from "../src/data/avoidMap";
import { ja } from "../src/i18n/ja";
import { matchesAvoid, isExcludedByDefault, isFamilyUnsafe } from "../src/lib/engine/filters";
import { vectorizeAll, rawVector, GENRE_RANK, MIN_TAG_RANK, NORMALIZE_PERCENTILE } from "../src/lib/vectorize";
import { DIMENSIONS, cosineSimilarity, type Dimension } from "../src/lib/vector";

const { titles } = DATASET;
// Titles that can actually be recommended (safe-by-default policy applied).
const pool = titles.filter((t) => !isExcludedByDefault(t));
const name = (t: Title) => t.title.english ?? t.title.romaji ?? t.title.native ?? String(t.id);
const f2 = (x: number) => x.toFixed(2);

// Which genres/tags pushed this dimension up the most.
function topContributors(t: Title, dim: Dimension, n = 3): string {
  const parts: [string, number][] = [];
  for (const g of t.genres) {
    const w = GENRE_WEIGHTS[g]?.[dim];
    if (w) parts.push([g, (w * GENRE_RANK) / 100]);
  }
  for (const tag of t.tags) {
    const w = TAG_WEIGHTS[tag.name]?.[dim];
    if (w && tag.rank >= MIN_TAG_RANK) parts.push([`${tag.name} ${tag.rank}`, (w * tag.rank) / 100]);
  }
  return parts
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label]) => label)
    .join(", ");
}

// 1. Mapping names that don't exist in the data (typos or unused).
const genresInData = new Set(titles.flatMap((t) => t.genres));
const tagsInData = new Set(titles.flatMap((t) => t.tags.map((x) => x.name)));
const unknown = [
  ...Object.keys(GENRE_WEIGHTS).filter((g) => !genresInData.has(g)).map((g) => `genre "${g}"`),
  ...Object.keys(TAG_WEIGHTS).filter((t) => !tagsInData.has(t)).map((t) => `tag "${t}"`),
  ...AVOID_KEYS.flatMap((k) => [
    ...(AVOID_MAP[k].genres ?? []).filter((g) => !genresInData.has(g)).map((g) => `avoid ${k}: genre "${g}"`),
    ...(AVOID_MAP[k].tags ?? []).filter((t) => !tagsInData.has(t)).map((t) => `avoid ${k}: tag "${t}"`),
  ]),
  ...FAMILY_EXCLUDE.tags.filter((t) => !tagsInData.has(t)).map((t) => `family: tag "${t}"`),
];
console.log(`# Vector report (${titles.length} titles; ${pool.length} recommendable after excluding ${DEFAULT_EXCLUDE_GENRES.join(", ")})\n`);
console.log(`## Names not found in the data\n\n${unknown.length ? unknown.map((u) => `- ${u}`).join("\n") : "(none)"}\n`);

// 2. Normalization scale.
const { scale } = vectorizeAll(titles);
console.log(`## p${Math.round(NORMALIZE_PERCENTILE * 100)} scale per dimension (raw value that maps to 1.0)\n`);
console.log(`| ${DIMENSIONS.join(" | ")} |\n|${DIMENSIONS.map(() => "---").join("|")}|`);
console.log(`| ${DIMENSIONS.map((d) => f2(scale[d])).join(" | ")} |\n`);
const zeros = titles.filter((t) => DIMENSIONS.every((d) => t.vector[d] === 0));
const saturated = DIMENSIONS.map((d) => `${d} ${titles.filter((t) => t.vector[d] >= 1).length}`);
console.log(`All-zero vectors: ${zeros.length}. Titles at 1.0 per dim: ${saturated.join(", ")}\n`);

// 3. Top 10 per dimension. Many titles clamp to 1.0, so rank by the raw (pre-normalization) value.
// heavy also includes runtime, so it is ranked by its final value. Default-excluded titles are left out.
const raws = new Map(titles.map((t) => [t.id, rawVector(t)]));
for (const dim of DIMENSIONS) {
  const key = (t: Title) => (dim === "heavy" ? t.vector[dim] : raws.get(t.id)![dim]);
  console.log(`## ${dim}\n\n| # | Title | final (raw) | Top contributors |\n|---|---|---|---|`);
  [...pool]
    .sort((a, b) => key(b) - key(a) || b.popularity - a.popularity)
    .slice(0, 10)
    .forEach((t, i) => {
      const extra = dim === "heavy" ? ` (${t.episodes}×${t.duration}min)` : "";
      const value = `${f2(t.vector[dim])} (${f2(raws.get(t.id)![dim])})`;
      console.log(`| ${i + 1} | ${name(t)} | ${value} | ${topContributors(t, dim)}${extra} |`);
    });
  console.log();
}

// 4. Well-known titles, as a sanity check.
const probes = ["Kimi no Na wa.", "Shingeki no Kyojin", "Sousou no Frieren", "DEATH NOTE", "SPY×FAMILY", "K-ON!", "Yuru Camp△", "Kaguya-sama wa Kokurasetai: Tensaitachi no Renai Zunousen"];
console.log(`## Sanity check\n\n| Title | ${DIMENSIONS.join(" | ")} |\n|---|${DIMENSIONS.map(() => "---").join("|")}|`);
for (const romaji of probes) {
  const t = titles.find((x) => x.title.romaji === romaji);
  if (t) console.log(`| ${name(t)} | ${DIMENSIONS.map((d) => f2(t.vector[d])).join(" | ")} |`);
  else console.log(`| (not found: ${romaji}) |`);
}
console.log();

// 5. Diversity preview: how often two different franchises are near-identical.
const sims: number[] = [];
for (let i = 0; i < titles.length; i++) {
  for (let j = i + 1; j < titles.length; j++) {
    if (titles[i].franchiseId !== titles[j].franchiseId) sims.push(cosineSimilarity(titles[i].vector, titles[j].vector));
  }
}
const share = (th: number) => `${((100 * sims.filter((s) => s > th).length) / sims.length).toFixed(2)}%`;
console.log("## Diversity preview (pairs from different franchises)\n");
console.log(`cosine > 0.90: ${share(0.9)}, > 0.95: ${share(0.95)}, > 0.98: ${share(0.98)}\n`);

// 6. Franchises.
const groups = new Map<number, Title[]>();
for (const t of titles) groups.set(t.franchiseId, [...(groups.get(t.franchiseId) ?? []), t]);
const multi = [...groups.values()].filter((g) => g.length > 1).sort((a, b) => b.length - a.length);
console.log(`## Franchises\n\n${groups.size} franchises; ${multi.length} have 2+ titles; ${titles.filter((t) => t.hasPrequelInDataset).length} titles have a prequel in the dataset.\n`);
console.log("Largest groups:\n");
for (const g of multi.slice(0, 5)) console.log(`- ${g.length}: ${g.slice(0, 6).map(name).join(" / ")}${g.length > 6 ? " / …" : ""}`);
console.log();

// 7. Avoid / family coverage.
const count = (list: Title[], pred: (t: Title) => boolean) => list.filter(pred).length;
console.log(`## Titles excluded\n\nDefault (${DEFAULT_EXCLUDE_GENRES.join(", ")}): ${count(titles, isExcludedByDefault)} of ${titles.length}.\n`);
console.log(`| Key | Label | of all ${titles.length} | of ${pool.length} recommendable |\n|---|---|---|---|`);
for (const k of AVOID_KEYS) {
  const pred = (t: Title) => matchesAvoid(t, k);
  console.log(`| ${k} | ${ja.avoid[k]} | ${count(titles, pred)} | ${count(pool, pred)} |`);
}
console.log(`| (family filter) | 家族向け | ${count(titles, isFamilyUnsafe)} | ${count(pool, isFamilyUnsafe)} |`);
