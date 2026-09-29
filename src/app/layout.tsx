import type { Metadata } from "next";
import { Dela_Gothic_One, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/i18n/LangProvider";
import { ja } from "@/i18n/ja";

// Dela Gothic One: logo and headline only. Zen Kaku Gothic New: everything else.
// Japanese glyphs come as unicode-range slices, so there's nothing useful to preload.
const delaGothic = Dela_Gothic_One({
  variable: "--font-dela-gothic",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  // The <title> is rendered by LangProvider so it follows the UI language; the description stays JA (default).
  description: ja.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${delaGothic.variable} ${zenKaku.variable} antialiased`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
