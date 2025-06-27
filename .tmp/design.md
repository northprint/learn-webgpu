# WebGPU学習アプリケーション 多言語化設計

## 概要

WebGPU学習アプリケーションに多言語化（国際化）機能を実装し、日本語と英語の両方をサポートする。

## 要件

### 機能要件

1. **対応言語**
   - 日本語（ja）: デフォルト言語
   - 英語（en）: 第二言語

2. **言語切替機能**
   - ヘッダーに言語切替ボタンを配置
   - ユーザーの選択を保存（LocalStorageまたはCookie）
   - ブラウザの言語設定を初期値として利用

3. **翻訳対象**
   - UI要素（ボタン、ラベル、メニュー等）
   - チュートリアルコンテンツ
   - エラーメッセージ
   - プレイグラウンドのサンプルコード説明
   - WebGPUのコード例（コメント部分）

4. **URL構造**
   - パスベースの言語切替（例: `/en/tutorial`, `/ja/tutorial`）
   - デフォルト言語の場合はパスを省略可能

### 非機能要件

1. **パフォーマンス**
   - 言語切替時の遅延を最小限に
   - 翻訳ファイルの遅延読み込み

2. **保守性**
   - 翻訳ファイルの管理が容易
   - 新しい言語の追加が簡単

3. **SEO対応**
   - 各言語版に適切なメタタグ設定
   - hreflangタグの設定

## 技術選定

### i18nライブラリ

**svelte-i18n**を採用
- SvelteKitとの相性が良い
- 軽量で高速
- リアクティブな翻訳更新
- 複数形対応
- 日付・数値フォーマット対応

### 代替案との比較
- `typesafe-i18n`: 型安全性は高いが、設定が複雑
- `i18next`: 多機能だが、Svelteとの統合が複雑

## アーキテクチャ設計

### ディレクトリ構造

```
src/
├── lib/
│   ├── i18n/
│   │   ├── index.ts          # i18n初期化と設定
│   │   ├── locales/
│   │   │   ├── ja/          # 日本語翻訳
│   │   │   │   ├── common.json
│   │   │   │   ├── tutorial.json
│   │   │   │   ├── playground.json
│   │   │   │   └── errors.json
│   │   │   └── en/          # 英語翻訳
│   │   │       ├── common.json
│   │   │       ├── tutorial.json
│   │   │       ├── playground.json
│   │   │       └── errors.json
│   │   └── types.ts         # 翻訳キーの型定義
│   └── stores/
│       └── locale.ts         # 言語設定ストア
├── routes/
│   ├── [[lang]]/            # オプショナルな言語パラメータ
│   │   ├── +layout.ts       # 言語設定の初期化
│   │   ├── +page.svelte
│   │   ├── tutorial/
│   │   ├── playground/
│   │   └── reference/
│   └── +layout.svelte       # 言語切替UIの配置
```

### コンポーネント設計

1. **LanguageSelector.svelte**
   - 言語切替ドロップダウン
   - 現在の言語を表示
   - 言語変更時のルーティング処理

2. **既存コンポーネントの更新**
   - すべてのテキストを翻訳関数（$t）で置換
   - 動的コンテンツの言語対応

### 翻訳ファイル構造

```json
// ja/common.json
{
  "app": {
    "title": "WebGPUを学ぼう",
    "description": "インタラクティブなチュートリアルでWebGPUをマスター"
  },
  "nav": {
    "home": "ホーム",
    "tutorial": "チュートリアル",
    "playground": "プレイグラウンド",
    "reference": "リファレンス",
    "settings": "設定"
  },
  "actions": {
    "run": "実行",
    "reset": "リセット",
    "copy": "コピー",
    "share": "共有"
  }
}

// ja/tutorial.json
{
  "chapters": {
    "introduction": {
      "title": "イントロダクション",
      "description": "WebGPUの基礎を学ぶ"
    },
    "first-triangle": {
      "title": "最初の三角形",
      "description": "基本的な描画を理解する"
    }
  },
  "progress": {
    "completed": "完了",
    "inProgress": "進行中",
    "notStarted": "未開始"
  }
}
```

### ストア設計

```typescript
// lib/stores/locale.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export const locale = writable<'ja' | 'en'>('ja');
export const localeRoute = derived(locale, ($locale) => 
  $locale === 'ja' ? '' : `/${$locale}`
);

// 言語設定の永続化
if (browser) {
  const saved = localStorage.getItem('locale');
  if (saved === 'en' || saved === 'ja') {
    locale.set(saved);
  }
  
  locale.subscribe((value) => {
    localStorage.setItem('locale', value);
  });
}
```

## 実装計画

### Phase 1: 基盤構築
1. svelte-i18nの導入と設定
2. 言語切替ストアの実装
3. 翻訳ファイル構造の作成
4. LanguageSelectorコンポーネントの実装

