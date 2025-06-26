# Learn WebGPU

WebGPUを学習するためのインタラクティブなチュートリアルWebアプリケーション。

🌐 **ライブサイト**: [https://learn-webgpu.com/](https://learn-webgpu.com/)

## 概要

Learn WebGPUはブラウザでWebGPUを学習できるインタラクティブなチュートリアルアプリケーションです。実際にコードを編集・実行しながら、WebGPUの基礎から応用まで段階的に学習できます。

## 主な機能

- **インタラクティブなチュートリアル**: 実際にコードを書きながら学習
- **リアルタイムプレビュー**: コードの変更が即座にレンダリング結果に反映
- **進捗管理**: 学習の進捗を自動保存
- **プレイグラウンド**: 自由にWebGPUコードを実験できる環境
- **高機能エディタ**: Monaco Editorによる快適なコーディング体験
- **WGSL対応**: WebGPU Shading Languageのシンタックスハイライトと補完

## 必要な環境

- Node.js 18以上
- WebGPU対応ブラウザ（Chrome 113+、Edge 113+、またはChrome Canary）

## インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## ビルド

```bash
# プロダクションビルド
npm run build

# ビルドしたアプリのプレビュー
npm run preview
```

## 技術スタック

- **フレームワーク**: SvelteKit (Svelte 5)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **コードエディタ**: Monaco Editor
- **WebGPU API**: ネイティブWebGPU（ポリフィルなし）

## プロジェクト構造

```
src/
├── routes/              # ページコンポーネント
│   ├── +page.svelte    # ホームページ
│   ├── tutorial/       # チュートリアルページ
│   ├── playground/     # プレイグラウンド
│   └── reference/      # リファレンス
├── lib/
│   ├── components/     # 再利用可能なコンポーネント
│   ├── webgpu/        # WebGPUユーティリティ
│   ├── tutorials/     # チュートリアルコンテンツ
│   └── stores/        # 状態管理
└── app.css            # グローバルスタイル
```

## ライセンス

MIT