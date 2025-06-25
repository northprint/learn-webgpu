# ダークモード背景色修正の設計

## 問題の概要

ダークモード時に以下の箇所で背景が白くなっている問題を修正する：
1. チュートリアルのメイン画面の背景
2. プレイグラウンドの表示部分
3. プレイグラウンドのサンプル選択部分

## 調査結果

### 問題のあるファイルと箇所

1. **TutorialSteps.svelte** (行204)
   - `.tutorial-steps`に`bg-white`が直接指定されている
   - ダークモード対応: `bg-white dark:bg-gray-900`

2. **WebGPUCanvas.svelte** (行201, 223)
   - canvasタグに`bg-gray-50 dark:bg-gray-900`
   - `.error-message`, `.loading-message`に`bg-gray-50 dark:bg-gray-900`

3. **tutorial/[slug]/[example]/+page.svelte** (行396, 987, 1031, 1072, 1086)
   - `.preview-canvas`に`bg-gray-50 dark:bg-gray-900/50`
   - `.view-mode-tabs`に`bg-gray-50 dark:bg-gray-900/50`
   - `.typing-solution`に`bg-gray-50 dark:bg-gray-900/50`
   - `.challenges-section`に`bg-gray-50 dark:bg-gray-900/50`

4. **playground/+page.svelte** (行360, 396)
   - `.sample-select`に`bg-white dark:bg-gray-800`
   - `.preview-canvas`に`bg-gray-50 dark:bg-gray-900/50`

5. **tutorial/+page.svelte** (行15)
   - 進捗表示に`bg-blue-50 dark:bg-blue-900/20`（これは適切）

6. **app.css** (行35)
   - `.card`クラスに`bg-gray-50 dark:bg-gray-900`（これは適切）

## 修正方針

1. 明示的に`bg-white`が指定されている箇所にダークモード対応を追加
2. `bg-gray-50`が指定されている箇所で、ダークモード時の背景色が不適切な場合は修正
3. 一貫性のある色使いにする：
   - カード・セクション: `bg-white dark:bg-gray-900`
   - 薄い背景色が必要な箇所: `bg-gray-50 dark:bg-gray-900/50`
   - フォーム要素: `bg-white dark:bg-gray-800`