### Phase 2: UI翻訳
1. 共通UIコンポーネントの翻訳
2. ナビゲーション要素の翻訳
3. フォーム要素の翻訳
4. エラーメッセージの翻訳

### Phase 3: コンテンツ翻訳
1. チュートリアルコンテンツの翻訳システム
2. プレイグラウンドサンプルの翻訳
3. リファレンスページの翻訳

### Phase 4: 最適化とテスト
1. 翻訳ファイルの遅延読み込み
2. SEO対応（メタタグ、hreflang）
3. 言語切替のE2Eテスト
4. パフォーマンス最適化

## 考慮事項

1. **コードサンプルの扱い**
   - WebGPUコード自体は英語のまま
   - コメントのみ翻訳対象とする

2. **チュートリアルコンテンツ**
   - Markdownファイルを言語別に管理
   - 動的インポートで必要な言語のみ読み込み

3. **型安全性**
   - 翻訳キーの型定義を自動生成
   - 存在しないキーの使用を防ぐ

4. **フォールバック**
   - 翻訳が見つからない場合は英語にフォールバック
   - 開発環境では警告を表示

## Phase 3: コンテンツ翻訳設計（追加）

### 現状の課題
- チュートリアルコンテンツがTypeScriptファイル内に直接埋め込まれている
- 各チャプターのtitle、description、steps内のcontent、task、hintが日本語でハードコーディングされている
- 言語切り替え時にこれらのコンテンツが翻訳されない

### 解決方針

#### 方針1: 翻訳キーベースのアプローチ（推奨）
- 既存のTypeScriptファイル構造を維持
- コンテンツ部分を翻訳キーに置き換え
- 翻訳ファイルにコンテンツを移動

**メリット:**
- 既存のコード構造への影響が最小限
- 型安全性を維持できる
- 翻訳の管理が容易

**実装方法:**
1. 各チャプターファイルで翻訳キーを使用
2. `src/lib/i18n/locales/[lang]/tutorials/`に翻訳ファイルを配置
3. 各チャプターごとに翻訳ファイルを作成

### 実装計画

#### 1. 翻訳ファイル構造
```
src/lib/i18n/locales/
├── ja/
│   └── tutorials/
│       ├── getting-started.json
│       ├── first-triangle.json
│       ├── buffers-and-uniforms.json
│       ├── textures.json
│       ├── lighting.json
│       ├── compute-graphics.json
│       └── performance.json
└── en/
    └── tutorials/
        └── (同じ構造)
```

#### 2. 翻訳キー構造
```json
{
  "gettingStarted": {
    "title": "基礎編: WebGPUの基本概念とセットアップ",
    "description": "WebGPUの基本概念を理解し、開発環境をセットアップします",
    "examples": {
      "webgpuInit": {
        "title": "WebGPUの初期化",
        "description": "WebGPUアダプターとデバイスの取得方法を学びます",
        "steps": {
          "step1": {
            "title": "WebGPUの基本概念",
            "content": "WebGPUは、Webブラウザで高性能な...",
            "task": "コンソールに「WebGPUの初期化に成功しました！」と表示されるまで..."
          }
        }
      }
    }
  }
}
```

#### 3. チャプターファイルの更新方法
- 各チャプターをファクトリー関数に変換
- 実行時に現在の言語設定を読み取って適切な翻訳を返す
- コードコメントは言語に応じて動的に生成

#### 4. 動的コンテンツの処理
- コードコメントの翻訳は`initialCode`内で言語に応じて切り替え
- エラーメッセージやコンソール出力も翻訳対応

### 非同期チュートリアルコンテンツローディング

#### 概要
チュートリアルページのonMountフックを更新し、非同期でコンテンツをロードできるように拡張。

#### 実装内容
1. **onMountフックの拡張**
   - AbortControllerを使用したキャンセル可能な非同期処理
   - マウント状態の追跡による適切なクリーンアップ
   - 外部リソースの非同期ロード対応

2. **型定義の拡張**
   - `TutorialExample`インターフェースに`externalResources`プロパティを追加
   - 画像、データファイルなどの外部リソースURLを配列で管理

3. **翻訳キーの追加**
   - `tutorialDetail.console.loadingTutorial`: チュートリアル読み込み中メッセージ
   - `tutorialDetail.console.tutorialLoaded`: チュートリアル読み込み完了メッセージ
   - `tutorialDetail.errors.loadingFailed`: チュートリアル読み込み失敗メッセージ

#### 利点
- チュートリアルに画像やデータファイルなどの外部リソースを含められる
- 非同期処理のキャンセル機能により、ページ遷移時のメモリリークを防止
- ロード状態をユーザーに明示的に表示