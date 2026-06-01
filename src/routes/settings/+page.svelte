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
	<h1 class="text-3xl font-bold mb-8">{m.settings_title()}</h1>

	<section class="card mb-8">
		<h2 class="text-xl font-semibold mb-4">{m.settings_progress_section()}</h2>

		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium">{m.settings_progress_current()}</span>
				<span class="text-sm text-gray-600 dark:text-gray-400">
					{m.settings_progress_summary({
						completed: String($completionRate.completed),
						total: String($completionRate.total),
						percentage: String($completionRate.percentage)
					})}
				</span>
			</div>
			<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
				<div
					class="bg-gpu-blue h-2 rounded-full transition-all duration-300"
					style="width: {$completionRate.percentage}%"
				></div>
			</div>
		</div>

		<div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
			<p class="text-sm text-yellow-800 dark:text-yellow-200">
				{m.settings_progress_storage_note()}
			</p>
		</div>

		{#if !showResetConfirm}
			<button
				onclick={() => showResetConfirm = true}
				class="btn bg-red-500 text-white hover:bg-red-600"
			>
				{m.settings_progress_reset()}
			</button>
		{:else}
			<div class="flex items-center gap-4">
				<p class="text-sm text-red-600 dark:text-red-400">
					{m.settings_progress_reset_confirm()}
				</p>
				<button
					onclick={handleReset}
					class="btn bg-red-500 text-white hover:bg-red-600"
				>
					{m.settings_progress_reset_now()}
				</button>
				<button
					onclick={() => showResetConfirm = false}
					class="btn bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
				>
					{m.settings_progress_cancel()}
				</button>
			</div>
		{/if}
	</section>

	<section class="card">
		<h2 class="text-xl font-semibold mb-4">{m.settings_data_section()}</h2>
		<div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
