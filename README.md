# 🍸 カクテル千鳥足 3D ―見知らぬ天井―

酔っぱらいの一人称で夜の路地を駆け抜ける、ドッジ・ランナー。
奥から迫る電柱・自販機・自転車・通行人・猫・警官を**左右に避けて**、どこまで歩けるか。
ただし足元は **千鳥足**。勝手に揺れる体を補正しながら避けるのが肝。

Three.js + Vite 製。ビルドすれば GitHub Pages・itch.io・Netlify などにそのまま出せます。

---

## 遊び方

| 操作 | キーボード | スマホ |
|---|---|---|
| 左へ避ける | `←` / `A` | 画面の左半分をタッチ |
| 右へ避ける | `→` / `D` | 画面の右半分をタッチ |
| 開始 / リトライ | `Space` / タップ | タップ |
| 消音 | `M` | — |

- **前進は自動**。プレイヤーは止まりません。来る障害物を左右でかわします。
- **酔い度**が上がるほど千鳥足のドリフトが強くなり、まっすぐ進むのが難しくなります。
- **お酒**を拾うと得点倍率アップ、ただし酔い度も上昇（自業自得のジレンマ）。
- **水**で解毒。たまに「テキーラだった！」の罠。**ゲロ**を踏むと一瞬操作不能。
- 障害物への激突、または側溝への落下、酔い度MAXの昏倒でゲームオーバー。

---

## 開発・実行

必要環境：Node.js 18 以上。

```bash
npm install        # 依存をインストール
npm run dev        # 開発サーバ（http://localhost:5173）
npm run build      # dist/ に本番ビルド
npm run preview    # ビルド結果をローカル確認
```

---

## 公開（世に出す）

### A. GitHub Pages（自動デプロイ）
1. このフォルダを GitHub リポジトリに push。
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする。
3. `main` へ push するたび `.github/workflows/deploy.yml` が `npm run build` して Pages に公開します。

### B. itch.io
```bash
npm run build
```
`dist/` の中身を zip 圧縮して itch.io に「HTML」プロジェクトとしてアップロード。
`index.html` をメインに指定すれば動きます（`base: './'` 設定済みなのでパス問題なし）。

### C. Netlify / Vercel / 任意の静的ホスティング
ビルドコマンド `npm run build`、公開ディレクトリ `dist` を指定するだけ。

---

## 構成

```
chidori-ashi/
├── index.html              # エントリ（HUD・タイトル・リザルトのDOM）
├── vite.config.js          # base:'./' でどこでも動く
├── src/
│   ├── main.js             # 全体の進行・状態遷移・ループ
│   ├── config.js           # 手触りの数値はすべてここ
│   ├── audio.js            # Web Audio で効果音を合成（素材ゼロ）
│   ├── input.js            # キーボード/タッチのステア入力
│   ├── world.js            # シーン・路地・ネオン・霧（軽量化済み）
│   ├── player.js           # 自動前進＋千鳥足＋一人称カメラ
│   ├── spawner.js          # 障害物/アイテムのプール・出現・当たり判定
│   ├── postfx.js           # 酔いの二重視ポスト
│   ├── ui.js               # HUD・画面遷移
│   ├── styles.css
│   └── shaders/
│       ├── fullscreen.vert.glsl
│       └── drunk.frag.glsl  # 二重視・色ずれ・ブラー
└── .github/workflows/deploy.yml
```

## チューニング
ほとんどの手触りは `src/config.js` で調整できます。たとえば
- `run.speedStart` / `speedMax`：走る速さ
- `steer.maxVx`：左右の避けやすさ
- `drunk.driftMax` / `yawMax`：酔いの揺れの強さ
- `spawn.minGap` / `maxGap`：障害物の密度

## 軽量化メモ
カクつきの主因は「建物・提灯ごとに本物のライトを置く」設計でした。
本バージョンではネオン・提灯を**発光マテリアル**にし、動的ライトはプレイヤー追従の街灯1個のみ。
酔いのポストエフェクトも素面のうちは丸ごとスキップしています。

## License
MIT
