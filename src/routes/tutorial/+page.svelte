<script lang="ts">
	import { tutorialChapters } from '$lib/tutorials';
	import { progress, completionRate } from '$lib/stores/progress';
	import { isExampleCompleted } from '$lib/stores/progress';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { Locale } from '$lib/i18n/locales';
</script>

<svelte:head>
	<title>{m.tutorial_list_meta_title()}</title>
</svelte:head>

<div class="tutorial-list-container">
	<div class="mb-8">
		<p class="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)] mb-2">Tutorial</p>
		<h1 class="text-3xl font-bold">{m.tutorial_list_title()}</h1>
	</div>

	<!-- 進捗表示 -->
	<div class="mb-10 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
		<div class="flex items-center justify-between mb-3">
			<span class="text-sm font-medium">{m.tutorial_list_progress_label()}</span>
			<div class="flex items-center gap-4">
				<span class="text-sm text-[var(--color-muted)] tabular-nums">
					{m.tutorial_list_progress_summary({
						completed: String($completionRate.completed),
						total: String($completionRate.total)
					})}
				</span>
				<button
					onclick={() => {
						if (confirm(m.tutorial_list_progress_reset_confirm())) {
							progress.reset();
						}
					}}
					class="text-xs text-[var(--color-muted)] hover:text-red-500 transition-colors"
					title={m.tutorial_list_progress_reset_title()}
				>
					{m.tutorial_list_progress_reset()}
				</button>
			</div>
		</div>
		<div class="w-full bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-full h-2 overflow-hidden">
			<div
				class="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[#22D3EE] transition-all duration-500"
				style="width: {$completionRate.percentage}%"
			></div>
		</div>
	</div>
	
	<!-- チャプター一覧 -->
	<div class="space-y-6">
		{#each tutorialChapters as chapter, chapterIndex}
			<div class="card">
				<div class="flex items-start gap-4">
					<div class="flex-shrink-0 w-11 h-11 bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/20 rounded-lg flex items-center justify-center">
						<span class="text-base font-bold text-[var(--color-accent)] tabular-nums">{chapterIndex + 1}</span>
					</div>

					<div class="flex-1 min-w-0">
						<h2 class="text-lg font-semibold mb-1">{chapter.title}</h2>
						<p class="text-sm text-[var(--color-muted)] mb-4">{chapter.description}</p>

						<div class="space-y-2">
							{#each chapter.examples as example}
								{@const isCompleted = isExampleCompleted(chapter.id, example.id, $progress)}
								<a
									href={localizeHref(`/tutorial/${chapter.id}/${example.id}`)}
									class="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-elevated)] transition-colors group"
								>
									<div class="flex-shrink-0">
										{#if isCompleted}
											<div class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
												<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
											</div>
										{:else}
											<div class="w-6 h-6 border-2 border-[var(--color-border-strong)] rounded-full group-hover:border-[var(--color-accent)] transition-colors"></div>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<h3 class="font-medium group-hover:text-[var(--color-accent)] transition-colors">
											{example.title}
										</h3>
										<p class="text-sm text-[var(--color-muted)]">
											{example.description}
										</p>
									</div>

									<svg class="w-5 h-5 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
		<div class="mt-8 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
			<p class="text-sm text-[var(--color-muted)] mb-2">{m.tutorial_list_last_visited_label()}</p>
			<a
				href={localizeHref($progress.lastVisited)}
				class="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
			>
				{m.tutorial_list_last_visited_link()}
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