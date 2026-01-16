// src/data/animeList.ts
import { Anime } from "@/types";

export const animeList: Anime[] = [
  {
    id: "your-name",
    title: "Your Name (Kimi no Na wa)",
    description: "A body-swapping fantasy spanning time and space. Highly emotional and visually stunning.",
    // New reliable link from MyAnimeList CDN
    coverImage: "https://cdn.myanimelist.net/images/anime/5/87048.jpg", 
    features: {
      romance: 1.0,
      action: 0.1,
      drama: 0.8,
      complexity: 0.6,
      visuals: 1.0
    }
  },
  {
    id: "aot",
    title: "Attack on Titan",
    description: "Humanity's desperate fight for survival against man-eating Titans. Dark, intense, and full of plot twists.",
    coverImage: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    features: {
      romance: 0.1,
      action: 1.0,
      drama: 0.9,
      complexity: 0.9,
      visuals: 0.8
    }
  },
  {
    id: "5cm",
    title: "5 Centimeters per Second",
    description: "A heartbreaking tale of first love, distance, and the passage of time.",
    coverImage: "https://cdn.myanimelist.net/images/anime/13/21773.jpg",
    features: {
      romance: 0.9,
      action: 0.0,
      drama: 1.0,
      complexity: 0.3,
      visuals: 0.9
    }
  },
  {
    id: "jjk",
    title: "Jujutsu Kaisen",
    description: "Yuji Itadori joins a secret organization of Jujutsu Sorcerers to kill a powerful Curse.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    features: {
      romance: 0.0,
      action: 1.0,
      drama: 0.4,
      complexity: 0.5,
      visuals: 0.9
    }
  },
  {
    id: "death-note",
    title: "Death Note",
    description: "A high-stakes psychological battle of wits between a genius vigilante and a master detective.",
    coverImage: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    features: {
      romance: 0.1,
      action: 0.3,
      drama: 0.6,
      complexity: 1.0,
      visuals: 0.7
    }
  },
  {
    id: "spy-family",
    title: "Spy x Family",
    description: "A spy, an assassin, and a telepath form a fake family. Heartwarming and hilarious.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg",
    features: {
      romance: 0.4,
      action: 0.7,
      drama: 0.2,
      complexity: 0.4,
      visuals: 0.8
    }
  },
   {
    id: "violet-evergarden",
    title: "Violet Evergarden",
    description: "An emotionally detached soldier becomes an Auto Memory Doll to understand the meaning of 'I love you'.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1795/95088.jpg",
    features: {
      romance: 0.8,
      action: 0.4,
      drama: 1.0,
      complexity: 0.5,
      visuals: 1.0
    }
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer (Kimetsu no Yaiba)",
    description: "Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.",
    coverImage: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    features: {
      romance: 0.2,
      action: 1.0,
      drama: 0.7,
      complexity: 0.3,
      visuals: 1.0
    }
  },
  {
    id: "ghibli-spirited",
    title: "Spirited Away",
    description: "Chihiro wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
    coverImage: "https://cdn.myanimelist.net/images/anime/6/79597.jpg",
    features: {
      romance: 0.3,
      action: 0.4,
      drama: 0.5,
      complexity: 0.7,
      visuals: 0.9
    }
  },
  {
    id: "konosuba",
    title: "KonoSuba",
    description: "A hilarious parody of the isekai genre following a dysfunctional party of adventurers.",
    coverImage: "https://cdn.myanimelist.net/images/anime/8/77831.jpg",
    features: {
      romance: 0.2,
      action: 0.6,
      drama: 0.0,
      complexity: 0.2,
      visuals: 0.7
    }
  }
];