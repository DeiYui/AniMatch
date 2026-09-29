// src/data/avoidMap.ts
// Fixed "avoid" vocabulary (Context.avoid), what each key excludes, and the JP keywords
// the rule-based parser uses to detect it. Also holds the family-safety filter.
// Reviewed by the human together with tagMapping.ts.

// A tag counts as present at or above this rank (genres have no rank; they always count).
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

type AvoidRule = {
  label: string; // Japanese label for chips, e.g. 「ホラーなし」
  genres?: string[];
  tags?: string[];
  maxEpisodes?: number; // excludes titles with more episodes than this
  keywords: string[]; // JP keywords for the rules parser (matched inside negated spans)
};

export const AVOID_MAP: Record<AvoidKey, AvoidRule> = {
  horror: {
    label: "ホラー",
    genres: ["Horror"],
    tags: ["Cosmic Horror", "Zombie", "Ghost"],
    keywords: ["ホラー", "怖い", "こわい", "怖いの", "ゾンビ", "幽霊", "お化け"],
  },
  gore: {
    label: "グロ",
    tags: ["Gore", "Body Horror", "Torture", "Cannibalism"],
    keywords: ["グロ", "流血", "血", "残酷", "エグい"],
  },
  ecchi: {
    label: "お色気",
    genres: ["Ecchi"],
    tags: ["Nudity"],
    keywords: ["エロ", "エッチ", "お色気", "下ネタ", "セクシー"],
  },
  tragedy: {
    label: "悲劇・鬱展開",
    tags: ["Tragedy", "Suicide"],
    keywords: ["鬱", "うつ", "悲しい", "泣ける", "泣く", "悲劇", "つらい", "辛い"],
  },
  romance: {
    label: "恋愛",
    genres: ["Romance"],
    keywords: ["恋愛", "ラブコメ", "恋", "ラブ"],
  },
  sports: {
    label: "スポーツ",
    genres: ["Sports"],
    keywords: ["スポーツ", "スポ根", "野球", "サッカー", "バスケ", "バレー"],
  },
  mecha: {
    label: "ロボット",
    genres: ["Mecha"],
    tags: ["Real Robot", "Super Robot"],
    keywords: ["ロボ", "ロボット", "メカ"],
  },
  isekai: {
    label: "異世界",
    tags: ["Isekai", "Reincarnation"],
    keywords: ["異世界", "転生"],
  },
  harem: {
    label: "ハーレム",
    tags: ["Female Harem", "Male Harem", "Mixed Gender Harem"],
    keywords: ["ハーレム"],
  },
  "idol-music": {
    label: "アイドル・音楽",
    genres: ["Music"],
    tags: ["Idol"],
    keywords: ["アイドル", "音楽", "歌"],
  },
  war: {
    label: "戦争",
    tags: ["War", "Military"],
    keywords: ["戦争", "軍隊", "軍事"],
  },
  cgi: {
    label: "3DCG",
    tags: ["Full CGI", "CGI"],
    keywords: ["CG", "ＣＧ", "3D"],
  },
  "long-series": {
    label: "長編",
    maxEpisodes: LONG_SERIES_EPISODES,
    keywords: ["長編", "長いの", "長いやつ", "長いアニメ", "長い"],
  },
};

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
