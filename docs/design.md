# デザイン仕様: 企業別応募管理タブ

## 既存デザイン分析

既存ダッシュボードはインラインスタイルで構築されている（Tailwind未使用）。
以下はデザイントークンとして統一する値。本機能もインラインスタイルで実装し、既存コードとの一貫性を保つ。

## デザイントークン

### カラーパレット

| 用途 | 色コード | 使用箇所 |
|------|---------|---------|
| タブアクセント | `#e16032` | タブドット、タブ選択時のボーダー、セクション見出し |
| 背景 | `#f3f2f2` | ページ全体背景（既存と同一） |
| カード背景 | `#fff` | カード・テーブル背景（既存と同一） |
| カードボーダー | `#e5e5e5` | カード外枠（既存と同一） |
| テキスト-主要 | `#1d1d1f` | 見出し、企業名、数値 |
| テキスト-補助 | `#706e6b` | ラベル、サブテキスト |
| テキスト-淡い | `#b0adab` | プレースホルダー、ID番号 |
| ファネル-応募 | `#0176d3` | 棒グラフ: 応募数 |
| ファネル-一次 | `#1b96ff` | 棒グラフ: 一次面接 |
| ファネル-最終 | `#7a288a` | 棒グラフ: 最終面接 |
| ファネル-内定 | `#ea780e` | 棒グラフ: 内定 |
| ファネル-決定 | `#2e844a` | 棒グラフ: 決定 |
| 成功 | `#2e844a` / `#eaf5ea` | 正の変化、完了状態 |
| 警告 | `#ba0517` / `#fce9e9` | 削除ボタン、負の変化 |
| フォーム背景 | `#fafaf9` | 入力フォームの背景色 |

### タイポグラフィ

| 要素 | font-size | font-weight | font-family |
|------|-----------|-------------|-------------|
| セクション見出し | 11px | 600 | DM Sans |
| カード見出し | 13px | 600 | DM Sans |
| テーブルヘッダ | 10px | 600 | DM Sans |
| テーブルセル | 12px | 400 (通常) / 600 (数値) | DM Sans |
| 数値（大） | 28px | 700 | inherit |
| 数値（テーブル） | 12px | 600 | DM Mono, monospace |
| ラベル（フォーム） | 10px | 700 | DM Sans |
| 入力フィールド | 13px | 400 | DM Sans |
| ボタン | 12px | 700 | DM Sans |

### 余白・サイズ

| 要素 | 値 |
|------|-----|
| ページ内パディング | `24px 28px` |
| maxWidth | `1280px` |
| カード padding | `20px` (通常) / `18px 20px` (フォーム) |
| カード border-radius | `10px` |
| カード border | `1px solid #e5e5e5` |
| グリッド gap | `12px` (KPIカード) / `16px` (セクション) |
| テーブルセル padding | `10px 12px` |
| ボタン padding | `7px 18px` |
| ボタン border-radius | `8px` |
| 入力フィールド padding | `8px 10px` |
| 入力フィールド border-radius | `7px` |

---

## コンポーネント一覧

### CompanySummaryCards（Sprint 2）

- **用途**: 企業データの集計サマリーを4つのカードで表示
- **レイアウト**: `display: grid; gridTemplateColumns: repeat(4, minmax(0, 1fr)); gap: 12px`
- **カード仕様**: 既存 `KpiCard` と同じ外見を踏襲

| カード | ラベル | アイコン | 色 | 値の単位 |
|--------|--------|---------|-----|---------|
| 登録企業数 | 企業数 | 🏢 | `#e16032` | 社 |
| 合計応募数 | 応募数 | 📝 | `#0176d3` | 件 |
| 合計決定数 | 決定数 | ✓ | `#2e844a` | 件 |
| 全体通過率 | 通過率 | % | `#7a288a` | % |

**各カード構造** (既存KpiCardスタイル準拠):
```
コンテナ: background: #fff, border: 1px solid #e5e5e5, borderRadius: 10, padding: 18
  上部アクセントバー: position: absolute, top: 0, height: 3, background: [色]
  アイコン枠: width: 36, height: 36, borderRadius: 9, background: [色]22
  ラベル: fontSize: 10, fontWeight: 600, color: #706e6b, textTransform: uppercase
  値: fontSize: 28, fontWeight: 700, color: #1d1d1f
  サブテキスト: fontSize: 11, color: #706e6b
  プログレスバー: height: 3, background: #f3f2f2 → [色]
```

---

### CompanyFunnelChart（Sprint 2）

- **用途**: 企業別のファネル進捗を棒グラフで表示
- **コンテナ**: 既存 `card()` ヘルパーでラップ
- **グラフ種別**: Chart.js `Bar` (グループ化棒グラフ)
- **高さ**: `280px`
- **データセット色**:

| ステージ | backgroundColor | borderRadius |
|---------|----------------|--------------|
| 応募 | `#0176d3` | 4 |
| 一次面接 | `#1b96ff` | 4 |
| 最終面接 | `#7a288a` | 4 |
| 内定 | `#ea780e` | 4 |
| 決定 | `#2e844a` | 4 |

**Chart.js オプション**:
```javascript
{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: { font: { size: 10 }, boxWidth: 12, padding: 12 }
    }
  },
  scales: {
    x: { ticks: { font: { size: 10 }, color: '#706e6b' }, grid: { display: false } },
    y: { ticks: { font: { size: 9 }, color: '#888', stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } }
  }
}
```

**空状態**: データ0件のとき、グラフの代わりに以下を表示:
```
コンテナ: textAlign: center, padding: 40
テキスト: fontSize: 13, color: #706e6b
内容: "企業データを追加すると、ファネルグラフが表示されます"
```

---

### CompanyTable（Sprint 1）

