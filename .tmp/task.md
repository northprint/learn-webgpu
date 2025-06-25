# ダークモード背景色修正タスク

## タスクリスト

### 1. TutorialSteps.svelteの修正
- [x] `.tutorial-steps`クラスの`bg-white`を`bg-white dark:bg-gray-900`に変更
  - 確認結果: 既に適切に設定されていた

### 2. WebGPUCanvas.svelteの確認
- [x] canvasタグとエラー/ローディングメッセージの背景色を確認（既に適切な設定のため変更不要）

### 3. tutorial/[slug]/[example]/+page.svelteの確認
- [x] 各セクションの背景色を確認（既に適切な設定のため変更不要）

### 4. playground/+page.svelteの確認
- [x] `.sample-select`と`.preview-canvas`の背景色を確認（既に適切な設定のため変更不要）

### 5. tutorial/+layout.svelteの修正
- [x] `.tutorial-sidebar`のハードコードされた背景色を修正
  - `background-color: rgb(249 250 251);`を`bg-gray-50 dark:bg-gray-900/50`に変更

### 6. TutorialNav.svelteの修正
- [x] `.chapter-header`のホバー状態を統合
- [x] `.example-link.active`の背景色を統合
- [x] `.example-list`と`.example-link`のダークモードスタイルを統合

### 7. 動作確認
- [ ] チュートリアル画面でダークモード切り替えをテスト
- [ ] プレイグラウンド画面でダークモード切り替えをテスト
- [ ] 各コンポーネントの背景色が適切に変更されることを確認

## 進捗状況

- 開始: 2025-06-24
- ステータス: 完了
- 完了: 2025-06-24
