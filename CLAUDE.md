# MTG-Summary プロジェクトルール

SC・CSチームの商談サマリーダッシュボード。週次の営業KPI（決定数・売上・面談数・稼働数・ズバ確定・CL見込み）を集約・可視化し、Slack で自動通知する。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 (App Router) + React 19 + Chart.js |
| データベース | Supabase (テーブル: `mtg_summary_meta`) |
| ホスティング | Vercel (standalone output) |
| 定期実行 | Vercel Cron (`/api/cron/slack`) + GitHub Actions (`slack-daily.yml`) |
| 言語 | TypeScript (アプリ本体) / Python (GitHub Actions スクリプト) |

## データソース

ダッシュボードは2つの外部システムからデータを取得する:

- **SC データ**: `sc-weekly.vercel.app` (清野・茨木・菊地・福田・大西・南原)
- **CS データ**: `carista-weekly.vercel.app` (中村・大城・小谷・喜多)

週キーの形式が異なる点に注意:
- SC: `Week_YYYY_MM_DD` (月曜日基準)
- CS: `YYYY_MM_NW` (例: `2025_02_1W`)

## エージェント構成

機能追加・改修は 5 エージェント構成で行う。

```
Planner ──→ Architect ──→ AI Designer ──→ Generator ──→ Evaluator
 (企画)      (設計)        (UI設計)        (実装)        (検証)
                                            ↑               │
                                            └── 不合格時 ──┘
```

### 各エージェントの役割

| エージェント | 責務 | 書き込み権限 | 読み取り専用 |
|-------------|------|-------------|-------------|
| **Planner** (企画) | ユーザー要求から仕様書を作成 | `/docs/spec.md` | progress.md, feedback |
| **Architect** (設計) | DB設計・API設計・影響範囲分析 | `/docs/architecture.md` | spec.md, 既存ソースコード |
| **AI Designer** (UI設計) | コンポーネント単位のデザイン仕様策定 | `/docs/design.md` | spec.md, architecture.md |
| **Generator** (実装) | 仕様・設計・デザインに基づき1スプリントずつ実装 | `/docs/progress.md`, ソースコード | spec.md, architecture.md, design.md, feedback |
| **Evaluator** (検証) | 受け入れ基準に沿ってテスト・評価 | `/docs/feedback/sprint-N.md` | spec.md, progress.md |

エージェント定義ファイル: `.claude/agents/architect.md`, `.claude/agents/ai-designer.md`

**責務を越境しない**: Planner は実装しない。Architect はコードを書かない。AI Designer はコードを書かない。Generator は仕様・設計を変更しない。Evaluator はコードを修正しない。

## 機能追加ワークフロー

### Step 1: 仕様策定 (Planner)
- ユーザーの要求を受け取り `/docs/spec.md` を作成
- 技術的な実装詳細（DB設計、API設計）には踏み込まない
- 各スプリントにテスト可能な受け入れ基準を記述する

### Step 2: 技術設計 (Architect)
- `/docs/spec.md` を読み、既存の Supabase スキーマと API エンドポイントへの影響を分析
- DB設計・API設計・型定義の変更を `/docs/architecture.md` に出力
- 実装詳細（コード）には踏み込まず「何をどう設計するか」のみ記述

### Step 3: UI設計 (AI Designer)
- `/docs/spec.md` と `/docs/architecture.md` を読み、既存デザインとの一貫性を確認
- コンポーネント単位のデザイン仕様を `/docs/design.md` に出力
- Tailwind クラス名まで具体的に指定する

### Step 4: 実装 (Generator)
- `/docs/spec.md`, `/docs/architecture.md`, `/docs/design.md` を読み、次のスプリントを特定
- 1回の呼び出しで1スプリントのみ実装する
- 完了時に `/docs/progress.md` へ自己評価・起動方法・テストURLを記録
- 前スプリントのフィードバックがあれば修正を先に行う

### Step 5: 検証 (Evaluator)
- 受け入れ基準と引き渡し事項を読み、アプリを実際に操作してテスト
- 結果を `/docs/feedback/sprint-N.md` に出力
- **不合格** → Generator に差し戻し (Step 4 へ)
- **合格** → 次のスプリントへ (Step 4 へ)

