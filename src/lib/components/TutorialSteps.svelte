<script lang="ts">
	import type { TutorialStep } from '$lib/webgpu/types';
	import { marked } from 'marked';
	import { progress } from '$lib/stores/progress';
	import { m } from '$lib/paraglide/messages';
	
	interface Props {
		steps: TutorialStep[];
		currentStep?: number;
		onStepComplete?: (stepIndex: number) => void;
		chapterId: string;
		exampleId: string;
		class?: string;
	}
	
	let { 
		steps, 
		currentStep = $bindable(0),
		onStepComplete,
		chapterId,
		exampleId,
		class: className = ''
	}: Props = $props();
	
	let expandedSteps = $state(new Set<number>([currentStep]));
	
	// progressストアから初期のcompletedStepsを取得
	let completedSteps = $state(progress.getCompletedSteps(chapterId, exampleId));
	
	// ステップの展開/折りたたみ
	function toggleStep(index: number) {
		if (expandedSteps.has(index)) {
			expandedSteps.delete(index);
		} else {
			expandedSteps.add(index);
		}
		expandedSteps = new Set(expandedSteps);
	}
	
	// ステップを完了
	function markStepComplete(index: number) {
		// ローカル状態を更新（直接 mutate せず新しい Set を作成）
		completedSteps = new Set([...completedSteps, index]);
		
		// progressストアに完了状態を保存
		progress.markStepCompleted(chapterId, exampleId, index);
		
		// 次のステップに自動的に進む
		if (index < steps.length - 1) {
			currentStep = index + 1;
			expandedSteps.add(index + 1);
			expandedSteps = new Set(expandedSteps);
		}
		
		if (onStepComplete) {
			onStepComplete(index);
		}
	}
	
	// chapterIdまたはexampleIdが変更されたときに、completedStepsを更新
	$effect(() => {
		completedSteps = new Set(progress.getCompletedSteps(chapterId, exampleId));
	});
	
	// Markdownをパース（同期実行を明示）
	function parseMarkdown(content: string): string {
		return marked.parse(content, { async: false });
	}
	
	// すべてのステップが完了しているかチェック
	let allStepsCompleted = $derived(completedSteps.size === steps.length && steps.length > 0);
</script>

<div class="tutorial-steps {className}">
	<h3 class="text-lg font-semibold mb-4">{m.tutorial_steps_title()}</h3>
	
	<div class="space-y-2">
		{#each steps as step, index}
			<div class="step-item" class:active={currentStep === index}>
				<button
					onclick={() => toggleStep(index)}
					class="step-header"
					class:completed={completedSteps.has(index)}
				>
					<div class="flex items-center gap-3">
						<!-- ステップ番号/チェックマーク -->
						<div class="step-indicator">
							{#if completedSteps.has(index)}
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else}
								<span class="text-sm font-medium">{index + 1}</span>
							{/if}
						</div>
						
						<!-- ステップタイトル -->
						<span class="flex-1 text-left font-medium">{step.title}</span>
						
						<!-- 展開/折りたたみアイコン -->
						<svg 
							class="w-4 h-4 transition-transform"
							class:rotate-90={expandedSteps.has(index)}
							fill="none" 
							stroke="currentColor" 
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</div>
				</button>
				
				{#if expandedSteps.has(index)}
					<div class="step-content">
						<!-- 説明 -->
						<div class="prose prose-sm dark:prose-invert max-w-none mb-4">
							{@html parseMarkdown(step.content)}
						</div>
						
						<!-- タスク -->
						{#if step.task}
							<div class="task-box">
								<h4 class="font-medium mb-2 flex items-center gap-2">
									<svg class="w-4 h-4 text-gpu-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
									{m.tutorial_steps_task_label()}
								</h4>
								<p class="text-sm">{step.task}</p>
							</div>
						{/if}
						
						<!-- ヒント -->
						{#if step.hint}
							<details class="hint-box">
								<summary class="cursor-pointer font-medium text-sm">
									{m.tutorial_steps_hint_show()}
								</summary>
								<p class="mt-2 text-sm">{step.hint}</p>
							</details>
						{/if}
						
						<!-- 完了ボタン -->
						{#if !completedSteps.has(index)}
							<button
								onclick={() => markStepComplete(index)}
								class="btn-primary btn-sm mt-4"
							>
								{m.tutorial_steps_complete_step()}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
	
	<!-- 進捗表示 -->
	<div class="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium">{m.tutorial_steps_progress_label()}</span>
			<span class="text-sm text-gray-800 dark:text-gray-400">
				{m.tutorial_steps_progress_summary({ completed: String(completedSteps.size), total: String(steps.length) })}
			</span>
		</div>
		<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
			<div 
				class="bg-gpu-blue h-2 rounded-full transition-all duration-300"
				style="width: {(completedSteps.size / steps.length) * 100}%"
			></div>
		</div>
	</div>
	
	<!-- すべてのステップが完了したら次の単元への案内を表示 -->
	{#if allStepsCompleted}
		<div class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
			<div class="flex items-start gap-3">
				<svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div class="flex-1">
					<h4 class="font-semibold text-green-900 dark:text-green-100 mb-1">
						{m.tutorial_steps_all_done_title()}
					</h4>
					<p class="text-sm text-green-800 dark:text-green-200 mb-3">
						{m.tutorial_steps_all_done_body()}
					</p>
					<button
						onclick={() => window.dispatchEvent(new CustomEvent('navigate-next-example'))}
						class="btn-primary btn-sm flex items-center gap-2"
					>
						{m.tutorial_steps_go_next()}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.tutorial-steps {
		@apply rounded-lg p-6 shadow-sm border border-[var(--color-border)];
		background-color: rgb(255 255 255);
	}
	
	:global(.dark) .tutorial-steps {
		background-color: rgb(17 24 39);
	}
	
	.step-item {
		@apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all;
	}
	
	.step-item.active {
		@apply border-gpu-blue;
	}
	
	.step-header {
		@apply w-full p-4 hover:bg-gray-50 transition-colors;
	}
	
	:global(.dark) .step-header:hover {
		@apply bg-gray-800;
	}
	
	.step-header.completed {
		background-color: rgb(240 253 244);
	}
	
	:global(.dark) .step-header.completed {
		background-color: rgb(20 83 45 / 0.2);
	}
	
	.step-indicator {
		@apply w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0;
		@apply bg-gray-200 dark:bg-gray-700;
		@apply text-gray-700 dark:text-gray-200;
	}
	
	.step-header.completed .step-indicator {
		@apply bg-green-500;
	}
	
	.step-content {
		@apply p-4 pt-0;
	}
	
	.task-box {
		@apply p-4 rounded-lg mb-4;
		background-color: rgb(239 246 255);
	}
	
	:global(.dark) .task-box {
		background-color: rgb(30 58 138 / 0.2);
	}
	
	.hint-box {
		@apply p-4 rounded-lg mb-4;
		background-color: rgb(254 252 232);
	}
	
	:global(.dark) .hint-box {
		background-color: rgb(120 53 15 / 0.2);
	}
	
	.btn-sm {
		@apply px-3 py-1.5 text-sm;
	}
	
	/* Proseスタイルのカスタマイズ */
	:global(.prose :not(pre) > code) {
		@apply bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded;
	}

	:global(.prose pre) {
		@apply bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200;
	}

	:global(.prose pre code) {
		@apply bg-transparent text-inherit p-0;
	}
</style>