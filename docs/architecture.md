# 技術設計書: 企業別応募管理タブ

## 概要

既存ダッシュボードにタブ5「企業別進捗」を追加する。企業単位の選考ファネルデータを管理・可視化する機能の技術設計。

## 影響範囲

### 変更が必要なファイル

| ファイル | 変更内容 |
|---------|---------|
| `app/page.tsx` | タブ追加、新コンポーネント追加、state追加 |
| `app/api/company-progress/route.ts` | **新規作成** — CRUD API |
| `types/index.ts` | `CompanyRow` 型を追加 |

### 変更しないファイル（影響なし）

- `app/api/sc-data/route.ts` — 変更なし
- `app/api/cs-data/route.ts` — 変更なし
- `app/api/sc-history/route.ts` — 変更なし
- `app/api/cs-history/route.ts` — 変更なし
- `app/api/summary-meta/route.ts` — 変更なし
- `app/api/cron/slack/route.ts` — 変更なし
- `.github/workflows/slack-daily.yml` — 変更なし
- `vercel.json` — 変更なし

### 破壊的変更: なし

既存テーブル・既存API・既存タブへの変更は一切発生しない。

---

## DB設計

### 新テーブル: `company_progress`

Supabase で以下のテーブルを作成する。

```sql
CREATE TABLE company_progress (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_key    TEXT NOT NULL,
  company     TEXT NOT NULL,
  ca_name     TEXT NOT NULL,
  applied     INTEGER DEFAULT 0,
  first_interview  INTEGER DEFAULT 0,
  final_interview  INTEGER DEFAULT 0,
  offered     INTEGER DEFAULT 0,
  decided     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 検索用インデックス
CREATE INDEX idx_company_progress_week ON company_progress (week_key);

-- RLS ポリシー (anon key でのCRUDを許可)
ALTER TABLE company_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON company_progress
  FOR ALL USING (true) WITH CHECK (true);
```

**設計判断:**
- `mtg_summary_meta` の JSON カラムに同居させない。理由: 行単位のCRUD（編集・削除）が必要であり、JSON内のネスト操作は複雑になる。独立テーブルの方がクエリ・更新がシンプル。
- `week_key` は既存の SC 形式 (`Week_YYYY_MM_DD`) に合わせる。`page.tsx` の `labelToKey()` をそのまま使用可能。
- UUID を主キーにすることで、フロント側でのIDハンドリングが簡潔になる。

---

## API設計

### 新規エンドポイント: `/api/company-progress`

**パス**: `app/api/company-progress/route.ts`

#### GET — 一覧取得

```
GET /api/company-progress?week=Week_2025_04_07
```

**レスポンス:**
```json
{
  "rows": [
    {
      "id": "uuid-xxx",
      "week_key": "Week_2025_04_07",
      "company": "株式会社A",
      "ca_name": "清野",
      "applied": 5,
      "first_interview": 3,
      "final_interview": 2,
      "offered": 1,
      "decided": 1,
      "created_at": "2025-04-07T10:00:00Z",
      "updated_at": "2025-04-07T10:00:00Z"
    }
  ]
}
```

**実装方針:**
- Supabase REST API で `week_key=eq.<week>` フィルタ
- `order=created_at.asc` でソート
- `force-dynamic` 設定

#### POST — 新規追加

```
POST /api/company-progress
Content-Type: application/json

{
  "week_key": "Week_2025_04_07",
  "company": "株式会社A",
  "ca_name": "清野",
  "applied": 5,
  "first_interview": 3,
  "final_interview": 2,
  "offered": 1,
  "decided": 1
}
```

**レスポンス:** `{ "ok": true, "id": "uuid-xxx" }`

**実装方針:**
- Supabase REST API への POST
- `Prefer: return=representation` でIDを返す

#### PUT — 更新

```
PUT /api/company-progress
Content-Type: application/json

{
  "id": "uuid-xxx",
  "company": "株式会社A",
  "ca_name": "清野",
  "applied": 6,
  "first_interview": 4,
  "final_interview": 2,
  "offered": 1,
  "decided": 1
}
```

**レスポンス:** `{ "ok": true }`

**実装方針:**
- Supabase REST API の PATCH (`id=eq.<id>`)
- `updated_at` を自動更新

#### DELETE — 削除

```
DELETE /api/company-progress?id=uuid-xxx
```

**レスポンス:** `{ "ok": true }`

**実装方針:**
- Supabase REST API の DELETE (`id=eq.<id>`)

---

## 型定義の変更

`types/index.ts` に追加:

```typescript
export interface CompanyRow {
  id: string;
  week_key: string;
  company: string;
  ca_name: string;
  applied: number;
  first_interview: number;
  final_interview: number;
  offered: number;
  decided: number;
  created_at?: string;
  updated_at?: string;
}
```

既存の `CaRow`, `WeekData`, `SegmentData` は変更しない。

---

## 技術選定

新しいライブラリの追加は不要。

| 用途 | 技術 | 理由 |
|------|------|------|
| グラフ | Chart.js (既存) | 既に `react-chartjs-2` がインストール済み。`Bar` コンポーネントを使用 |
| DB | Supabase (既存) | 既存の接続情報・認証方式をそのまま流用 |
| ID生成 | Supabase `gen_random_uuid()` | サーバー側で自動生成。フロント側のID管理不要 |

---

## Generator への引き渡し事項

### 実装順序の推奨

**Sprint 1:**
1. Supabase にテーブル `company_progress` を作成（手動 or マイグレーション）
2. `types/index.ts` に `CompanyRow` 型を追加
3. `app/api/company-progress/route.ts` を新規作成（GET/POST/PUT/DELETE）
4. `app/page.tsx` にタブ5を追加（TAB_LABELS, TAB_COLORS の配列末尾に追加）
5. `CompanyForm` コンポーネント（入力フォーム）を実装
6. `CompanyTable` コンポーネント（一覧テーブル + 編集 + 削除）を実装
7. state管理（`companyRows`, `loadCompanyData`, CRUD操作）を追加

**Sprint 2:**
1. `CompanySummaryCards` コンポーネント（集計KPIカード）を実装
2. `CompanyFunnelChart` コンポーネント（Chart.js 棒グラフ）を実装
3. レイアウト統合（カード → グラフ → テーブル → フォーム）

### 注意点・制約

- **タブインデックス**: 既存タブは `[0,1,2,3,4]`。新タブは `5` に追加。`TAB_LABELS` と `TAB_COLORS` の配列末尾に push するだけで良い。
- **Supabase 認証**: 既存パターン（`summary-meta/route.ts`）と同じ `SUPABASE_ANON_KEY` / `SUPABASE_URL` 環境変数を使用する。
- **週キー**: フロント側で `labelToKey(week)` を呼んで `Week_YYYY_MM_DD` 形式に変換してAPIに渡す。既存ロジックを流用。
- **Chart.js の競合回避**: `ChartJS.register()` は `page.tsx` 先頭で1回だけ呼ばれている。`BarElement` は既に登録済みなので追加登録不要。

### テスト観点

- 企業データのCRUD（追加・読み取り・更新・削除）が正しく動作するか
- 週の切り替え時に正しいデータが読み込まれるか
- 空データ時の表示（テーブル空、グラフ非表示）
- 既存タブ（0〜4）への回帰テスト
- `npm run build` の成功
