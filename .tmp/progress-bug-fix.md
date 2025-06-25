# 学習進捗管理のバグ修正

## 問題の説明
ユーザーから報告された問題：「どこでもいいので学習ステップを進めると、全ての項目のステップが完了してしまいます」

## 調査結果

### 現在の実装
1. `TutorialSteps.svelte`コンポーネント
   - ローカルな`completedSteps`状態を持つ（Set<number>）
   - ステップ完了時に`markStepComplete`関数が呼ばれる
   - `onStepComplete`コールバックプロパティはオプション

2. `/src/routes/tutorial/[slug]/[example]/+page.svelte`
   - `TutorialSteps`コンポーネントを使用
   - `onStepComplete`プロパティを渡していない
   - 別途`markAsCompleted`関数があり、チュートリアル例題全体を完了とマーク

3. `progress.ts`ストア
   - `markCompleted(chapterId, exampleId)`でチュートリアル例題を完了
   - 完了状態はlocalStorageに保存

### 問題の原因
`TutorialSteps`コンポーネントの`completedSteps`状態が、各チュートリアル例題間で分離されていない可能性がある。これにより、一つのステップを完了すると、他のチュートリアル例題のステップも完了状態になってしまう。

### 修正方針
1. `TutorialSteps`の`completedSteps`状態を、各チュートリアル例題ごとに分離する
2. ステップの完了状態を`progress`ストアで管理し、`chapterId`と`exampleId`でスコープを設定
3. ステップレベルの進捗管理を追加する