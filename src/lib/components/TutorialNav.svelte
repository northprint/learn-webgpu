<script lang="ts">
	import { page } from '$app/stores';
	import { tutorialChapters } from '$lib/tutorials';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	
	interface Props {
		currentChapter?: string;
		currentExample?: string;
	}
	
	let { currentChapter, currentExample }: Props = $props();
	
	let expandedChapters = $state<Set<string>>(new Set(currentChapter ? [currentChapter] : []));
	
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
	<h2 class="tutorial-nav-header">{m.nav_tutorial()}</h2>
	
	<div class="tutorial-nav-content">
		{#each tutorialChapters as chapter}
			<div class="chapter-group">
				<button
					onclick={() => toggleChapter(chapter.id)}
					class="chapter-header"
					class:active={currentChapter === chapter.id}
				>
					<span class="flex-1 text-left">{chapter.title}</span>
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
								href={localizeHref(`/tutorial/${chapter.id}/${example.id}`)}
								class="example-link"
								class:active={currentChapter === chapter.id && currentExample === example.id}
							>
								{example.title}
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
		@apply w-full px-4 py-2 flex items-center gap-2 transition-colors text-sm rounded-md;
		color: var(--color-text);
	}

	.chapter-header:hover {
		background-color: var(--color-elevated);
	}

	.chapter-header.active {
		@apply font-medium;
		color: var(--color-accent);
	}

	.example-list {
		@apply ml-4;
		border-left: 1px solid var(--color-border);
	}

	.example-link {
		@apply block px-4 py-2 ml-2 text-sm transition-colors;
		color: var(--color-muted);
	}

	.example-link:hover {
		color: var(--color-accent);
	}

	.example-link.active {
		@apply font-medium -ml-px;
		color: var(--color-accent);
		border-left: 2px solid var(--color-accent);
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
	}
</style>