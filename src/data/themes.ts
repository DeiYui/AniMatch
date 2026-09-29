// src/data/themes.ts
// Themes = what a show is ABOUT (subject, setting, positive genre): 料理, スポーツ, 宇宙, 吸血鬼…
// Moods (tagMapping.ts) say how it should FEEL; themes say what it should be about. Reviewed by the human.
//
// Each theme maps to AniList genres and/or tags. A title's match for a theme is its strongest one of those:
// tag rank / 100, and a genre counts as THEME_GENRE_RANK (see rank.ts). Excluded on purpose: technical tags
// (CGI…), meta, cast make-up (Male Protagonist…), spoiler and sexual tags, and harem.
//
// Keywords are for the rule-based parser (the LLM picks from the keys). Japanese keywords match as substrings,
// ASCII ones as whole words. Avoid keywords that are also everyday words in other senses
// (仕事 in 「仕事で疲れた」, "work" in "tired from work", 家族 in 「家族で見る」).

export type ThemeDef = {
  ja: string;
  en: string;
  genres?: string[];
  tags?: string[];
  kwJa: string[];
  kwEn: string[];
};

const T = (ja: string, en: string, source: { genres?: string[]; tags?: string[] }, kwJa: string[], kwEn: string[]): ThemeDef => ({
  ja,
  en,
  ...source,
  kwJa,
  kwEn,
});

