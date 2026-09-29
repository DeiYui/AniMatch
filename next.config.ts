import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AniList cover images (src/data/anime.json)
    remotePatterns: [{ protocol: "https", hostname: "s4.anilist.co" }],
  },
};

export default nextConfig;
