// src/data/avoidMap.ts
// Fixed "avoid" vocabulary (Context.avoid), what each key excludes, and the JP keywords
// the rule-based parser uses to detect it. Also holds the family-safety filter.
// Reviewed by the human together with tagMapping.ts.

// A tag counts as present at or above this rank (genres have no rank; they always count).
// Individual keys can raise it with `minTagRank` when AniList applies the tag loosely.
export const AVOID_MIN_TAG_RANK = 40;

// Series longer than this count as "long-series".
export const LONG_SERIES_EPISODES = 26;

export const AVOID_KEYS = [
  "horror",
  "gore",
  "ecchi",
  "tragedy",
  "romance",
  "sports",
  "mecha",
  "isekai",
  "harem",
  "idol-music",
  "war",
  "cgi",
  "long-series",
] as const;

export type AvoidKey = (typeof AVOID_KEYS)[number];

// Display labels live in the dictionaries (src/i18n/ja.ts, en.ts → avoid).
type AvoidRule = {
  genres?: string[];
  tags?: string[];
  minTagRank?: number; // overrides AVOID_MIN_TAG_RANK for this key
  maxEpisodes?: number; // excludes titles with more episodes than this
  keywords: string[]; // JP + EN keywords for the rules parser (matched inside negated spans only)
};

export const AVOID_MAP: Record<AvoidKey, AvoidRule> = {
  horror: {
    genres: ["Horror"],
    tags: ["Cosmic Horror", "Zombie", "Ghost"],
    keywords: ["ホラー", "怖い", "こわい", "怖いの", "ゾンビ", "幽霊", "お化け", "horror", "scary", "zombie", "ghost"],
  },
  gore: {
    tags: ["Gore", "Body Horror", "Torture", "Cannibalism"],
    minTagRank: 60,
    keywords: ["グロ", "流血", "血", "残酷", "エグい", "gore", "gory", "blood", "bloody", "violence", "violent"],
  },
  ecchi: {
    genres: ["Ecchi"],
    tags: ["Nudity"],
    keywords: ["エロ", "エッチ", "お色気", "下ネタ", "セクシー", "ecchi", "fan service", "fanservice", "nsfw", "lewd", "sexual"],
  },
  tragedy: {
    tags: ["Tragedy", "Suicide"],
    minTagRank: 70, // Tragedy is on ~37% of titles at rank 40+
    keywords: ["鬱", "うつ", "悲しい", "泣ける", "泣く", "悲劇", "つらい", "辛い", "sad", "depressing", "tragic", "tragedy", "tearjerker", "crying"],
  },
  romance: {
    genres: ["Romance"],
    keywords: ["恋愛", "ラブコメ", "恋", "ラブ", "romance", "romantic", "love story", "rom-com", "romcom"],
  },
  sports: {
    genres: ["Sports"],
    keywords: ["スポーツ", "スポ根", "野球", "サッカー", "バスケ", "バレー", "sports", "sport", "baseball", "soccer", "football", "basketball", "volleyball"],
  },
  mecha: {
    genres: ["Mecha"],
    tags: ["Real Robot", "Super Robot"],
    keywords: ["ロボ", "ロボット", "メカ", "mecha", "robot", "giant robot"],
  },
  isekai: {
    tags: ["Isekai", "Reincarnation"],
    keywords: ["異世界", "転生", "isekai", "another world", "reincarnation"],
  },
  harem: {
    tags: ["Female Harem", "Male Harem", "Mixed Gender Harem"],
    minTagRank: 60,
    keywords: ["ハーレム", "harem"],
  },
  "idol-music": {
    genres: ["Music"],
    tags: ["Idol"],
    keywords: ["アイドル", "音楽", "歌", "idol", "music", "musical"],
  },
  war: {
    tags: ["War", "Military"],
    keywords: ["戦争", "軍隊", "軍事", "war", "military"],
  },
  cgi: {
    tags: ["Full CGI"], // plain "CGI" only means partial CG use
    keywords: ["CG", "ＣＧ", "3D", "cgi", "3d", "cg"],
  },
  "long-series": {
    maxEpisodes: LONG_SERIES_EPISODES,
    keywords: ["長編", "長いの", "長いやつ", "長いアニメ", "長い", "long series", "long", "too many episodes"],
  },
};

// Safe by default: always excluded from results, whatever the Context says. Never relaxed.
export const DEFAULT_EXCLUDE_GENRES = ["Ecchi"];

// Family filter (company === "family"): never relaxed.
export const FAMILY_EXCLUDE = {
  genres: ["Ecchi", "Horror"],
  minTagRank: 50,
  tags: [
    "Gore",
    "Body Horror",
    "Torture",
    "Cannibalism",
    "Nudity",
    "Rape",
    "Psychosexual",
    "Masturbation",
    "Bondage",
    "Incest",
    "Netorare",
    "Exhibitionism",
    "Hypersexuality",
    "Prostitution",
    "Ero Guro",
  ],
};
