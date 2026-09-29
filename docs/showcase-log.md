# Showcase log

Before/after history of `npm run showcase`. Newest run at the bottom.
Columns: cos = cosine, int = intensity (0..1), qual = weighted quality (averageScore/100 × 0.2), adj = energy + prequel + long-series + short-series adjustments.

> **Runs 1 and 2 were reconstructed** from the terminal output of the Claude Code session in which they ran. They were not written by `showcase.ts`. The numbers and titles are copied from that output, but the exact times were not recorded. Both ran on uncommitted code that was committed right after each run: Run 1 as 673fa15, Run 2 as 16a0603. Run 1 predates `showcase.ts`, so its columns differ.

## Run 1 (reconstructed) — 2026-09-29 before 17:11 — code of 673fa15 — first engine: score = 0.8 × cosine + 0.2 × quality, heavy in the target

Scoring at the time: heavy target by energy (low 0 / mid 0.4 / high 0.7) was part of the cosine. Low energy: −heavy × 0.3. Prequel −0.05. Short series +0.05, still applied after the time budget was dropped. Diversity cosine > 0.95. Reasons were not limited and included the runtime.

### 「仕事で疲れた。寝る前に30分だけ笑えるやつ」

| # | Title | total | cos | qual | adj | Reasons |
|---|---|---|---|---|---|---|
| 1 | ディーふらぐ! | **0.959** | 0.992 | 0.144 | +0.021 | 1話24分 × 12話 / 笑い度：高 / 重い展開：ほぼなし / 1話が30分以内 / 全12話で区切りやすい / AniList評価 72点 |
| 2 | 異世界かるてっと | **0.905** | 0.928 | 0.144 | +0.018 | 1話12分 × 12話 / 笑い度：中 / 重い展開：ほぼなし / 1話が30分以内 / 全12話で区切りやすい / AniList評価 72点 |
| 3 | かぐや様は告らせたい～天才たちの恋愛頭脳戦～ | **0.888** | 0.885 | 0.166 | +0.014 | 1話24分 × 12話 / 笑い度：高 / 重い展開：ほぼなし / 1話が30分以内 / 全12話で区切りやすい / AniList評価 83点 |

### 「週末に一気見できる、泣ける作品」

| # | Title | total | cos | qual | adj | Reasons |
|---|---|---|---|---|---|---|
| 1 | サイレント・ウィッチ 沈黙の魔女の隠しごと | **0.929** | 0.959 | 0.162 | 0 | 1話24分 × 13話 / 感動度：中 / AniList評価 81点 |
| 2 | アオアシ | **0.905** | 0.929 | 0.162 | 0 | 1話25分 × 24話 / AniList評価 81点 |
| 3 | 千と千尋の神隠し | **0.896** | 0.905 | 0.172 | 0 | 映画・約125分 / 感動度：中 / AniList評価 86点 |

### 「家族で見られる、ワクワクするもの」

| # | Title | total | cos | qual | adj | Reasons |
|---|---|---|---|---|---|---|
| 1 | ブラッククローバー 魔法帝の剣 | **0.937** | 0.971 | 0.160 | 0 | 映画・約113分 / ワクワク度：中 / 家族で見やすい（過激な描写なし） / AniList評価 80点 |
| 2 | 僕のヒーローアカデミア | **0.910** | 0.948 | 0.152 | 0 | 1話24分 × 13話 / ワクワク度：中 / 家族で見やすい（過激な描写なし） / AniList評価 76点 |
| 3 | SSSS.GRIDMAN | **0.903** | 0.952 | 0.142 | 0 | 1話25分 × 12話 / ワクワク度：中 / 家族で見やすい（過激な描写なし） / AniList評価 71点 |

### 「恋愛ものが見たい、でも重いのは嫌」

| # | Title | total | cos | qual | adj | Reasons |
|---|---|---|---|---|---|---|
| 1 | 神様はじめました | **0.867** | 0.923 | 0.160 | −0.031 | 1話24分 × 13話 / 恋愛度：中 / 重い展開：ほぼなし / AniList評価 80点 |
| 2 | 経験済みなキミと、経験ゼロなオレが、お付き合いする話。 | **0.857** | 0.940 | 0.134 | −0.029 | 1話24分 × 12話 / 恋愛度：高 / 重い展開：ほぼなし / AniList評価 67点 |
| 3 | Lv2からチートだった元勇者候補のまったり異世界ライフ | **0.846** | 0.921 | 0.138 | −0.029 | 1話24分 × 12話 / 恋愛度：中 / 重い展開：ほぼなし / AniList評価 69点 |

### 「進撃の巨人みたいなやつ」

| # | Title | total | cos | qual | adj | Reasons |
|---|---|---|---|---|---|---|
| 1 | HUNTER×HUNTER (2011) | **0.969** | 0.989 | 0.178 | 0 | 1話24分 × 148話 / ワクワク度：高 / ダーク度：中 / 『進撃の巨人』に近い雰囲気 / AniList評価 89点 |
| 2 | カウボーイビバップ | **0.956** | 0.980 | 0.172 | 0 | 1話24分 × 26話 / ワクワク度：中 / 感動度：中 / 『進撃の巨人』に近い雰囲気 / AniList評価 86点 |
| 3 | 鬼滅の刃 | **0.933** | 0.962 | 0.164 | 0 | 1話24分 × 26話 / ワクワク度：中 / ダーク度：中 / 『進撃の巨人』に近い雰囲気 / AniList評価 82点 |

### 「5分だけ時間ある」

notices: 条件を少しゆるめました

| # | Title | total | cos | qual | adj | Reasons |
|---|---|---|---|---|---|---|
| 1 | 異世界薬局 | **0.946** | 0.940 | 0.144 | +0.050 | 1話24分 × 12話 / 全12話で区切りやすい / AniList評価 72点 |
| 2 | ゆるキャン△ | **0.859** | 0.809 | 0.162 | +0.050 | 1話24分 × 12話 / 癒やし度：高 / 全12話で区切りやすい / AniList評価 81点 |
| 3 | 神達に拾われた男 | **0.849** | 0.828 | 0.136 | +0.050 | 1話24分 × 12話 / 癒やし度：高 / 全12話で区切りやすい / AniList評価 68点 |

