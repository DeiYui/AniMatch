// src/data/animeList.ts
import { Anime } from "@/types";

export const animeList: Anime[] = [
  // --- ORIGINAL LIST (Fixed 5cm/sec) ---
  {
    id: "your-name",
    title: "Your Name (Kimi no Na wa)",
    description: "A body-swapping fantasy spanning time and space. Highly emotional and visually stunning.",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
    features: { romance: 1.0, action: 0.1, drama: 0.8, complexity: 0.6, visuals: 1.0 }
  },
  {
    id: "aot",
    title: "Attack on Titan",
    description: "Humanity's desperate fight for survival against man-eating Titans. Dark, intense, and full of plot twists.",
    coverImage: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    features: { romance: 0.1, action: 1.0, drama: 0.9, complexity: 0.9, visuals: 0.9 }
  },
  {
    id: "jjk",
    title: "Jujutsu Kaisen",
    description: "Yuji Itadori joins a secret organization of Jujutsu Sorcerers to kill a powerful Curse.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    features: { romance: 0.0, action: 1.0, drama: 0.4, complexity: 0.5, visuals: 0.9 }
  },
  {
    id: "death-note",
    title: "Death Note",
    description: "A high-stakes psychological battle of wits between a genius vigilante and a master detective.",
    coverImage: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    features: { romance: 0.1, action: 0.3, drama: 0.6, complexity: 1.0, visuals: 0.7 }
  },
  {
    id: "spy-family",
    title: "Spy x Family",
    description: "A spy, an assassin, and a telepath form a fake family. Heartwarming and hilarious.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg",
    features: { romance: 0.4, action: 0.7, drama: 0.2, complexity: 0.4, visuals: 0.8 }
  },
  {
    id: "violet-evergarden",
    title: "Violet Evergarden",
    description: "An emotionally detached soldier becomes an Auto Memory Doll to understand the meaning of 'I love you'.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1795/95088.jpg",
    features: { romance: 0.8, action: 0.4, drama: 1.0, complexity: 0.5, visuals: 1.0 }
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    description: "Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    features: { romance: 0.2, action: 1.0, drama: 0.7, complexity: 0.3, visuals: 1.0 }
  },
  {
    id: "ghibli-spirited",
    title: "Spirited Away",
    description: "Chihiro wanders into a world ruled by gods, witches, and spirits.",
    coverImage: "https://cdn.myanimelist.net/images/anime/6/79597.jpg",
    features: { romance: 0.3, action: 0.4, drama: 0.5, complexity: 0.7, visuals: 0.9 }
  },
  {
    id: "konosuba",
    title: "KonoSuba",
    description: "A hilarious parody of the isekai genre following a dysfunctional party of adventurers.",
    coverImage: "https://cdn.myanimelist.net/images/anime/8/77831.jpg",
    features: { romance: 0.2, action: 0.6, drama: 0.0, complexity: 0.2, visuals: 0.7 }
  },

  // --- NEW ADDITIONS (Expanded to 50) ---

  // High Complexity / Psychological
  {
    id: "evangelion",
    title: "Neon Genesis Evangelion",
    description: "A psychological mecha deconstruction exploring trauma, existence, and human connection.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1314/108941.jpg",
    features: { romance: 0.3, action: 0.8, drama: 1.0, complexity: 1.0, visuals: 0.7 }
  },
  {
    id: "steins-gate",
    title: "Steins;Gate",
    description: "A self-proclaimed mad scientist discovers a way to send messages to the past, with dire consequences.",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/73199.jpg",
    features: { romance: 0.6, action: 0.2, drama: 0.9, complexity: 1.0, visuals: 0.7 }
  },
  {
    id: "psycho-pass",
    title: "Psycho-Pass",
    description: "In a future where crime is predicted by a system, an enforcer and inspector hunt latent criminals.",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/43399.jpg",
    features: { romance: 0.1, action: 0.8, drama: 0.7, complexity: 0.9, visuals: 0.8 }
  },
  {
    id: "monster",
    title: "Monster",
    description: "A neurosurgeon's life is ruined when he saves a boy who turns out to be a sociopathic killer.",
    coverImage: "https://cdn.myanimelist.net/images/anime/10/18793.jpg",
    features: { romance: 0.1, action: 0.4, drama: 0.9, complexity: 1.0, visuals: 0.6 }
  },

  // High Action / Shonen
  {
    id: "chainsaw-man",
    title: "Chainsaw Man",
    description: "Denji, a devil hunter with a chainsaw heart, seeks a simple life but gets pulled into chaos.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg",
    features: { romance: 0.3, action: 1.0, drama: 0.6, complexity: 0.5, visuals: 0.9 }
  },
  {
    id: "one-punch-man",
    title: "One Punch Man",
    description: "A hero who can end any fight with a single punch seeks a worthy opponent.",
    coverImage: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
    features: { romance: 0.0, action: 1.0, drama: 0.2, complexity: 0.2, visuals: 0.9 }
  },
  {
    id: "fmab",
    title: "Fullmetal Alchemist: Brotherhood",
    description: "Two brothers search for the Philosopher's Stone to restore their bodies after a failed alchemy ritual.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
    features: { romance: 0.3, action: 0.9, drama: 0.8, complexity: 0.8, visuals: 0.8 }
  },
  {
    id: "hunter-x-hunter",
    title: "Hunter x Hunter",
    description: "Gon Freecss sets out to become a Hunter to find his father, facing deadly challenges.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1337/99013.jpg",
    features: { romance: 0.1, action: 0.9, drama: 0.6, complexity: 0.8, visuals: 0.8 }
  },
  {
    id: "mob-psycho",
    title: "Mob Psycho 100",
    description: "A psychic middle schooler tries to live a normal life while suppressing his god-like powers.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1918/96303.jpg",
    features: { romance: 0.2, action: 1.0, drama: 0.7, complexity: 0.6, visuals: 0.9 }
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk: Edgerunners",
    description: "A street kid tries to survive in a technology and body modification-obsessed city of the future.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1818/126435.jpg",
    features: { romance: 0.7, action: 1.0, drama: 0.9, complexity: 0.6, visuals: 1.0 }
  },

  // High Romance / Shojo / Slice of Life
  {
    id: "ylia",
    title: "Your Lie in April",
    description: "A piano prodigy who lost his ability to play finds new inspiration through a free-spirited violinist.",
    coverImage: "https://cdn.myanimelist.net/images/anime/3/67177.jpg",
    features: { romance: 1.0, action: 0.0, drama: 1.0, complexity: 0.4, visuals: 0.9 }
  },
  {
    id: "fruits-basket",
    title: "Fruits Basket (2019)",
    description: "Tohru Honda lives with the Soma family, who turn into animals of the Zodiac when hugged.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1447/99827.jpg",
    features: { romance: 0.9, action: 0.1, drama: 0.9, complexity: 0.6, visuals: 0.8 }
  },
  {
    id: "kaguya",
    title: "Kaguya-sama: Love is War",
    description: "Two genius student council members try to force the other to confess their love first.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1295/106551.jpg",
    features: { romance: 1.0, action: 0.0, drama: 0.3, complexity: 0.7, visuals: 0.8 }
  },
  {
    id: "clannad",
    title: "Clannad: After Story",
    description: "The struggles of adulthood, family, and loss. Known as one of the saddest anime ever.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1299/110774.jpg",
    features: { romance: 0.9, action: 0.0, drama: 1.0, complexity: 0.5, visuals: 0.7 }
  },
  {
    id: "horimiya",
    title: "Horimiya",
    description: "Two students with hidden personalities at school serendipitously cross paths.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1695/111486.jpg",
    features: { romance: 1.0, action: 0.0, drama: 0.3, complexity: 0.2, visuals: 0.8 }
  },
  {
    id: "toradora",
    title: "Toradora!",
    description: "Two misfits form an alliance to help each other date their best friends.",
    coverImage: "https://cdn.myanimelist.net/images/anime/13/22128.jpg",
    features: { romance: 1.0, action: 0.2, drama: 0.7, complexity: 0.4, visuals: 0.7 }
  },

  // Fantasy / Isekai / Adventure
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    description: "An elf mage reflects on the meaning of life and time after her party defeats the Demon King.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",
    features: { romance: 0.3, action: 0.6, drama: 0.8, complexity: 0.7, visuals: 1.0 }
  },
  {
    id: "mushoku",
    title: "Mushoku Tensei: Jobless Reincarnation",
    description: "A recluse is reincarnated in a fantasy world and resolves to live a fulfilling life.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1530/117776.jpg",
    features: { romance: 0.6, action: 0.8, drama: 0.7, complexity: 0.7, visuals: 0.9 }
  },
  {
    id: "re-zero",
    title: "Re:Zero - Starting Life in Another World",
    description: "Subaru Natsuki is transported to a fantasy world where he gains the ability to rewind time by dying.",
    coverImage: "https://cdn.myanimelist.net/images/anime/11/79410.jpg",
    features: { romance: 0.7, action: 0.8, drama: 0.9, complexity: 0.8, visuals: 0.8 }
  },
  {
    id: "made-in-abyss",
    title: "Made in Abyss",
    description: "A girl and a robot descend into a massive, dangerous pit in search of her mother. Deceptively cute.",
    coverImage: "https://cdn.myanimelist.net/images/anime/6/86733.jpg",
    features: { romance: 0.1, action: 0.7, drama: 0.9, complexity: 0.8, visuals: 1.0 }
  },

  // Sci-Fi / Mecha / Space
  {
    id: "cowboy-bebop",
    title: "Cowboy Bebop",
    description: "A ragtag crew of bounty hunters chases criminals across the galaxy in the year 2071.",
    coverImage: "https://cdn.myanimelist.net/images/anime/4/19644.jpg",
    features: { romance: 0.3, action: 0.8, drama: 0.7, complexity: 0.6, visuals: 0.8 }
  },
  {
    id: "code-geass",
    title: "Code Geass",
    description: "Exiled prince Lelouch obtains the power of absolute obedience and leads a rebellion.",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/50331.jpg",
    features: { romance: 0.3, action: 0.8, drama: 0.8, complexity: 0.9, visuals: 0.7 }
  },
  {
    id: "gurren-lagann",
    title: "Gurren Lagann",
    description: "Two friends break out of their underground village to pierce the heavens with their drill.",
    coverImage: "https://cdn.myanimelist.net/images/anime/4/5123.jpg",
    features: { romance: 0.4, action: 1.0, drama: 0.6, complexity: 0.5, visuals: 0.8 }
  },
  {
    id: "86",
    title: "86 (Eighty-Six)",
    description: "A story of war, discrimination, and drones piloted by the oppressed '86'.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1987/117507.jpg",
    features: { romance: 0.5, action: 0.9, drama: 0.9, complexity: 0.8, visuals: 0.9 }
  },

  // Slice of Life / Comedy / Chill
  {
    id: "bocchi",
    title: "Bocchi the Rock!",
    description: "An anxious girl joins a rock band and learns to overcome her social struggles.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1448/127956.jpg",
    features: { romance: 0.0, action: 0.1, drama: 0.3, complexity: 0.4, visuals: 0.9 }
  },
  {
    id: "nichijou",
    title: "Nichijou - My Ordinary Life",
    description: "The absurd and hilarious daily lives of high school students and a robot.",
    coverImage: "https://cdn.myanimelist.net/images/anime/3/75617.jpg",
    features: { romance: 0.1, action: 0.4, drama: 0.0, complexity: 0.3, visuals: 0.7 }
  },

  // Sports
  {
    id: "haikyuu",
    title: "Haikyuu!!",
    description: "A short volleyball player aims to become the 'Little Giant' of the court.",
    coverImage: "https://cdn.myanimelist.net/images/anime/7/76014.jpg",
    features: { romance: 0.0, action: 0.9, drama: 0.6, complexity: 0.4, visuals: 0.8 }
  },
  {
    id: "blue-lock",
    title: "Blue Lock",
    description: "Japan creates a prison-like training facility to find the world's greatest egoist striker.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1258/126929.jpg",
    features: { romance: 0.0, action: 0.9, drama: 0.5, complexity: 0.6, visuals: 0.8 }
  },

  // Movies
  {
    id: "silent-voice",
    title: "A Silent Voice",
    description: "A former bully seeks redemption from the deaf girl he once tormented.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1122/96435.jpg",
    features: { romance: 0.6, action: 0.0, drama: 1.0, complexity: 0.6, visuals: 0.9 }
  },
  {
    id: "howl",
    title: "Howl's Moving Castle",
    description: "Sophie is cursed by a witch and seeks out the wizard Howl in his walking castle.",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/75810.jpg",
    features: { romance: 0.9, action: 0.5, drama: 0.4, complexity: 0.6, visuals: 1.0 }
  },

  // Dark / Thriller
  {
    id: "tokyo-ghoul",
    title: "Tokyo Ghoul",
    description: "A college student becomes a half-ghoul and must learn to survive in a world of flesh-eating monsters.",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/64449.jpg",
    features: { romance: 0.2, action: 0.9, drama: 0.8, complexity: 0.6, visuals: 0.8 }
  },
  {
    id: "berserk",
    title: "Berserk (1997)",
    description: "Guts, a wandering mercenary, joins the Band of the Hawk led by the charismatic Griffith.",
    coverImage: "https://cdn.myanimelist.net/images/anime/12/35925.jpg",
    features: { romance: 0.3, action: 1.0, drama: 0.9, complexity: 0.7, visuals: 0.6 }
  },

  // Classics
  {
    id: "trigun",
    title: "Trigun",
    description: "Vash the Stampede is a gunman with a $$60 billion bounty who tries to avoid killing.",
    coverImage: "https://cdn.myanimelist.net/images/anime/7/20310.jpg",
    features: { romance: 0.2, action: 0.9, drama: 0.6, complexity: 0.5, visuals: 0.7 }
  },
  {
    id: "gintama",
    title: "Gintama",
    description: "Samurai try to make ends meet in an alien-conquered feudal Japan. Pure chaos and comedy.",
    coverImage: "https://cdn.myanimelist.net/images/anime/10/73274.jpg",
    features: { romance: 0.1, action: 0.7, drama: 0.5, complexity: 0.6, visuals: 0.7 }
  },
];