### Step 6: デプロイ
- `main` ブランチへマージ → Vercel が自動デプロイ
- デプロイ後に Slack 通知が正常動作することを確認

## 品質基準

各スプリントは以下すべての閾値を満たさなければ合格とならない:

| 基準 | 閾値 | 不合格時の扱い |
|------|------|---------------|
| 機能完全性 | 4/5 以上 | Generator に差し戻し |
| 動作安定性 | 4/5 以上 | Generator に差し戻し |
| UI/UX品質 | 3/5 以上 | Generator に差し戻し |
| エラーハンドリング | 3/5 以上 | Generator に差し戻し |
| 回帰なし | 5/5 必須 | Generator に差し戻し |

**1つでも閾値を下回ればスプリント不合格。**

## 絶対ルール

1. **既存機能を壊さない** - 回帰テストは 5/5 必須。既存のタブ・KPIカード・チャート・データテーブルが変更後も正常に動作すること。
2. **本番デプロイ前にビルド確認** - `npm run build` が成功することを必ず確認してからマージする。型エラー・ランタイムエラーを残さない。
3. **Slack 通知を壊さない** - `/api/cron/slack` と `.github/workflows/slack-daily.yml` の両方が正常に動作すること。Slack メッセージのフォーマット変更は影響範囲を確認してから行う。
4. **責務を越境しない** - 各エージェントは自分の書き込み権限内のファイルのみ変更する。
5. **スプリント順序を守る** - Sprint 1 → 2 → 3 と順番に実装する。スキップ禁止。
6. **フィードバックを最優先で処理する** - Generator は新スプリント着手前に、前スプリントの不合格フィードバックを修正すること。
7. **動作する状態を維持する** - 各スプリント完了時にアプリが正常に起動・動作すること。

## ファイル構成

```
mtg-summary/
├── app/
│   ├── page.tsx                  # メインダッシュボード (タブ5画面)
│   ├── layout.tsx                # ルートレイアウト
│   ├── globals.css               # グローバルスタイル
│   └── api/
│       ├── sc-data/route.ts      # SC 週次データ取得
│       ├── cs-data/route.ts      # CS 週次データ取得
│       ├── sc-history/route.ts   # SC 8週間履歴
│       ├── cs-history/route.ts   # CS 8週間履歴
│       ├── summary-meta/route.ts # Supabase メタデータ CRUD
│       └── cron/slack/route.ts   # Vercel Cron Slack 通知
├── types/
│   └── index.ts                  # 型定義 (CaRow, WeekData, CA名定数)
├── lib/                          # ユーティリティ (必要に応じて追加)
├── .claude/agents/                # エージェント定義ファイル
│   ├── architect.md              # Architect エージェント
│   └── ai-designer.md            # AI Designer エージェント
├── docs/                         # エージェント間のドキュメント
│   ├── spec.md                   # 仕様書 (Planner が書く)
│   ├── architecture.md           # 技術設計書 (Architect が書く)
│   ├── design.md                 # デザイン仕様 (AI Designer が書く)
│   ├── progress.md               # 進捗記録 (Generator が書く)
│   └── feedback/                 # 評価結果 (Evaluator が書く)
│       └── sprint-N.md
├── .github/workflows/
│   └── slack-daily.yml           # GitHub Actions Slack 通知
├── vercel.json                   # Vercel Cron 設定
├── next.config.js                # Next.js 設定 (standalone)
├── tsconfig.json                 # TypeScript 設定
└── package.json                  # 依存関係
```

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド (デプロイ前に必ず実行)
npm run start    # 本番サーバー起動
npm run lint     # ESLint 実行
```

## ダッシュボードのタブ構成

| タブ | 内容 |
|------|------|
| 0: 週次概要 | SC/CS の KPI カード + チーム比較バー + ランキング |
| 1: SC データ | SC 週次推移テーブル (6週間) |
| 2: CS データ | CS 週次推移テーブル (6週間) |
| 3: トピック | 議題カード (色分け・タグ付き) の CRUD |
| 4: プロジェクト | プロジェクトカード (進捗・ステータス管理) |