- **用途**: 企業別データの一覧テーブル
- **コンテナ**: 既存 `card()` ヘルパーでラップ。`overflowX: auto` でスクロール対応。
- **テーブル構造**: 既存 `WeekTable` のスタイルを踏襲

**テーブルヘッダ**:
```
th: fontSize: 10, fontWeight: 600, textTransform: uppercase, letterSpacing: .06em,
    color: #706e6b, padding: 8px 12px, textAlign: left,
    background: #f3f2f2, borderBottom: 1px solid #e5e5e5
```

**テーブルセル**:
```
td: padding: 10px 12px, borderBottom: 1px solid #f3f2f2, fontSize: 12
数値セル: fontFamily: DM Mono, monospace, fontWeight: 600
企業名セル: fontWeight: 600, color: #1d1d1f
CA名セル: fontWeight: 400, color: #706e6b
```

**カラム構成**:

| カラム | 幅 | 配置 |
|--------|-----|------|
| 企業名 | flex (auto) | left |
| 担当CA | 80px | left |
| 応募 | 60px | right |
| 一次 | 60px | right |
| 最終 | 60px | right |
| 内定 | 60px | right |
| 決定 | 60px | right |
| 操作 | 100px | center |

**操作ボタン**:
- 編集: `fontSize: 11, fontWeight: 600, padding: 4px 10px, borderRadius: 6, border: 1px solid #e5e5e5, background: #fff, color: #0176d3, cursor: pointer`
- 削除: `fontSize: 11, fontWeight: 600, padding: 4px 10px, borderRadius: 6, border: 1px solid #fce9e9, background: #fff, color: #ba0517, cursor: pointer`
- ボタン間の gap: `6px`

**行ホバー**: `background: #fafaf9` (CSS擬似クラスはインラインでは使えないため、onMouseEnter/onMouseLeave で制御)

**空状態**:
```
コンテナ: textAlign: center, padding: 32
テキスト: fontSize: 13, color: #706e6b
内容: "企業データがありません。下のフォームから追加してください。"
```

---

### CompanyForm（Sprint 1）

- **用途**: 企業データの入力・編集フォーム
- **コンテナ**: 既存 `TopicForm` のスタイルを踏襲
```
background: #fafaf9, border: 1px solid #e5e5e5,
borderLeft: 3px solid #e16032, borderRadius: 10, padding: 18px 20px
```

**フォームレイアウト**:
```
上段（1列）: 企業名（テキスト入力、幅100%）
中段（1列）: 担当CA（セレクトボックス、幅100%）
下段（5列グリッド）: 応募数 / 一次面接 / 最終面接 / 内定 / 決定
  gridTemplateColumns: repeat(5, 1fr), gap: 8px
ボタン行: display: flex, justifyContent: flex-end, gap: 8px, marginTop: 14px
```

**ラベル**:
```
fontSize: 10, fontWeight: 700, textTransform: uppercase, letterSpacing: .06em,
color: #706e6b, display: block, marginBottom: 4
```

**テキスト入力**:
```
width: 100%, fontSize: 13, padding: 8px 10px,
border: 1px solid #e5e5e5, borderRadius: 7, background: #fff,
color: #1d1d1f, outline: none, fontFamily: DM Sans, sans-serif
```

**数値入力**:
```
width: 100%, fontSize: 13, fontWeight: 600, padding: 8px 10px,
border: 1px solid #e5e5e5, borderRadius: 7, background: #fff,
color: #1d1d1f, outline: none, fontFamily: DM Mono, monospace
```

**セレクトボックス**:
```
width: 100%, fontSize: 13, padding: 8px 10px,
border: 1px solid #e5e5e5, borderRadius: 7, background: #fff,
color: #1d1d1f, outline: none, fontFamily: DM Sans, sans-serif
```

**ボタン**:
- キャンセル: `fontSize: 12, fontWeight: 600, padding: 7px 16px, borderRadius: 7, border: 1px solid #e5e5e5, background: #fff, color: #706e6b`
- 追加/更新: `fontSize: 12, fontWeight: 700, padding: 7px 18px, borderRadius: 7, border: none, background: #e16032, color: #fff`

---

### 削除確認ダイアログ

- **用途**: データ削除前の確認
- **実装**: `window.confirm()` で十分。カスタムモーダルは不要。
  - メッセージ: `「${企業名}」のデータを削除しますか？`

---

## タブ追加の仕様

既存の `TAB_LABELS` と `TAB_COLORS` 配列の末尾に追加:

```javascript
// 既存
const TAB_COLORS = ['#0176d3','#1b96ff','#2e844a','#7a288a','#ea780e']
const TAB_LABELS = ['全体サマリー','SC 振り返り','CS 振り返り','PJ 振り返り','その他トピックス']

// 変更後
const TAB_COLORS = ['#0176d3','#1b96ff','#2e844a','#7a288a','#ea780e','#e16032']
const TAB_LABELS = ['全体サマリー','SC 振り返り','CS 振り返り','PJ 振り返り','その他トピックス','企業別進捗']
```

タブドット・選択時ボーダー色は既存のロジック (`TAB_COLORS[i]`) で自動適用される。

---

## Sprint 2 レイアウト構成

タブ5のコンテンツ領域の全体レイアウト:

```
ページヘッダ（企業別進捗 + 追加ボタン）
  display: flex, alignItems: center, justifyContent: space-between, marginBottom: 20

サマリーカード行
  display: grid, gridTemplateColumns: repeat(4, minmax(0, 1fr)), gap: 12, marginBottom: 20

ファネルグラフカード
  card() ラップ, marginBottom: 16

データテーブルカード
  card() ラップ, marginBottom: 16

入力フォーム（常に表示 or ボタンで展開）
  ボタン: 「+ 企業を追加」ボタンクリックで表示/非表示を切り替え
```