Problems found: the cosine rewarded well-aligned but weak titles (アオアシ has cry 0.29; 異世界薬局 has relax 0.28), and heavy made up about 1/3 of the target direction.

## Run 2 (reconstructed) — 2026-09-29 before 17:18 — code of 16a0603 — heavy out of the cosine, + intensity over all target dims

Scoring: 0.5 × cosine (7 mood dims) + 0.3 × intensity (all target dims) + 0.2 × quality. Energy low −heavy × 0.3, high +heavy × 0.1. Primary-mood floor 0.3 (soft). Prequel −0.05. Diversity cosine > 0.95. When the time budget is dropped, titles that fit come first. Max 3 reasons.

### 「仕事で疲れた。寝る前に30分だけ笑えるやつ」

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ディーふらぐ! | 1話24分 × 12話 | **0.95** | 1.00 | 0.95 | 0.14 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 2 | あそびあそばせ | 1話24分 × 12話 | **0.92** | 0.88 | 1.00 | 0.16 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 3 | かぐや様は告らせたい～天才たちの恋愛頭脳戦～ | 1話24分 × 12話 | **0.90** | 0.89 | 0.91 | 0.17 | +0.01 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |

### 「週末に一気見できる、泣ける作品」

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 聲の形 | 映画・約130分 | **0.96** | 0.88 | 1.00 | 0.18 | +0.05 | 感動度：高 / AniList評価 88点 |
| 2 | さよならの朝に約束の花をかざろう | 映画・約115分 | **0.94** | 0.85 | 1.00 | 0.16 | +0.05 | 感動度：高 / 見ごたえ：たっぷり / AniList評価 82点 |
| 3 | Angel Beats! | 1話24分 × 13話 | **0.92** | 0.84 | 0.99 | 0.15 | +0.05 | 感動度：高 / 見ごたえ：たっぷり / AniList評価 77点 |

### 「家族で見られる、ワクワクするもの」

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ドラゴンボール | 1話25分 × 153話 | **0.89** | 0.91 | 0.91 | 0.16 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 78点 |
| 2 | Fate/stay night [Unlimited Blade Works] | 1話24分 × 13話 | **0.86** | 0.91 | 0.99 | 0.16 | -0.05 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / ※続編です（前作あり） |
| 3 | BORUTO-ボルト- NARUTO NEXT GENERATIONS | 1話24分 × 293話 | **0.82** | 0.99 | 0.88 | 0.11 | -0.05 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / ※続編です（前作あり） |

### 「恋愛ものが見たい、でも重いのは嫌」

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | クラスの大嫌いな女子と結婚することになった。 | 1話24分 × 12話 | **0.88** | 0.95 | 1.00 | 0.13 | -0.03 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 67点 |
| 2 | アオのハコ | 1話24分 × 25話 | **0.85** | 0.89 | 1.00 | 0.16 | -0.06 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 81点 |
| 3 | 海辺のエトランゼ | 映画・約59分 | **0.83** | 0.83 | 0.90 | 0.15 | -0.01 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 77点 |

### 「進撃の巨人みたいなやつ」

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ONE PIECE | 1話24分 × 1180話 | **0.86** | 0.92 | 0.74 | 0.17 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |
| 2 | 剣風伝奇ベルセルク | 1話25分 × 25話 | **0.86** | 0.95 | 0.71 | 0.17 | 0 | ダーク度：高 / 『進撃の巨人』に近い雰囲気 / ワクワク度：高 |
| 3 | 新世紀エヴァンゲリオン | 1話24分 × 26話 | **0.82** | 0.89 | 0.70 | 0.17 | 0 | ダーク度：高 / 『進撃の巨人』に近い雰囲気 / ワクワク度：中 |

### 「5分だけ時間ある」

notices: 条件を少しゆるめました

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 旦那が何を言っているかわからない件 | 1話4分 × 13話 | **0.60** | 0.63 | 0.47 | 0.14 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 70点 |
| 2 | 斉木楠雄のΨ難 | 1話5分 × 120話 | **0.40** | 0.28 | 0.31 | 0.17 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 83点 |
| 3 | のんのんびより | 1話24分 × 12話 | **0.95** | 0.98 | 1.00 | 0.16 | 0 | 癒やし度：高 / AniList評価 78点 |

Problems found: 「泣ける」 was fixed, but 「進撃の巨人みたいな」 got worse. Intensity over every dim of a spread-out reference target favors titles that are high on everything (ONE PIECE). Your lie in April was dropped as a near-duplicate of 聲の形 (cosine 0.961 > 0.95). Two of the three 「家族・ワクワク」 results were sequels despite the −0.05 penalty.

## 2026-09-29 17:20 — 16a0603 + uncommitted changes — intensity top-2 dims, diversity 0.97, prequel −0.15, long-series −0.05

### 「仕事で疲れた。寝る前に30分だけ笑えるやつ」

