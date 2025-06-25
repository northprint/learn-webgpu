# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

これはSvelteKitを使用したWebGPU学習のためのインタラクティブなWebアプリケーションです。ユーザーがブラウザ上でコードを編集・実行しながらWebGPUの概念を学べるチュートリアル形式のアプリケーション。

## 開発環境のセットアップ

### 必要な前提条件
- Node.js 18以上
- WebGPU対応ブラウザ（Chrome 113+, Edge 113+, または Chrome Canary）

### 初回セットアップコマンド
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 型チェック
npm run check

# ビルド
npm run build
```

## プロジェクト構造

```
learn-webgpu/
├── src/
│   ├── routes/              # SvelteKitルート
│   │   ├── +layout.svelte   # 共通レイアウト
│   │   ├── +page.svelte     # ホームページ
│   │   └── tutorial/        # チュートリアルページ
│   ├── lib/
│   │   ├── components/      # 再利用可能なコンポーネント
│   │   ├── webgpu/         # WebGPUユーティリティ
│   │   ├── tutorials/      # チュートリアルコンテンツ
│   │   └── stores/         # Svelteストア
│   └── app.css             # グローバルスタイル（Tailwind）
├── static/                 # 静的ファイル
├── .tmp/                   # 設計とタスク管理
│   ├── design.md          # 要件定義
│   └── task.md            # タスクリスト
└── CLAUDE.md              # このファイル
```

## 開発ワークフロー

1. **新機能の開発開始時**
   - `.tmp/design.md`に要件を記載
   - `.tmp/task.md`にタスクを分解して記載
   - `feature/`ブランチを作成

2. **コンポーネント開発時の注意点**
   - Svelte 5のRunes API（`$state`, `$derived`等）を使用
   - TypeScriptで型安全性を確保
   - コンポーネントは`src/lib/components/`に配置

3. **WebGPU実装時の注意点**
   - 必ず`navigator.gpu`の存在確認を行う
   - エラーハンドリングを適切に実装
   - GPUリソースの適切な破棄処理

## 技術スタック

- **フレームワーク**: SvelteKit (Svelte 5)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **ビルドツール**: Vite
- **WebGPU API**: ネイティブWebGPU
- **シェーダー言語**: WGSL (WebGPU Shading Language)

## コンポーネント設計

### 主要コンポーネント
- `CodeEditor.svelte`: コードエディタ（Monaco EditorまたはCodeMirror）
- `WebGPUCanvas.svelte`: WebGPUレンダリングキャンバス
- `TutorialNav.svelte`: チュートリアルナビゲーション
- `ConsoleOutput.svelte`: コンソール出力表示

### ストア設計
- `progress.ts`: ユーザーの学習進捗管理
- `editor.ts`: エディタの状態管理

## WebGPU特有の考慮事項

1. **ブラウザ互換性**
   - WebGPUサポートチェックを必ず実装
   - 非対応ブラウザへの適切なメッセージ表示

2. **リソース管理**
   - GPUバッファーやテクスチャの適切な破棄
   - メモリリークの防止

3. **パフォーマンス**
   - 不要なGPU-CPU間のデータ転送を避ける
   - レンダーループの最適化

## 重要な注意事項

- WebGPUはまだ実験的なAPIのため、仕様が変更される可能性がある
- 開発時は必ずWebGPU対応ブラウザを使用する
- チュートリアルコンテンツは`src/lib/tutorials/`に整理して配置
- コードはフロントエンドで完結するように実装（サーバーサイド処理不要）