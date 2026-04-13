# 実装進捗: 企業別応募管理タブ

## Sprint 1: データ基盤とCRUDフォーム — 完了

### 実装内容

1. **型定義追加** (`types/index.ts`)
   - `CompanyRow` インターフェースを追加

2. **CRUD API** (`app/api/company-progress/route.ts`) — 新規作成
   - GET: `?week=Week_YYYY_MM_DD` で週別データ取得
   - POST: 新規企業データ追加（UUID自動生成）
   - PUT: 既存データ更新
   - DELETE: `?id=uuid` でデータ削除
   - 既存 `summary-meta` API と同じ認証パターンを使用

3. **タブ5 UI** (`app/page.tsx`)
   - `TAB_LABELS` / `TAB_COLORS` に「企業別進捗」(`#e16032`) を追加
   - state: `companyRows`, `showCompanyForm`, `editingCompanyId`, `companyForm`
   - `loadAll` 内で `/api/company-progress` からデータ読み込み
   - 企業一覧テーブル（行ホバー、編集・削除ボタン付き）
   - 入力/編集フォーム（企業名、担当CA選択、数値5フィールド）
   - 削除時 `window.confirm()` で確認

### 既存機能への影響: なし
- 既存タブ(0〜4)のコード変更なし
- `TAB_LABELS`/`TAB_COLORS` 配列の末尾追加のみ
- 既存API・Slack通知に変更なし

---

## Sprint 2: サマリーカード + ファネル棒グラフ — 完了

### 実装内容

1. **サマリーカード** (4枚、KpiCard コンポーネント再利用)
   - 企業数 / 応募数 / 決定数 / 通過率(%)
   - 既存 KpiCard と同じデザイン、色は仕様書通り

2. **ファネル棒グラフ** (Chart.js Bar)
   - 企業別に5ステージ（応募→一次→最終→内定→決定）をグループ化棒グラフで表示
   - 凡例表示、企業名が長い場合は8文字で省略
   - データ0件時は代替メッセージ表示

3. **レイアウト**
   - サマリーカード → ファネルグラフ → データテーブル → フォームの順

### 既存機能への影響: なし

---

## 自己評価

| 基準 | 自己評価 | 備考 |
|------|---------|------|
| 機能完全性 | 4/5 | CRUD・グラフ・サマリーすべて実装済み |
| 動作安定性 | 4/5 | TypeScript型チェックエラーなし、ビルド成功 |
| UI/UX品質 | 4/5 | 既存デザイン言語を完全踏襲 |
| エラーハンドリング | 3/5 | API呼び出しの基本エラー処理あり |
| 回帰なし | 5/5 | 既存タブ・API・Slack通知に変更なし |

## 起動方法

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開き、タブバーの「企業別進捗」タブをクリック。

## Supabase テーブル作成（手動で実行が必要）

Supabase ダッシュボードの SQL Editor で以下を実行:

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

CREATE INDEX idx_company_progress_week ON company_progress (week_key);

ALTER TABLE company_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON company_progress
  FOR ALL USING (true) WITH CHECK (true);
```

## テスト観点（Evaluator向け）

1. 「企業別進捗」タブが表示されクリックで切り替え可能か
2. 既存5タブ（全体サマリー〜その他トピックス）が変更前と同じか
3. フォームから企業データを追加→テーブルに表示されるか
4. ページリロード後もデータが残るか（Supabase永続化）
5. 週の切り替えで正しいデータが表示されるか
6. 編集ボタン→フォームに値がセットされ更新できるか
7. 削除ボタン→確認後に削除されるか
8. サマリーカードの集計値がデータ追加/削除で更新されるか
9. ファネル棒グラフが企業数に応じて正しく表示されるか
10. データ0件時の空状態表示
