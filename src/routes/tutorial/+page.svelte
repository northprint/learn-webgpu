<script lang="ts">
	import { tutorialChapters } from '$lib/tutorials';
	import { progress, completionRate } from '$lib/stores/progress';
	import { isExampleCompleted } from '$lib/stores/progress';
</script>

<svelte:head>
	<title>チュートリアル - WebGPU Learn</title>
</svelte:head>

<div class="tutorial-list-container">
	<h1 class="text-3xl font-bold mb-6">WebGPUチュートリアル</h1>
	
	<!-- 進捗表示 -->
	<div class="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium">学習進捗</span>
			<span class="text-sm text-gray-800 dark:text-gray-400">
				{$completionRate.completed} / {$completionRate.total} 完了
			</span>
		</div>
		<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
			<div 
				class="bg-gpu-blue h-2 rounded-full transition-all duration-300"
				style="width: {$completionRate.percentage}%"
			></div>
		</div>
	</div>
	
	<!-- チャプター一覧 -->
	<div class="space-y-6">
		{#each tutorialChapters as chapter, chapterIndex}
			<div class="card">
				<div class="flex items-start gap-4">
					<div class="flex-shrink-0 w-12 h-12 bg-gpu-blue/10 rounded-lg flex items-center justify-center">
						<span class="text-lg font-bold text-gpu-blue">{chapterIndex + 1}</span>
					</div>
					
					<div class="flex-1">
						<h2 class="text-xl font-semibold mb-2">{chapter.title}</h2>
						<p class="text-gray-800 dark:text-gray-300 mb-4">{chapter.description}</p>
						
						<div class="space-y-2">
							{#each chapter.examples as example}
								{@const isCompleted = isExampleCompleted(chapter.id, example.id, $progress)}
								<a 
									href="/tutorial/{chapter.id}/{example.id}"
									class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gpu-blue transition-colors group"
								>
									<div class="flex-shrink-0">
										{#if isCompleted}
											<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
												<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
											</div>
										{:else}
											<div class="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full group-hover:border-gpu-blue transition-colors"></div>
										{/if}
									</div>
									
									<div class="flex-1">
										<h3 class="font-medium group-hover:text-gpu-blue transition-colors">
											{example.title}
										</h3>
										<p class="text-sm text-gray-800 dark:text-gray-400">
											{example.description}
										</p>
									</div>
									
									<svg class="w-5 h-5 text-gray-400 group-hover:text-gpu-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</a>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
	
	<!-- 最後に訪問したページへのリンク -->
	{#if $progress.lastVisited && $progress.lastVisited !== '/tutorial'}
		<div class="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
			<p class="text-sm text-gray-800 dark:text-gray-400 mb-2">前回の続きから：</p>
			<a 
				href={$progress.lastVisited} 
				class="inline-flex items-center gap-2 text-gpu-blue hover:underline"
			>
				続きを学習する
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	{/if}
</div>

<style>
	.tutorial-list-container {
		@apply container mx-auto px-6 py-8 max-w-4xl h-full;
	}
</style>