export const THEMES = {
  // --- positive genres ---
  fantasy: T("ファンタジー", "Fantasy", { genres: ["Fantasy"] }, ["ファンタジー"], ["fantasy"]),
  "sci-fi": T("SF", "Sci-fi", { genres: ["Sci-Fi"] }, ["SF", "近未来", "サイエンスフィクション"], ["sci-fi", "scifi", "science fiction", "futuristic"]),
  supernatural: T("超常", "Supernatural", { genres: ["Supernatural"] }, ["超常", "怪異", "オカルト"], ["supernatural", "occult", "paranormal"]),
  "slice-of-life": T("日常系", "Slice of life", { genres: ["Slice of Life"] }, ["日常系", "日常もの"], ["slice of life"]),
  "magical-girl": T("魔法少女", "Magical girls", { genres: ["Mahou Shoujo"] }, ["魔法少女"], ["magical girl", "mahou shoujo"]),
  adventure: T("冒険", "Adventure", { genres: ["Adventure"] }, ["冒険"], ["adventure"]),
  mystery: T("ミステリー", "Mystery", { genres: ["Mystery"] }, ["ミステリー", "謎解き"], ["mystery", "mysteries", "whodunit"]),
  psychological: T("心理戦", "Psychological", { genres: ["Psychological"] }, ["心理戦", "頭脳戦", "サイコ"], ["psychological", "mind games"]),
  thriller: T("サスペンス", "Thriller", { genres: ["Thriller"] }, ["サスペンス", "スリラー"], ["thriller", "suspense"]),
  horror: T("ホラー", "Horror", { genres: ["Horror"], tags: ["Cosmic Horror"] }, ["ホラー"], ["horror"]),

  // --- sports & games ---
  sports: T("スポーツ", "Sports", { genres: ["Sports"], tags: ["Athletics"] }, ["スポーツ", "スポ根"], ["sports", "sport"]),
  baseball: T("野球", "Baseball", { tags: ["Baseball"] }, ["野球"], ["baseball"]),
  soccer: T("サッカー", "Soccer", { tags: ["Football"] }, ["サッカー"], ["soccer", "football"]),
  basketball: T("バスケ", "Basketball", { tags: ["Basketball"] }, ["バスケ"], ["basketball"]),
  volleyball: T("バレー", "Volleyball", { tags: ["Volleyball"] }, ["バレー"], ["volleyball"]),
  "racket-sports": T("ラケット競技", "Racket sports", { tags: ["Tennis", "Badminton", "Table Tennis"] }, ["テニス", "卓球", "バドミントン"], ["tennis", "badminton", "table tennis", "ping pong"]),
  swimming: T("水泳", "Swimming", { tags: ["Swimming"] }, ["水泳", "競泳"], ["swimming"]),
  "martial-arts": T("格闘技", "Martial arts", { tags: ["Martial Arts", "Boxing"] }, ["格闘", "武術", "カンフー", "ボクシング"], ["martial arts", "kung fu", "boxing", "karate"]),
  "video-games": T("ゲーム", "Video games", { tags: ["Video Games", "E-Sports"] }, ["テレビゲーム", "ゲーマー", "eスポーツ"], ["video game", "gaming", "gamer", "esports"]),
  "virtual-world": T("仮想世界", "Virtual worlds", { tags: ["Virtual World", "Augmented Reality"] }, ["仮想世界", "ゲームの世界", "VRMMO", "VR"], ["virtual world", "vr", "mmo", "vrmmo"]),
  "board-games": T("将棋・カード", "Board & card games", { tags: ["Board Game", "Shogi", "Card Battle", "Karuta"] }, ["将棋", "囲碁", "ボードゲーム", "カードゲーム", "かるた"], ["shogi", "board game", "card game", "chess"]),
  gambling: T("ギャンブル", "Gambling", { tags: ["Gambling", "Mahjong", "Poker"] }, ["ギャンブル", "賭け", "麻雀"], ["gambling", "poker", "mahjong"]),

  // --- music & performing ---
  music: T("音楽", "Music", { genres: ["Music"], tags: ["Classical Music"] }, ["音楽もの", "音楽"], ["music", "musical", "musician"]),
  band: T("バンド", "Bands", { tags: ["Band", "Rock Music"] }, ["バンド", "軽音"], ["band", "rock band"]),
  idols: T("アイドル", "Idols", { tags: ["Idol"] }, ["アイドル"], ["idol", "idols"]),
  showbiz: T("芸能・演劇", "Showbiz & acting", { tags: ["Acting"] }, ["芸能", "演劇", "役者", "声優"], ["acting", "actor", "theater", "theatre", "showbiz"]),
  "art-creation": T("創作", "Making art", { tags: ["Drawing", "Writing", "Filmmaking", "Photography"] }, ["漫画家", "小説家", "創作", "映画づくり", "写真"], ["manga artist", "writer", "drawing", "filmmaking", "photography", "art"]),

  // --- everyday settings ---
  school: T("学園", "School", { tags: ["School", "Boarding School"] }, ["学園", "学校", "高校", "中学"], ["school", "high school"]),
  "school-club": T("部活", "School clubs", { tags: ["School Club"] }, ["部活"], ["school club", "club activities"]),
  college: T("大学", "College", { tags: ["College"] }, ["大学"], ["college", "university"]),
  workplace: T("お仕事もの", "Workplace", { tags: ["Work", "Office", "Office Lady"] }, ["お仕事もの", "仕事もの", "職場", "会社員", "社会人"], ["workplace", "office", "work life", "working adults"]),
  teachers: T("先生", "Teachers", { tags: ["Teacher"] }, ["先生", "教師"], ["teacher"]),
  "coming-of-age": T("青春", "Coming of age", { tags: ["Coming of Age"] }, ["青春"], ["coming of age", "youth"]),
  "family-drama": T("家族もの", "Family", { tags: ["Family Life", "Parenthood", "Found Family", "Adoption"] }, ["家族もの", "ホームドラマ", "子育て", "親子"], ["family drama", "parenting", "found family"]),
  "marriage-cohabitation": T("同居・結婚", "Marriage & living together", { tags: ["Cohabitation", "Marriage", "Arranged Marriage", "Fake Relationship"] }, ["同居", "結婚", "夫婦", "許嫁", "偽装"], ["marriage", "married couple", "living together", "fake relationship"]),
  "cute-girls": T("ゆるかわ日常", "Cute girls", { tags: ["Cute Girls Doing Cute Things"] }, ["きらら", "かわいい女の子"], ["cgdct", "cute girls"]),
  "maids-butlers": T("メイド・執事", "Maids & butlers", { tags: ["Maids", "Butler"] }, ["メイド", "執事"], ["maid", "butler"]),
  delinquents: T("ヤンキー", "Delinquents", { tags: ["Delinquents"] }, ["ヤンキー", "不良"], ["delinquent", "delinquents"]),
  otaku: T("オタク文化", "Otaku culture", { tags: ["Otaku Culture", "Cosplay"] }, ["オタク", "コスプレ"], ["otaku", "cosplay"]),
  chuunibyou: T("中二病", "Chuunibyou", { tags: ["Chuunibyou"] }, ["中二病", "厨二"], ["chuunibyou"]),
  educational: T("学べる", "Educational", { tags: ["Educational"] }, ["勉強になる", "学べる", "教養"], ["educational", "learn something"]),
  kids: T("子ども向け", "For kids", { tags: ["Kids"] }, ["子ども向け", "子供向け", "児童向け"], ["for kids", "kids anime", "children's"]),

  // --- food, travel, nature ---
  cooking: T("料理・グルメ", "Cooking & food", { tags: ["Food", "Restaurant"] }, ["料理", "グルメ", "ごはん", "飯", "食べ物", "レストラン"], ["cooking", "cook", "food", "cuisine", "gourmet", "chef", "restaurant"]),
  travel: T("旅", "Travel", { tags: ["Travel"] }, ["旅", "旅行"], ["travel", "journey", "road trip"]),
  outdoors: T("アウトドア", "Outdoors", { tags: ["Camping", "Outdoor Activities", "Wilderness"] }, ["キャンプ", "アウトドア", "登山"], ["camping", "outdoors", "hiking"]),
  countryside: T("田舎", "Countryside", { tags: ["Rural", "Agriculture"] }, ["田舎", "農業", "田園"], ["countryside", "rural", "farming", "farm"]),
  seaside: T("海辺", "Seaside", { tags: ["Coastal"] }, ["海辺", "港町"], ["seaside", "beach", "coastal"]),
  animals: T("動物", "Animals", { tags: ["Animals", "Creature Taming"] }, ["動物", "猫", "犬", "ペット"], ["animals", "animal", "cats", "dogs", "pets"]),
  vehicles: T("乗り物", "Vehicles", { tags: ["Cars", "Motorcycles", "Trains", "Aviation", "Ships", "Tanks", "Mopeds"] }, ["車", "バイク", "鉄道", "電車", "飛行機", "戦車"], ["cars", "car racing", "motorcycle", "trains", "planes", "aviation"]),

  // --- fantasy worlds ---
  isekai: T("異世界", "Isekai", { tags: ["Isekai", "Reincarnation"] }, ["異世界", "転生"], ["isekai", "another world", "reincarnation", "reincarnated"]),
  magic: T("魔法", "Magic", { tags: ["Magic"] }, ["魔法", "魔術"], ["magic", "wizard", "sorcery", "sorcerer"]),
  witches: T("魔女", "Witches", { tags: ["Witch"] }, ["魔女"], ["witch", "witches"]),
  dungeon: T("ダンジョン", "Dungeons", { tags: ["Dungeon"] }, ["ダンジョン"], ["dungeon", "dungeons"]),
  medieval: T("中世・騎士", "Medieval", { tags: ["Medieval"] }, ["中世", "騎士"], ["medieval", "knight", "knights"]),
  dragons: T("ドラゴン", "Dragons", { tags: ["Dragons"] }, ["ドラゴン", "竜"], ["dragon", "dragons"]),
  elves: T("エルフ", "Elves", { tags: ["Elf"] }, ["エルフ"], ["elf", "elves"]),
  "monster-girls": T("人外", "Non-humans", { tags: ["Monster Girl", "Monster Boy", "Interspecies"] }, ["人外", "モンスター娘"], ["monster girl", "monster girls", "non-human"]),
  kemonomimi: T("獣耳", "Animal ears", { tags: ["Kemonomimi", "Nekomimi"] }, ["獣耳", "ケモミミ", "猫耳"], ["kemonomimi", "cat ears", "animal ears", "catgirl"]),
  "gods-myths": T("神話・神様", "Gods & myths", { tags: ["Gods", "Mythology"] }, ["神様", "神話"], ["gods", "god", "mythology", "myth", "myths"]),
  demons: T("悪魔・魔王", "Demons", { tags: ["Demons"] }, ["悪魔", "魔王"], ["demon", "demons", "devil", "demon lord"]),
  youkai: T("妖怪", "Youkai", { tags: ["Youkai"] }, ["妖怪", "あやかし"], ["youkai", "yokai"]),
  ghosts: T("幽霊", "Ghosts", { tags: ["Ghost"] }, ["幽霊", "お化け"], ["ghost", "ghosts", "spirit", "spirits"]),
  exorcism: T("退魔・呪い", "Exorcism & curses", { tags: ["Exorcism", "Curses"] }, ["祓い", "退魔", "除霊", "呪い", "呪術"], ["exorcism", "exorcist", "curse", "curses"]),
  vampires: T("吸血鬼", "Vampires", { tags: ["Vampire"] }, ["吸血鬼", "ヴァンパイア"], ["vampire", "vampires"]),
  zombies: T("ゾンビ", "Zombies", { tags: ["Zombie"] }, ["ゾンビ"], ["zombie", "zombies"]),
  "fairy-tales": T("童話", "Fairy tales", { tags: ["Fairy Tale"] }, ["童話", "おとぎ話"], ["fairy tale", "fairy tales"]),
  cultivation: T("中華ファンタジー", "Cultivation & wuxia", { tags: ["Cultivation", "Wuxia", "Ancient China"] }, ["中華", "修仙", "武侠"], ["cultivation", "wuxia", "xianxia", "ancient china"]),
  alchemy: T("錬金術", "Alchemy", { tags: ["Alchemy"] }, ["錬金術"], ["alchemy", "alchemist"]),
  "lost-civilizations": T("古代文明・遺跡", "Lost civilizations", { tags: ["Lost Civilization"] }, ["古代文明", "遺跡"], ["lost civilization", "ruins", "ancient ruins"]),
  "creature-taming": T("使い魔・テイマー", "Creature taming", { tags: ["Creature Taming"] }, ["テイマー", "使い魔"], ["tamer", "creature taming", "familiar"]),
  "super-powers": T("超能力", "Super powers", { tags: ["Super Power"] }, ["超能力", "異能"], ["super power", "superpower", "superpowers", "powers"]),
  superheroes: T("ヒーロー・特撮", "Superheroes", { tags: ["Superhero", "Tokusatsu", "Henshin"] }, ["ヒーロー", "特撮", "変身"], ["superhero", "superheroes", "tokusatsu", "transformation"]),

  // --- sci-fi worlds ---
  space: T("宇宙", "Space", { tags: ["Space", "Astronomy"] }, ["宇宙"], ["space", "outer space", "astronaut", "astronomy"]),
  mecha: T("ロボット", "Mecha", { genres: ["Mecha"], tags: ["Real Robot", "Super Robot"] }, ["ロボット", "ロボ", "メカ"], ["mecha", "robot", "robots", "giant robot"]),
  "robots-ai": T("AI・アンドロイド", "Robots & AI", { tags: ["Artificial Intelligence", "Robots", "Cyborg"] }, ["人工知能", "アンドロイド", "サイボーグ"], ["ai", "artificial intelligence", "android", "androids", "cyborg"]),
  aliens: T("宇宙人", "Aliens", { tags: ["Aliens"] }, ["宇宙人", "エイリアン"], ["alien", "aliens"]),
  kaiju: T("怪獣", "Kaiju", { tags: ["Kaiju"] }, ["怪獣"], ["kaiju", "giant monster", "giant monsters"]),
  cyberpunk: T("サイバーパンク", "Cyberpunk", { tags: ["Cyberpunk"] }, ["サイバーパンク"], ["cyberpunk"]),
  steampunk: T("スチームパンク", "Steampunk", { tags: ["Steampunk"] }, ["スチームパンク"], ["steampunk"]),
  dystopia: T("ディストピア", "Dystopia", { tags: ["Dystopian"] }, ["ディストピア", "管理社会"], ["dystopia", "dystopian"]),
  "post-apocalyptic": T("終末世界", "Post-apocalyptic", { tags: ["Post-Apocalyptic"] }, ["終末", "世紀末", "ポストアポカリプス"], ["post-apocalyptic", "apocalypse", "end of the world"]),
  "time-travel": T("タイムトラベル", "Time travel", { tags: ["Time Manipulation", "Time Loop"] }, ["タイムトラベル", "タイムリープ", "ループもの", "時間遡行", "タイムループ"], ["time travel", "time loop", "time-travel"]),
  "body-swap": T("入れ替わり", "Body swap", { tags: ["Body Swapping"] }, ["入れ替わり"], ["body swap", "body swapping"]),
  amnesia: T("記憶喪失", "Amnesia", { tags: ["Amnesia", "Memory Manipulation"] }, ["記憶喪失", "記憶を失"], ["amnesia", "memory loss"]),

  // --- history, conflict, society ---
  historical: T("歴史もの", "Historical", { tags: ["Historical"] }, ["歴史", "時代劇", "戦国", "江戸", "幕末", "大正"], ["historical", "history", "period drama", "feudal japan"]),
  samurai: T("侍・剣客", "Samurai", { tags: ["Samurai"] }, ["侍", "サムライ", "剣客"], ["samurai"]),
  ninja: T("忍者", "Ninja", { tags: ["Ninja"] }, ["忍者"], ["ninja", "ninjas"]),
  swordplay: T("剣戟", "Swordplay", { tags: ["Swordplay"] }, ["剣術", "剣士", "チャンバラ", "剣戟"], ["sword", "swords", "swordplay", "swordsman"]),
  guns: T("ガンアクション", "Gunfights", { tags: ["Guns"] }, ["銃", "ガンアクション", "スナイパー"], ["guns", "gunfight", "gunfights", "sniper"]),
  military: T("軍隊", "Military", { tags: ["Military"] }, ["軍隊", "軍事", "ミリタリー", "自衛隊"], ["military", "army", "soldier", "soldiers"]),
  war: T("戦争", "War", { tags: ["War"] }, ["戦争", "戦記"], ["war", "wartime"]),
  politics: T("政治・権謀", "Politics & intrigue", { tags: ["Politics", "Royal Affairs"] }, ["政治", "権謀", "王宮", "宮廷"], ["politics", "political", "court intrigue", "royalty"]),
  "kingdom-building": T("国づくり", "Kingdom building", { tags: ["Kingdom Management"] }, ["国づくり", "領地経営", "内政"], ["kingdom building", "nation building"]),
  crime: T("犯罪・裏社会", "Crime", { tags: ["Crime", "Criminal Organization"] }, ["犯罪", "裏社会"], ["crime", "criminal", "criminals", "underworld"]),
  "mafia-yakuza": T("マフィア・ヤクザ", "Mafia & yakuza", { tags: ["Mafia", "Yakuza", "Gangs"] }, ["マフィア", "ヤクザ", "極道", "ギャング"], ["mafia", "yakuza", "gangster", "gangsters", "gang"]),
  police: T("警察", "Police", { tags: ["Police"] }, ["警察", "刑事"], ["police", "cop", "cops"]),
  detective: T("探偵・推理", "Detectives", { tags: ["Detective"] }, ["探偵", "推理"], ["detective", "detectives", "sleuth"]),
  assassins: T("暗殺者", "Assassins", { tags: ["Assassins"] }, ["暗殺", "殺し屋"], ["assassin", "assassins", "hitman"]),
  spies: T("スパイ", "Spies", { tags: ["Espionage"] }, ["スパイ", "諜報"], ["spy", "spies", "espionage"]),
  "death-game": T("デスゲーム", "Death games", { tags: ["Death Game", "Battle Royale"] }, ["デスゲーム", "バトルロワイヤル", "バトロワ"], ["death game", "battle royale"]),
  survival: T("サバイバル", "Survival", { tags: ["Survival"] }, ["サバイバル"], ["survival"]),
  revenge: T("復讐", "Revenge", { tags: ["Revenge"] }, ["復讐"], ["revenge", "vengeance"]),
  "anti-hero": T("ダークヒーロー", "Anti-heroes", { tags: ["Anti-Hero"] }, ["ダークヒーロー", "アンチヒーロー"], ["anti-hero", "antihero"]),
  villainess: T("悪役令嬢", "Villainess", { tags: ["Villainess"] }, ["悪役令嬢"], ["villainess"]),
  pirates: T("海賊", "Pirates", { tags: ["Pirates", "Ships"] }, ["海賊"], ["pirate", "pirates"]),
  philosophy: T("哲学", "Philosophy", { tags: ["Philosophy"] }, ["哲学"], ["philosophy", "philosophical"]),
  medicine: T("医療", "Medicine", { tags: ["Medicine"] }, ["医療", "医者", "病院", "薬師"], ["medical", "doctor", "hospital", "medicine"]),
  business: T("経済・商売", "Business", { tags: ["Economics"] }, ["経済", "ビジネス", "商売", "商人"], ["business", "economics", "trading", "merchant"]),

  // --- love & identity ---
  yuri: T("百合", "Yuri", { tags: ["Yuri"] }, ["百合", "ガールズラブ"], ["yuri", "girls love", "girls' love", "sapphic"]),
  "boys-love": T("BL", "Boys' love", { tags: ["Boys' Love"] }, ["BL", "ボーイズラブ"], ["bl", "boys love", "boys' love"]),
  lgbtq: T("LGBTQ", "LGBTQ+", { tags: ["LGBTQ+ Themes"] }, ["LGBTQ", "LGBT"], ["lgbtq", "lgbt", "queer"]),

  // --- demographics (manga magazine audience) ---
  shounen: T("少年漫画", "Shounen", { tags: ["Shounen"] }, ["少年漫画", "ジャンプ"], ["shounen", "shonen"]),
  seinen: T("青年漫画", "Seinen", { tags: ["Seinen"] }, ["青年漫画"], ["seinen"]),
  shoujo: T("少女漫画", "Shoujo", { tags: ["Shoujo"] }, ["少女漫画"], ["shoujo", "shojo"]),
  josei: T("女性向け", "Josei", { tags: ["Josei"] }, ["女性向け"], ["josei"]),
} satisfies Record<string, ThemeDef>;

export type ThemeKey = keyof typeof THEMES;
export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
export const isThemeKey = (x: unknown): x is ThemeKey => typeof x === "string" && x in THEMES;
