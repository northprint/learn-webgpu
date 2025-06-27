<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import { tutorialChapters } from '$lib/tutorials';
	
	interface Props {
		currentChapter?: string;
		currentExample?: string;
	}
	
	let { currentChapter, currentExample }: Props = $props();
	
	let expandedChapters = $state<Set<string>>(new Set([currentChapter].filter(Boolean)));
	
	function toggleChapter(chapterId: string) {
		if (expandedChapters.has(chapterId)) {
			expandedChapters.delete(chapterId);
		} else {
			expandedChapters.add(chapterId);
		}
		expandedChapters = new Set(expandedChapters);
	}
	
	// 現在のパスに基づいて展開状態を更新
	$effect(() => {
		if (currentChapter && !expandedChapters.has(currentChapter)) {
			expandedChapters.add(currentChapter);
			expandedChapters = new Set(expandedChapters);
		}
	});
</script>

<nav class="tutorial-nav">
	<h2 class="tutorial-nav-header">{$_('tutorial.title')}</h2>
	
	<div class="tutorial-nav-content">
		{#each tutorialChapters as chapter}
			<div class="chapter-group">
				<button
					onclick={() => toggleChapter(chapter.id)}
					class="chapter-header"
					class:active={currentChapter === chapter.id}
				>
					<span class="flex-1 text-left">{$_(`tutorial.chapters.${chapter.id}.title`)}</span>
					<svg 
						class="w-4 h-4 transition-transform"
						class:rotate-90={expandedChapters.has(chapter.id)}
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
				
				{#if expandedChapters.has(chapter.id)}
					<div class="example-list">
						{#each chapter.examples as example}
							<a
								href="/tutorial/{chapter.id}/{example.id}"
								class="example-link"
								class:active={currentChapter === chapter.id && currentExample === example.id}
							>
								{$_(`tutorial.chapters.${chapter.id}.examples.${example.id}`)}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</nav>

<style>
	.tutorial-nav {
		@apply flex flex-col h-full;
	}
	
	.tutorial-nav-header {
		@apply text-lg font-semibold px-4 py-4 border-b border-[var(--color-border)] flex-shrink-0;
	}
	
	.tutorial-nav-content {
		@apply flex-1 overflow-y-auto py-4;
	}
	
	.chapter-header {
		@apply w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 transition-colors text-sm;
	}
	
	:global(.dark) .chapter-header:hover {
		@apply bg-gray-800;
	}
	
	.chapter-header.active {
		@apply text-gpu-blue font-medium;
	}
	
	.example-list {
		@apply ml-4 border-l border-gray-200;
	}
	
	:global(.dark) .example-list {
		@apply border-gray-700;
	}
	
	.example-link {
		@apply block px-4 py-2 ml-2 text-sm text-gray-800 hover:text-gpu-blue transition-colors;
	}
	
	:global(.dark) .example-link {
		@apply text-gray-400;
	}
	
	.example-link.active {
		@apply text-gpu-blue font-medium border-l-2 border-gpu-blue -ml-px;
		background-color: rgb(239 246 255);
	}
	
	:global(.dark) .example-link.active {
		background-color: rgb(30 58 138 / 0.2);
	}
</style>