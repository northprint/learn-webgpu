<script lang="ts">
	import { progress, completionRate } from '$lib/stores/progress';
	import { m } from '$lib/paraglide/messages';

	let showResetConfirm = false;

	function handleReset() {
		progress.reset();
		showResetConfirm = false;
		alert(m.settings_progress_reset_done());
	}
</script>

<svelte:head>
	<title>{m.settings_meta_title()}</title>
</svelte:head>

<div class="container mx-auto px-6 py-8 max-w-4xl">
	<div class="mb-8">
		<p class="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)] mb-2">Settings</p>
		<h1 class="text-3xl font-bold">{m.settings_title()}</h1>
	</div>

	<section class="card mb-8">
		<h2 class="text-xl font-semibold mb-4">{m.settings_progress_section()}</h2>

		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium">{m.settings_progress_current()}</span>
				<span class="text-sm text-[var(--color-muted)] tabular-nums">
					{m.settings_progress_summary({
						completed: String($completionRate.completed),
						total: String($completionRate.total),
						percentage: String($completionRate.percentage)
					})}
				</span>
			</div>
			<div class="w-full bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-full h-2 overflow-hidden">
				<div
					class="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[#22D3EE] transition-all duration-500"
					style="width: {$completionRate.percentage}%"
				></div>
			</div>
		</div>

		<div class="p-4 rounded-lg mb-4 border" style="background-color: color-mix(in srgb, #f59e0b 12%, transparent); border-color: color-mix(in srgb, #f59e0b 22%, transparent);">
			<p class="text-sm text-[var(--color-text)]">
				{m.settings_progress_storage_note()}
			</p>
		</div>

		{#if !showResetConfirm}
			<button
				onclick={() => showResetConfirm = true}
				class="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition"
			>
				{m.settings_progress_reset()}
			</button>
		{:else}
			<div class="flex items-center gap-4 flex-wrap">
				<p class="text-sm text-red-500">
					{m.settings_progress_reset_confirm()}
				</p>
				<button
					onclick={handleReset}
					class="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition"
				>
					{m.settings_progress_reset_now()}
				</button>
				<button
					onclick={() => showResetConfirm = false}
					class="btn-secondary"
				>
					{m.settings_progress_cancel()}
				</button>
			</div>
		{/if}
	</section>

	<section class="card">
		<h2 class="text-xl font-semibold mb-4">{m.settings_data_section()}</h2>
		<div class="space-y-2 text-sm text-[var(--color-muted)]">
			<p>{m.settings_data_intro()}</p>
			<ul class="list-disc list-inside ml-4 space-y-1">
				<li>{m.settings_data_item_completed()}</li>
				<li>{m.settings_data_item_steps()}</li>
				<li>{m.settings_data_item_last()}</li>
				<li>{m.settings_data_item_theme()}</li>
			</ul>
			<p class="mt-4">
				{m.settings_data_privacy()}
			</p>
		</div>
	</section>
</div>