rules: `{"moods":[{"type":"laugh","weight":1}],"energy":"low","timeBudgetMin":30,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ディーふらぐ! | 1話24分 × 12話 | **0.95** | 1.00 | 0.95 | 0.14 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 2 | あそびあそばせ | 1話24分 × 12話 | **0.92** | 0.88 | 1.00 | 0.16 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 3 | 異世界おじさん | 1話24分 × 13話 | **0.91** | 0.96 | 1.00 | 0.15 | -0.03 | 笑い度：高 / 1話が30分以内 / 重い展開：少なめ |

### 「週末に一気見できる、泣ける作品」

rules: `{"moods":[{"type":"cry","weight":1}],"energy":"high","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 聲の形 | 映画・約130分 | **0.96** | 0.88 | 1.00 | 0.18 | +0.05 | 感動度：高 / AniList評価 88点 |
| 2 | さよならの朝に約束の花をかざろう | 映画・約115分 | **0.94** | 0.85 | 1.00 | 0.16 | +0.05 | 感動度：高 / 見ごたえ：たっぷり / AniList評価 82点 |
| 3 | Angel Beats! | 1話24分 × 13話 | **0.92** | 0.84 | 0.99 | 0.15 | +0.05 | 感動度：高 / 見ごたえ：たっぷり / AniList評価 77点 |

### 「家族で見られる、ワクワクするもの」

rules: `{"moods":[{"type":"thrill","weight":1}],"energy":"mid","timeBudgetMin":null,"company":"family","avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ワールドトリガー | 1話23分 × 73話 | **0.85** | 0.94 | 0.77 | 0.15 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 73点 |
| 2 | THE GOD OF HIGH SCHOOL ゴッド・オブ・ハイスクール | 1話24分 × 13話 | **0.84** | 0.97 | 0.73 | 0.14 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 69点 |
| 3 | ドラゴンボール | 1話25分 × 153話 | **0.84** | 0.91 | 0.91 | 0.16 | -0.05 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 78点 |

### 「恋愛ものが見たい、でも重いのは嫌」

rules: `{"moods":[{"type":"romance","weight":1}],"energy":"low","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | クラスの大嫌いな女子と結婚することになった。 | 1話24分 × 12話 | **0.88** | 0.95 | 1.00 | 0.13 | -0.03 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 67点 |
| 2 | アオのハコ | 1話24分 × 25話 | **0.85** | 0.89 | 1.00 | 0.16 | -0.06 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 81点 |
| 3 | 海辺のエトランゼ | 映画・約59分 | **0.83** | 0.83 | 0.90 | 0.15 | -0.01 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 77点 |

### 「進撃の巨人みたいなやつ」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":"進撃の巨人"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 剣風伝奇ベルセルク | 1話25分 × 25話 | **0.92** | 0.95 | 0.91 | 0.17 | 0 | ダーク度：高 / 『進撃の巨人』に近い雰囲気 / ワクワク度：高 |
| 2 | 未来日記 | 1話23分 × 26話 | **0.90** | 0.93 | 1.00 | 0.14 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |
| 3 | 鋼の錬金術師 FULLMETAL ALCHEMIST | 1話25分 × 64話 | **0.87** | 0.95 | 0.73 | 0.18 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |

### 「5分だけ時間ある」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":5,"company":null,"avoid":[],"referenceTitle":null}`  
notices: 条件を少しゆるめました

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 旦那が何を言っているかわからない件 | 1話4分 × 13話 | **0.60** | 0.63 | 0.47 | 0.14 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 70点 |
| 2 | 斉木楠雄のΨ難 | 1話5分 × 120話 | **0.40** | 0.28 | 0.31 | 0.17 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 83点 |
| 3 | のんのんびより | 1話24分 × 12話 | **0.95** | 0.98 | 1.00 | 0.16 | 0 | 癒やし度：高 / AniList評価 78点 |

## 2026-09-29 17:59 — 16a0603 + uncommitted changes — JA/EN UI: reasons as keys, English rules + 6 EN sentences

### 「仕事で疲れた。寝る前に30分だけ笑えるやつ」

rules: `{"moods":[{"type":"laugh","weight":1}],"energy":"low","timeBudgetMin":30,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ディーふらぐ! | TVアニメ・1話24分 × 12話 | **0.95** | 1.00 | 0.95 | 0.14 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 2 | あそびあそばせ | TVアニメ・1話24分 × 12話 | **0.92** | 0.88 | 1.00 | 0.16 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 3 | 異世界おじさん | TVアニメ・1話24分 × 13話 | **0.91** | 0.96 | 1.00 | 0.15 | -0.03 | 笑い度：高 / 1話が30分以内 / 重い展開：少なめ |

### 「週末に一気見できる、泣ける作品」

rules: `{"moods":[{"type":"cry","weight":1}],"energy":"high","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 聲の形 | 映画・約130分 | **0.96** | 0.88 | 1.00 | 0.18 | +0.05 | 感動度：高 / AniList評価 88点 |
| 2 | さよならの朝に約束の花をかざろう | 映画・約115分 | **0.94** | 0.85 | 1.00 | 0.16 | +0.05 | 感動度：高 / 見ごたえ：たっぷり / AniList評価 82点 |
| 3 | Angel Beats! | TVアニメ・1話24分 × 13話 | **0.92** | 0.84 | 0.99 | 0.15 | +0.05 | 感動度：高 / 見ごたえ：たっぷり / AniList評価 77点 |

### 「家族で見られる、ワクワクするもの」

rules: `{"moods":[{"type":"thrill","weight":1}],"energy":"mid","timeBudgetMin":null,"company":"family","avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ワールドトリガー | TVアニメ・1話23分 × 73話 | **0.85** | 0.94 | 0.77 | 0.15 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 73点 |
| 2 | THE GOD OF HIGH SCHOOL ゴッド・オブ・ハイスクール | TVアニメ・1話24分 × 13話 | **0.84** | 0.97 | 0.73 | 0.14 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 69点 |
| 3 | ドラゴンボール | TVアニメ・1話25分 × 153話 | **0.84** | 0.91 | 0.91 | 0.16 | -0.05 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 78点 |

### 「恋愛ものが見たい、でも重いのは嫌」

rules: `{"moods":[{"type":"romance","weight":1}],"energy":"low","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | クラスの大嫌いな女子と結婚することになった。 | TVアニメ・1話24分 × 12話 | **0.88** | 0.95 | 1.00 | 0.13 | -0.03 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 67点 |
| 2 | アオのハコ | 配信アニメ・1話24分 × 25話 | **0.85** | 0.89 | 1.00 | 0.16 | -0.06 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 81点 |
| 3 | 海辺のエトランゼ | 映画・約59分 | **0.83** | 0.83 | 0.90 | 0.15 | -0.01 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 77点 |

### 「進撃の巨人みたいなやつ」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":"進撃の巨人"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 剣風伝奇ベルセルク | TVアニメ・1話25分 × 25話 | **0.92** | 0.95 | 0.91 | 0.17 | 0 | ダーク度：高 / 『進撃の巨人』に近い雰囲気 / ワクワク度：高 |
| 2 | 未来日記 | TVアニメ・1話23分 × 26話 | **0.90** | 0.93 | 1.00 | 0.14 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |
| 3 | 鋼の錬金術師 FULLMETAL ALCHEMIST | TVアニメ・1話25分 × 64話 | **0.87** | 0.95 | 0.73 | 0.18 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |

### 「5分だけ時間ある」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":5,"company":null,"avoid":[],"referenceTitle":null}`  
notices: 条件を少しゆるめました

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 旦那が何を言っているかわからない件 | ショートアニメ・1話4分 × 13話 | **0.60** | 0.63 | 0.47 | 0.14 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 70点 |
| 2 | 斉木楠雄のΨ難 | ショートアニメ・1話5分 × 120話 | **0.40** | 0.28 | 0.31 | 0.17 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 83点 |
| 3 | のんのんびより | TVアニメ・1話24分 × 12話 | **0.95** | 0.98 | 1.00 | 0.16 | 0 | 癒やし度：高 / AniList評価 78点 |

### 「Tired from work. Something funny for 30 minutes before bed」

rules: `{"moods":[{"type":"laugh","weight":1}],"energy":"low","timeBudgetMin":30,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | D-Frag! | TV series · 24 min × 12 eps | **0.95** | 1.00 | 0.95 | 0.14 | +0.02 | Comedy: high / Each episode fits in 30 min / Heavy themes: almost none |
| 2 | Asobi Asobase - workshop of fun - | TV series · 24 min × 12 eps | **0.92** | 0.88 | 1.00 | 0.16 | +0.02 | Comedy: high / Each episode fits in 30 min / Heavy themes: almost none |
| 3 | Uncle from Another World | TV series · 24 min × 13 eps | **0.91** | 0.96 | 1.00 | 0.15 | -0.03 | Comedy: high / Each episode fits in 30 min / Heavy themes: a few |

### 「A tearjerker I can binge this weekend」

rules: `{"moods":[{"type":"cry","weight":1}],"energy":"high","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | A Silent Voice | Movie · 130 min | **0.96** | 0.88 | 1.00 | 0.18 | +0.05 | Emotional: high / AniList score 88 |
| 2 | Maquia: When the Promised Flower Blooms | Movie · 115 min | **0.94** | 0.85 | 1.00 | 0.16 | +0.05 | Emotional: high / A substantial watch / AniList score 82 |
| 3 | Angel Beats! | TV series · 24 min × 13 eps | **0.92** | 0.84 | 0.99 | 0.15 | +0.05 | Emotional: high / A substantial watch / AniList score 77 |

### 「Something exciting to watch with my family」

rules: `{"moods":[{"type":"thrill","weight":1}],"energy":"mid","timeBudgetMin":null,"company":"family","avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | World Trigger | TV series · 23 min × 73 eps | **0.85** | 0.94 | 0.77 | 0.15 | 0 | Excitement: high / Family-friendly (no graphic content) / AniList score 73 |
| 2 | The God of High School | TV series · 24 min × 13 eps | **0.84** | 0.97 | 0.73 | 0.14 | 0 | Excitement: high / Family-friendly (no graphic content) / AniList score 69 |
| 3 | Dragon Ball | TV series · 25 min × 153 eps | **0.84** | 0.91 | 0.91 | 0.16 | -0.05 | Excitement: high / Family-friendly (no graphic content) / AniList score 78 |

### 「Romance, but nothing too heavy」

rules: `{"moods":[{"type":"romance","weight":1}],"energy":"low","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | I'm Getting Married to a Girl I Hate in My Class | TV series · 24 min × 12 eps | **0.88** | 0.95 | 1.00 | 0.13 | -0.03 | Romance: high / Heavy themes: almost none / AniList score 67 |
| 2 | Blue Box | Web series · 24 min × 25 eps | **0.85** | 0.89 | 1.00 | 0.16 | -0.06 | Romance: high / Heavy themes: almost none / AniList score 81 |
| 3 | The Stranger by the Shore | Movie · 59 min | **0.83** | 0.83 | 0.90 | 0.15 | -0.01 | Romance: high / Heavy themes: almost none / AniList score 77 |

### 「Something like Attack on Titan」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":"Attack on Titan"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | Berserk | TV series · 25 min × 25 eps | **0.92** | 0.95 | 0.91 | 0.17 | 0 | Darkness: high / Similar vibe to Attack on Titan / Excitement: high |
| 2 | The Future Diary | TV series · 23 min × 26 eps | **0.90** | 0.93 | 1.00 | 0.14 | 0 | Excitement: high / Similar vibe to Attack on Titan / Darkness: high |
| 3 | Fullmetal Alchemist: Brotherhood | TV series · 25 min × 64 eps | **0.87** | 0.95 | 0.73 | 0.18 | 0 | Excitement: high / Similar vibe to Attack on Titan / Darkness: high |

### 「I only have 5 minutes」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":5,"company":null,"avoid":[],"referenceTitle":null}`  
notices: Relaxed some conditions

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | I Can't Understand What My Husband Is Saying | Short series · 4 min × 13 eps | **0.60** | 0.63 | 0.47 | 0.14 | 0 | Relaxing: medium / Each episode fits in 5 min / AniList score 70 |
| 2 | The Disastrous Life of Saiki K. | Short series · 5 min × 120 eps | **0.40** | 0.28 | 0.31 | 0.17 | 0 | Relaxing: medium / Each episode fits in 5 min / AniList score 83 |
| 3 | Non Non Biyori | TV series · 24 min × 12 eps | **0.95** | 0.98 | 1.00 | 0.16 | 0 | Relaxing: high / AniList score 78 |

## 2026-09-29 22:10 — 16a0603 + uncommitted changes — re-fetched data (+status/year), format/completed/era/popularity, 2 new sentences

### 「仕事で疲れた。寝る前に30分だけ笑えるやつ」

rules: `{"moods":[{"type":"laugh","weight":1}],"energy":"low","timeBudgetMin":30,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ディーふらぐ! | TVアニメ・1話24分 × 12話 | **0.95** | 1.00 | 0.95 | 0.14 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 2 | あそびあそばせ | TVアニメ・1話24分 × 12話 | **0.92** | 0.88 | 1.00 | 0.16 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 3 | 異世界おじさん | TVアニメ・1話24分 × 13話 | **0.91** | 0.96 | 1.00 | 0.15 | -0.03 | 笑い度：高 / 1話が30分以内 / 重い展開：少なめ |

### 「週末に一気見できる、泣ける作品」

rules: `{"moods":[{"type":"cry","weight":1}],"energy":"high","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":true,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 聲の形 | 映画・約130分 | **0.96** | 0.88 | 1.00 | 0.18 | +0.05 | 感動度：高 / 完結済み / AniList評価 88点 |
| 2 | さよならの朝に約束の花をかざろう | 映画・約115分 | **0.94** | 0.85 | 1.00 | 0.16 | +0.05 | 感動度：高 / 完結済み / 見ごたえ：たっぷり |
| 3 | Angel Beats! | TVアニメ・1話24分 × 13話 | **0.92** | 0.84 | 0.99 | 0.15 | +0.05 | 感動度：高 / 完結済み / 見ごたえ：たっぷり |

### 「家族で見られる、ワクワクするもの」

rules: `{"moods":[{"type":"thrill","weight":1}],"energy":"mid","timeBudgetMin":null,"company":"family","avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ワールドトリガー | TVアニメ・1話23分 × 73話 | **0.85** | 0.94 | 0.77 | 0.15 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 73点 |
| 2 | THE GOD OF HIGH SCHOOL ゴッド・オブ・ハイスクール | TVアニメ・1話24分 × 13話 | **0.84** | 0.97 | 0.73 | 0.14 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 69点 |
| 3 | ドラゴンボール | TVアニメ・1話25分 × 153話 | **0.84** | 0.91 | 0.91 | 0.16 | -0.05 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 78点 |

### 「恋愛ものが見たい、でも重いのは嫌」

rules: `{"moods":[{"type":"romance","weight":1}],"energy":"low","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | クラスの大嫌いな女子と結婚することになった。 | TVアニメ・1話24分 × 12話 | **0.88** | 0.95 | 1.00 | 0.13 | -0.03 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 67点 |
| 2 | アオのハコ | 配信アニメ・1話24分 × 25話 | **0.85** | 0.89 | 1.00 | 0.16 | -0.06 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 81点 |
| 3 | 海辺のエトランゼ | 映画・約59分 | **0.83** | 0.83 | 0.90 | 0.15 | -0.01 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 77点 |

### 「進撃の巨人みたいなやつ」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":"進撃の巨人","format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 剣風伝奇ベルセルク | TVアニメ・1話25分 × 25話 | **0.92** | 0.95 | 0.91 | 0.17 | 0 | ダーク度：高 / 『進撃の巨人』に近い雰囲気 / ワクワク度：高 |
| 2 | 未来日記 | TVアニメ・1話23分 × 26話 | **0.90** | 0.93 | 1.00 | 0.14 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |
| 3 | 鋼の錬金術師 FULLMETAL ALCHEMIST | TVアニメ・1話25分 × 64話 | **0.87** | 0.95 | 0.73 | 0.18 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |

### 「5分だけ時間ある」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":5,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`  
notices: 条件を少しゆるめました

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | 旦那が何を言っているかわからない件 | ショートアニメ・1話4分 × 13話 | **0.60** | 0.63 | 0.47 | 0.14 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 70点 |
| 2 | 斉木楠雄のΨ難 | ショートアニメ・1話5分 × 120話 | **0.40** | 0.28 | 0.31 | 0.17 | 0 | 癒やし度：中 / 1話が5分以内 / AniList評価 83点 |
| 3 | のんのんびより | TVアニメ・1話24分 × 12話 | **0.95** | 0.98 | 1.00 | 0.16 | 0 | 癒やし度：高 / AniList評価 78点 |

### 「最近の完結済みで、隠れた名作の泣けるアニメ」

rules: `{"moods":[{"type":"cry","weight":1}],"energy":"mid","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":true,"era":"recent","popularity":"hidden-gem"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | ルックバック | 映画・約58分 | **0.99** | 0.90 | 0.67 | 0.17 | 0 | 感動度：高 / 完結済み / 最近の作品（2024年） |
| 2 | サイレント・ウィッチ 沈黙の魔女の隠しごと | TVアニメ・1話24分 × 13話 | **0.97** | 0.95 | 0.57 | 0.16 | 0 | 感動度：中 / 完結済み / 最近の作品（2025年） |
| 3 | 聲の形 | 映画・約130分 | **0.91** | 0.88 | 1.00 | 0.18 | 0 | 感動度：高 / 完結済み / AniList評価 88点 |

### 「映画で、昔の名作が見たい」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null,"format":"movie","completedOnly":false,"era":"classic","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | となりのトトロ | 映画・約86分 | **0.88** | 0.98 | 0.47 | 0.16 | 0 | 癒やし度：中 / 1988年の名作 / AniList評価 81点 |
| 2 | 映画けいおん！ | 映画・約110分 | **0.87** | 0.92 | 0.82 | 0.17 | 0 | 癒やし度：高 / AniList評価 84点 |
| 3 | 魔女の宅急便 | 映画・約105分 | **0.81** | 0.82 | 0.53 | 0.16 | 0 | 癒やし度：中 / 1989年の名作 / AniList評価 81点 |

### 「Tired from work. Something funny for 30 minutes before bed」

rules: `{"moods":[{"type":"laugh","weight":1}],"energy":"low","timeBudgetMin":30,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | D-Frag! | TV series · 24 min × 12 eps | **0.95** | 1.00 | 0.95 | 0.14 | +0.02 | Comedy: high / Each episode fits in 30 min / Heavy themes: almost none |
| 2 | Asobi Asobase - workshop of fun - | TV series · 24 min × 12 eps | **0.92** | 0.88 | 1.00 | 0.16 | +0.02 | Comedy: high / Each episode fits in 30 min / Heavy themes: almost none |
| 3 | Uncle from Another World | TV series · 24 min × 13 eps | **0.91** | 0.96 | 1.00 | 0.15 | -0.03 | Comedy: high / Each episode fits in 30 min / Heavy themes: a few |

### 「A tearjerker I can binge this weekend」

rules: `{"moods":[{"type":"cry","weight":1}],"energy":"high","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":true,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | A Silent Voice | Movie · 130 min | **0.96** | 0.88 | 1.00 | 0.18 | +0.05 | Emotional: high / Completed / AniList score 88 |
| 2 | Maquia: When the Promised Flower Blooms | Movie · 115 min | **0.94** | 0.85 | 1.00 | 0.16 | +0.05 | Emotional: high / Completed / A substantial watch |
| 3 | Angel Beats! | TV series · 24 min × 13 eps | **0.92** | 0.84 | 0.99 | 0.15 | +0.05 | Emotional: high / Completed / A substantial watch |

### 「Something exciting to watch with my family」

rules: `{"moods":[{"type":"thrill","weight":1}],"energy":"mid","timeBudgetMin":null,"company":"family","avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | World Trigger | TV series · 23 min × 73 eps | **0.85** | 0.94 | 0.77 | 0.15 | 0 | Excitement: high / Family-friendly (no graphic content) / AniList score 73 |
| 2 | The God of High School | TV series · 24 min × 13 eps | **0.84** | 0.97 | 0.73 | 0.14 | 0 | Excitement: high / Family-friendly (no graphic content) / AniList score 69 |
| 3 | Dragon Ball | TV series · 25 min × 153 eps | **0.84** | 0.91 | 0.91 | 0.16 | -0.05 | Excitement: high / Family-friendly (no graphic content) / AniList score 78 |

### 「Romance, but nothing too heavy」

rules: `{"moods":[{"type":"romance","weight":1}],"energy":"low","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | I'm Getting Married to a Girl I Hate in My Class | TV series · 24 min × 12 eps | **0.88** | 0.95 | 1.00 | 0.13 | -0.03 | Romance: high / Heavy themes: almost none / AniList score 67 |
| 2 | Blue Box | Web series · 24 min × 25 eps | **0.85** | 0.89 | 1.00 | 0.16 | -0.06 | Romance: high / Heavy themes: almost none / AniList score 81 |
| 3 | The Stranger by the Shore | Movie · 59 min | **0.83** | 0.83 | 0.90 | 0.15 | -0.01 | Romance: high / Heavy themes: almost none / AniList score 77 |

### 「Something like Attack on Titan」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":null,"company":null,"avoid":[],"referenceTitle":"Attack on Titan","format":"any","completedOnly":false,"era":"any","popularity":"any"}`

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | Berserk | TV series · 25 min × 25 eps | **0.92** | 0.95 | 0.91 | 0.17 | 0 | Darkness: high / Similar vibe to Attack on Titan / Excitement: high |
| 2 | The Future Diary | TV series · 23 min × 26 eps | **0.90** | 0.93 | 1.00 | 0.14 | 0 | Excitement: high / Similar vibe to Attack on Titan / Darkness: high |
| 3 | Fullmetal Alchemist: Brotherhood | TV series · 25 min × 64 eps | **0.87** | 0.95 | 0.73 | 0.18 | 0 | Excitement: high / Similar vibe to Attack on Titan / Darkness: high |

### 「I only have 5 minutes」

rules: `{"moods":[{"type":"relax","weight":0.5}],"energy":"mid","timeBudgetMin":5,"company":null,"avoid":[],"referenceTitle":null,"format":"any","completedOnly":false,"era":"any","popularity":"any"}`  
notices: Relaxed some conditions

| # | Title | Runtime | total | cos | int | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|
| 1 | I Can't Understand What My Husband Is Saying | Short series · 4 min × 13 eps | **0.60** | 0.63 | 0.47 | 0.14 | 0 | Relaxing: medium / Each episode fits in 5 min / AniList score 70 |
| 2 | The Disastrous Life of Saiki K. | Short series · 5 min × 120 eps | **0.40** | 0.28 | 0.31 | 0.17 | 0 | Relaxing: medium / Each episode fits in 5 min / AniList score 83 |
| 3 | Non Non Biyori | TV series · 24 min × 12 eps | **0.95** | 0.98 | 1.00 | 0.16 | 0 | Relaxing: high / AniList score 78 |

## 2026-09-29 23:23 — 16a0603 + uncommitted changes — themes, intent, scoring modes (no default mood), exact title search

### 「仕事で疲れた。寝る前に30分だけ笑えるやつ」

rules (mode: moods): `{"moods":["laugh"],"energy":"low","time":30}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ディーふらぐ! | TVアニメ・1話24分 × 12話 | **0.95** | 1.00 | 0.95 | 0.00 | 0.72 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 2 | あそびあそばせ | TVアニメ・1話24分 × 12話 | **0.92** | 0.88 | 1.00 | 0.00 | 0.79 | +0.02 | 笑い度：高 / 1話が30分以内 / 重い展開：ほぼなし |
| 3 | 異世界おじさん | TVアニメ・1話24分 × 13話 | **0.91** | 0.96 | 1.00 | 0.00 | 0.76 | -0.03 | 笑い度：高 / 1話が30分以内 / 重い展開：少なめ |

### 「週末に一気見できる、泣ける作品」

rules (mode: moods): `{"moods":["cry"],"energy":"high","completed":true}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 聲の形 | 映画・約130分 | **0.96** | 0.88 | 1.00 | 0.00 | 0.88 | +0.05 | 感動度：高 / 完結済み / AniList評価 88点 |
| 2 | さよならの朝に約束の花をかざろう | 映画・約115分 | **0.94** | 0.85 | 1.00 | 0.00 | 0.82 | +0.05 | 感動度：高 / 完結済み / 見ごたえ：たっぷり |
| 3 | Angel Beats! | TVアニメ・1話24分 × 13話 | **0.92** | 0.84 | 0.99 | 0.00 | 0.77 | +0.05 | 感動度：高 / 完結済み / 見ごたえ：たっぷり |

### 「家族で見られる、ワクワクするもの」

rules (mode: moods): `{"moods":["thrill"],"company":"family"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ワールドトリガー | TVアニメ・1話23分 × 73話 | **0.85** | 0.94 | 0.77 | 0.00 | 0.73 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 73点 |
| 2 | THE GOD OF HIGH SCHOOL ゴッド・オブ・ハイスクール | TVアニメ・1話24分 × 13話 | **0.84** | 0.97 | 0.73 | 0.00 | 0.69 | 0 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 69点 |
| 3 | ドラゴンボール | TVアニメ・1話25分 × 153話 | **0.84** | 0.91 | 0.91 | 0.00 | 0.78 | -0.05 | ワクワク度：高 / 家族で見やすい（過激な描写なし） / AniList評価 78点 |

### 「恋愛ものが見たい、でも重いのは嫌」

rules (mode: moods): `{"moods":["romance"],"energy":"low"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | クラスの大嫌いな女子と結婚することになった。 | TVアニメ・1話24分 × 12話 | **0.88** | 0.95 | 1.00 | 0.00 | 0.67 | -0.03 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 67点 |
| 2 | アオのハコ | 配信アニメ・1話24分 × 25話 | **0.85** | 0.89 | 1.00 | 0.00 | 0.81 | -0.06 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 81点 |
| 3 | 海辺のエトランゼ | 映画・約59分 | **0.83** | 0.83 | 0.90 | 0.00 | 0.77 | -0.01 | 恋愛度：高 / 重い展開：ほぼなし / AniList評価 77点 |

### 「進撃の巨人みたいなやつ」

rules (mode: moods): `{"ref":"進撃の巨人"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 剣風伝奇ベルセルク | TVアニメ・1話25分 × 25話 | **0.93** | 0.97 | 0.91 | 0.00 | 0.84 | 0 | ダーク度：高 / 『進撃の巨人』に近い雰囲気 / ワクワク度：高 |
| 2 | 未来日記 | TVアニメ・1話23分 × 26話 | **0.92** | 0.97 | 1.00 | 0.00 | 0.69 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |
| 3 | 鋼の錬金術師 FULLMETAL ALCHEMIST | TVアニメ・1話25分 × 64話 | **0.88** | 0.97 | 0.73 | 0.00 | 0.90 | 0 | ワクワク度：高 / 『進撃の巨人』に近い雰囲気 / ダーク度：高 |

### 「5分だけ時間ある」

rules (mode: open): `{"time":5}`  
notices: 条件を少しゆるめました

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 斉木楠雄のΨ難 | ショートアニメ・1話5分 × 120話 | **0.86** | 0.00 | 0.00 | 0.00 | 0.83 | 0 | 人気上位11% / AniList評価 83点 / 1話が5分以内 |
| 2 | 旦那が何を言っているかわからない件 | ショートアニメ・1話4分 × 13話 | **0.46** | 0.00 | 0.00 | 0.00 | 0.70 | 0 | 人気上位91% / AniList評価 70点 / 1話が5分以内 |
| 3 | 鋼の錬金術師 FULLMETAL ALCHEMIST | TVアニメ・1話25分 × 64話 | **0.94** | 0.00 | 0.00 | 0.00 | 0.90 | 0 | 人気上位2% / AniList評価 90点 |

### 「最近の完結済みで、隠れた名作の泣けるアニメ」

rules (mode: moods): `{"moods":["cry"],"completed":true,"era":"recent","popularity":"hidden-gem"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ルックバック | 映画・約58分 | **0.99** | 0.90 | 0.67 | 0.00 | 0.86 | +0.16 | 感動度：高 / 完結済み / 最近の作品（2024年） |
| 2 | サイレント・ウィッチ 沈黙の魔女の隠しごと | TVアニメ・1話24分 × 13話 | **0.97** | 0.95 | 0.57 | 0.00 | 0.81 | +0.16 | 感動度：中 / 完結済み / 最近の作品（2025年） |
| 3 | 聲の形 | 映画・約130分 | **0.91** | 0.88 | 1.00 | 0.00 | 0.88 | 0 | 感動度：高 / 完結済み / AniList評価 88点 |

### 「映画で、昔の名作が見たい」

rules (mode: open): `{"format":"movie","era":"classic"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 千と千尋の神隠し | 映画・約125分 | **0.97** | 0.00 | 0.00 | 0.00 | 0.86 | +0.08 | 人気上位6% / AniList評価 86点 / 2001年の名作 |
| 2 | ハウルの動く城 | 映画・約119分 | **0.95** | 0.00 | 0.00 | 0.00 | 0.85 | +0.08 | 人気上位11% / AniList評価 85点 / 2004年の名作 |
| 3 | もののけ姫 | 映画・約134分 | **0.93** | 0.00 | 0.00 | 0.00 | 0.85 | +0.08 | 人気上位15% / AniList評価 85点 / 1997年の名作 |

### 「Tired from work. Something funny for 30 minutes before bed」

rules (mode: moods): `{"moods":["laugh"],"energy":"low","time":30}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | D-Frag! | TV series · 24 min × 12 eps | **0.95** | 1.00 | 0.95 | 0.00 | 0.72 | +0.02 | Comedy: high / Each episode fits in 30 min / Heavy themes: almost none |
| 2 | Asobi Asobase - workshop of fun - | TV series · 24 min × 12 eps | **0.92** | 0.88 | 1.00 | 0.00 | 0.79 | +0.02 | Comedy: high / Each episode fits in 30 min / Heavy themes: almost none |
| 3 | Uncle from Another World | TV series · 24 min × 13 eps | **0.91** | 0.96 | 1.00 | 0.00 | 0.76 | -0.03 | Comedy: high / Each episode fits in 30 min / Heavy themes: a few |

### 「A tearjerker I can binge this weekend」

rules (mode: moods): `{"moods":["cry"],"energy":"high","completed":true}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | A Silent Voice | Movie · 130 min | **0.96** | 0.88 | 1.00 | 0.00 | 0.88 | +0.05 | Emotional: high / Completed / AniList score 88 |
| 2 | Maquia: When the Promised Flower Blooms | Movie · 115 min | **0.94** | 0.85 | 1.00 | 0.00 | 0.82 | +0.05 | Emotional: high / Completed / A substantial watch |
| 3 | Angel Beats! | TV series · 24 min × 13 eps | **0.92** | 0.84 | 0.99 | 0.00 | 0.77 | +0.05 | Emotional: high / Completed / A substantial watch |

### 「Something exciting to watch with my family」

rules (mode: moods): `{"moods":["thrill"],"company":"family"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | World Trigger | TV series · 23 min × 73 eps | **0.85** | 0.94 | 0.77 | 0.00 | 0.73 | 0 | Excitement: high / Family-friendly (no graphic content) / AniList score 73 |
| 2 | The God of High School | TV series · 24 min × 13 eps | **0.84** | 0.97 | 0.73 | 0.00 | 0.69 | 0 | Excitement: high / Family-friendly (no graphic content) / AniList score 69 |
| 3 | Dragon Ball | TV series · 25 min × 153 eps | **0.84** | 0.91 | 0.91 | 0.00 | 0.78 | -0.05 | Excitement: high / Family-friendly (no graphic content) / AniList score 78 |

### 「Romance, but nothing too heavy」

rules (mode: moods): `{"moods":["romance"],"energy":"low"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | I'm Getting Married to a Girl I Hate in My Class | TV series · 24 min × 12 eps | **0.88** | 0.95 | 1.00 | 0.00 | 0.67 | -0.03 | Romance: high / Heavy themes: almost none / AniList score 67 |
| 2 | Blue Box | Web series · 24 min × 25 eps | **0.85** | 0.89 | 1.00 | 0.00 | 0.81 | -0.06 | Romance: high / Heavy themes: almost none / AniList score 81 |
| 3 | The Stranger by the Shore | Movie · 59 min | **0.83** | 0.83 | 0.90 | 0.00 | 0.77 | -0.01 | Romance: high / Heavy themes: almost none / AniList score 77 |

### 「Something like Attack on Titan」

rules (mode: moods): `{"ref":"Attack on Titan"}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Berserk | TV series · 25 min × 25 eps | **0.93** | 0.97 | 0.91 | 0.00 | 0.84 | 0 | Darkness: high / Similar vibe to Attack on Titan / Excitement: high |
| 2 | The Future Diary | TV series · 23 min × 26 eps | **0.92** | 0.97 | 1.00 | 0.00 | 0.69 | 0 | Excitement: high / Similar vibe to Attack on Titan / Darkness: high |
| 3 | Fullmetal Alchemist: Brotherhood | TV series · 25 min × 64 eps | **0.88** | 0.97 | 0.73 | 0.00 | 0.90 | 0 | Excitement: high / Similar vibe to Attack on Titan / Darkness: high |

### 「I only have 5 minutes」

rules (mode: open): `{"time":5}`  
notices: Relaxed some conditions

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | The Disastrous Life of Saiki K. | Short series · 5 min × 120 eps | **0.86** | 0.00 | 0.00 | 0.00 | 0.83 | 0 | Top 11% most popular / AniList score 83 / Each episode fits in 5 min |
| 2 | I Can't Understand What My Husband Is Saying | Short series · 4 min × 13 eps | **0.46** | 0.00 | 0.00 | 0.00 | 0.70 | 0 | Top 91% most popular / AniList score 70 / Each episode fits in 5 min |
| 3 | Fullmetal Alchemist: Brotherhood | TV series · 25 min × 64 eps | **0.94** | 0.00 | 0.00 | 0.00 | 0.90 | 0 | Top 2% most popular / AniList score 90 |

### 「cooking」

rules (mode: themes): `{"themes":["cooking"]}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Delicious in Dungeon | TV series · 25 min × 24 eps | **0.94** | 0.00 | 0.00 | 0.98 | 0.85 | 0 | About: Cooking & food / AniList score 85 |
| 2 | Wagnaria!! | TV series · 24 min × 13 eps | **0.92** | 0.00 | 0.00 | 1.00 | 0.74 | 0 | About: Cooking & food / AniList score 74 |
| 3 | Campfire Cooking in Another World with my Absurd Skill | TV series · 24 min × 12 eps | **0.91** | 0.00 | 0.00 | 0.97 | 0.76 | 0 | About: Cooking & food / AniList score 76 |

### 「スポーツもので熱くなりたい」

rules (mode: moodsAndThemes): `{"moods":["thrill"],"themes":["sports"]}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ブルーロック | TVアニメ・1話25分 × 24話 | **0.78** | 0.81 | 0.50 | 0.92 | 0.79 | 0 | テーマ：スポーツ / ワクワク度：中 / AniList評価 79点 |
| 2 | 治癒魔法の間違った使い方 | TVアニメ・1話24分 × 13話 | **0.73** | 0.96 | 0.45 | 0.65 | 0.75 | 0 | テーマ：スポーツ / ワクワク度：中 / AniList評価 75点 |
| 3 | メガロボクス | TVアニメ・1話25分 × 13話 | **0.73** | 0.77 | 0.47 | 0.83 | 0.77 | 0 | テーマ：スポーツ / ワクワク度：中 / AniList評価 77点 |

### 「ハリー・ポッターみたいな」

rules (mode: open): `{"ref":"ハリー・ポッター"}`  
notices: 『ハリー・ポッター』が見つかりませんでした

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 鋼の錬金術師 FULLMETAL ALCHEMIST | TVアニメ・1話25分 × 64話 | **0.94** | 0.00 | 0.00 | 0.00 | 0.90 | 0 | 人気上位2% / AniList評価 90点 |
| 2 | 葬送のフリーレン | TVアニメ・1話24分 × 28話 | **0.92** | 0.00 | 0.00 | 0.00 | 0.91 | 0 | 人気上位6% / AniList評価 91点 |
| 3 | 聲の形 | 映画・約130分 | **0.92** | 0.00 | 0.00 | 0.00 | 0.88 | 0 | 人気上位2% / AniList評価 88点 |

### 「鬼滅の刃」

rules (mode: moods): `{"ref":"鬼滅の刃","titleSearch":true}`

| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |
|---|---|---|---|---|---|---|---|---|---|
| 検索した作品 | 鬼滅の刃 | TVアニメ・1話24分 × 26話 | **0.81** | 1.00 | 0.49 | 0.00 | 0.82 | 0 | ワクワク度：中 / 感動度：中 / AniList評価 82点 |
| 2 | 鋼の錬金術師 FULLMETAL ALCHEMIST | TVアニメ・1話25分 × 64話 | **0.87** | 0.91 | 0.77 | 0.00 | 0.90 | 0 | ワクワク度：高 / 『鬼滅の刃』に近い雰囲気 / 感動度：高 |
| 3 | 剣風伝奇ベルセルク | TVアニメ・1話25分 × 25話 | **0.86** | 0.92 | 0.79 | 0.00 | 0.84 | 0 | ワクワク度：高 / 『鬼滅の刃』に近い雰囲気 / ダーク度：高 |

### 「今日の天気は？」

rules (mode: open): `{"intent":"off_topic"}`

> AniMatchはアニメ選びのお手伝いだけできます。今の気分や、見たいジャンル・時間を書いてください。

### 「asdfgh」

rules (mode: open): `{"intent":"unclear"}`

> I couldn't read that. Try a mood, a genre or how much time you have — or pick from the buttons above.
