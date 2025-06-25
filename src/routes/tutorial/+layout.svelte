<script lang="ts">
	import TutorialNav from '$lib/components/TutorialNav.svelte';
	import { page } from '$app/stores';
	
	// 現在のチャプターと例題を取得
	$: pathSegments = $page.url.pathname.split('/').filter(Boolean);
	$: currentChapter = pathSegments[1] || undefined;
	$: currentExample = pathSegments[2] || undefined;
</script>

<div class="tutorial-layout">
	<aside class="tutorial-sidebar">
		<TutorialNav {currentChapter} {currentExample} />
	</aside>
	
	<main class="tutorial-content">
		<slot />
	</main>
</div>

<style>
	.tutorial-layout {
		@apply flex h-[calc(100vh-theme(spacing.16))];
	}
	
	.tutorial-sidebar {
		@apply w-64 border-r border-[var(--color-border)] overflow-y-auto flex flex-col;
		background-color: rgb(249 250 251);
	}
	
	:global(.dark) .tutorial-sidebar {
		background-color: rgb(17 24 39 / 0.5);
	}
	
	.tutorial-content {
		@apply flex-1 overflow-auto;
		background-color: rgb(255 255 255);
	}
	
	:global(.dark) .tutorial-content {
		background-color: rgb(17 24 39);
	}
	
	/* レスポンシブ対応 */
	@media (max-width: 768px) {
		.tutorial-layout {
			@apply flex-col;
		}
		
		.tutorial-sidebar {
			@apply w-full h-auto max-h-48 border-r-0 border-b overflow-y-auto;
		}
	}
</style>