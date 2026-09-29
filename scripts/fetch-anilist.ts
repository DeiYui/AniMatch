// scripts/fetch-anilist.ts
// Fetch titles from AniList → src/data/anime.json.
// Run: npm run fetch:anilist                   the most popular titles (the set may change over time)
//      npm run fetch:anilist -- --keep-ids     refresh the SAME titles as the current anime.json, in the same
//                                              order (new fields, updated scores), so showcase runs stay comparable
import { readFileSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { AnimeSchema, FORMATS, RELATION_TYPES, type Anime } from "../src/lib/anime/schema";

const KEEP_IDS = process.argv.includes("--keep-ids");

const TARGET_COUNT = 1000;
const PER_PAGE = 50;
const MAX_PAGES = 30; // some titles get dropped, so fetch a bit beyond TARGET_COUNT
const REQUEST_INTERVAL_MS = 2500; // AniList currently allows ~30 req/min
const MAX_RETRIES = 5;
const OUT_PATH = resolve(__dirname, "../src/data/anime.json");

const QUERY = /* GraphQL */ `
  query ($page: Int, $perPage: Int, $ids: [Int]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false, id_in: $ids) {
        id
        title { native romaji english }
        synonyms
        genres
        tags { name rank isGeneralSpoiler isMediaSpoiler }
        format
        status
        seasonYear
        startDate { year }
        episodes
        duration
        averageScore
        popularity
        isAdult
        nextAiringEpisode { episode }
        coverImage { large color }
        siteUrl
        relations { edges { relationType node { id type } } }
      }
    }
  }
`;

type RawMedia = {
  id: number;
  title: { native: string | null; romaji: string | null; english: string | null };
  synonyms: string[] | null;
  genres: string[] | null;
  tags: { name: string; rank: number; isGeneralSpoiler: boolean; isMediaSpoiler: boolean }[] | null;
  format: string | null;
  status: string | null;
  seasonYear: number | null;
  startDate: { year: number | null } | null;
  episodes: number | null;
  duration: number | null;
  averageScore: number | null;
  popularity: number;
  isAdult: boolean;
  nextAiringEpisode: { episode: number } | null;
  coverImage: { large: string | null; color: string | null };
  siteUrl: string;
  relations: { edges: { relationType: string; node: { id: number; type: string } }[] };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page: number, ids?: number[]): Promise<{ media: RawMedia[]; hasNextPage: boolean }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE, ids } }),
    });

    if (res.status === 429 || res.status >= 500) {
      const retryAfterSec = Number(res.headers.get("retry-after")) || 60;
      console.warn(`  page ${page}: HTTP ${res.status}, retry ${attempt}/${MAX_RETRIES} in ${retryAfterSec}s`);
      await sleep(retryAfterSec * 1000);
      continue;
    }
    const json = await res.json();
    if (!res.ok || json.errors) {
      throw new Error(`page ${page}: HTTP ${res.status} ${JSON.stringify(json.errors ?? json)}`);
    }
    return { media: json.data.Page.media, hasNextPage: json.data.Page.pageInfo.hasNextPage };
  }
  throw new Error(`page ${page}: gave up after ${MAX_RETRIES} retries`);
}

// Returns the cleaned title, or the reason it was dropped.
function toAnime(m: RawMedia): Anime | string {
  if (m.isAdult) return "isAdult";
  if (!m.format || !(FORMATS as readonly string[]).includes(m.format)) return `format ${m.format}`;

  // Airing series have no final episode count; use episodes aired so far.
  const episodes = m.episodes ?? (m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : null);

  const candidate = {
    id: m.id,
    title: m.title,
    synonyms: m.synonyms ?? [],
    genres: m.genres ?? [],
    tags: (m.tags ?? []).map((t) => ({
      name: t.name,
      rank: t.rank,
      spoiler: t.isGeneralSpoiler || t.isMediaSpoiler,
    })),
    format: m.format,
    status: m.status,
    year: m.seasonYear ?? m.startDate?.year ?? null,
    episodes,
    duration: m.duration,
    averageScore: m.averageScore,
    popularity: m.popularity,
    coverImage: m.coverImage.large,
    coverColor: m.coverImage.color,
    siteUrl: m.siteUrl,
    relations: m.relations.edges
      .filter((e) => e.node.type === "ANIME" && (RELATION_TYPES as readonly string[]).includes(e.relationType))
      .map((e) => ({ type: e.relationType, id: e.node.id })),
  };

  const parsed = AnimeSchema.safeParse(candidate);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => i.path.join(".") || i.message).join(", ");
  }
  return parsed.data;
}

async function main() {
  const kept: Anime[] = [];
  const dropped = new Map<string, number>();

  if (KEEP_IDS) {
    const ids = (JSON.parse(readFileSync(OUT_PATH, "utf8")) as { id: number }[]).map((a) => a.id);
    const byId = new Map<number, Anime>();
    for (let i = 0; i < ids.length; i += PER_PAGE) {
      const { media } = await fetchPage(1, ids.slice(i, i + PER_PAGE));
      for (const m of media) {
        const result = toAnime(m);
        if (typeof result === "string") dropped.set(result, (dropped.get(result) ?? 0) + 1);
        else byId.set(result.id, result);
      }
      console.log(`ids ${i + 1}–${Math.min(i + PER_PAGE, ids.length)}: kept ${byId.size}`);
      if (i + PER_PAGE < ids.length) await sleep(REQUEST_INTERVAL_MS);
    }
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) console.log(`Not returned or dropped: ${missing.join(", ")}`);
    kept.push(...ids.flatMap((id) => byId.get(id) ?? []));
    return write(kept, dropped);
  }

  for (let page = 1; page <= MAX_PAGES && kept.length < TARGET_COUNT; page++) {
    const { media, hasNextPage } = await fetchPage(page);
    for (const m of media) {
      const result = toAnime(m);
      if (typeof result === "string") dropped.set(result, (dropped.get(result) ?? 0) + 1);
      else if (kept.length < TARGET_COUNT) kept.push(result);
    }
    console.log(`page ${page}: kept ${kept.length}`);
    if (!hasNextPage) break;
    await sleep(REQUEST_INTERVAL_MS);
  }

  return write(kept, dropped);
}

function write(kept: Anime[], dropped: Map<string, number>) {
  // One title per line: small diffs when re-fetching, still valid JSON.
  const body = "[\n" + kept.map((a) => JSON.stringify(a)).join(",\n") + "\n]\n";
  writeFileSync(OUT_PATH, body);

  console.log(`\nWrote ${kept.length} titles to ${OUT_PATH}`);
  console.log("Dropped:", Object.fromEntries(dropped));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
