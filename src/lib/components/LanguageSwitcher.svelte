<script lang="ts">
	import { page } from '$app/stores';
	import { locales, localeCodes, isLocale, type Locale } from '$lib/i18n/locales';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	const current = $derived(getLocale() as Locale);

	function switchTo(target: Locale) {
		if (!isLocale(target) || target === current) return;
		const path = $page.url.pathname + $page.url.search;
		const localized = localizeHref(path, { locale: target });
		// Full reload so the new locale's compiled messages are picked up everywhere.
		window.location.href = localized;
	}
</script>

<div class="relative">
	<label class="sr-only" for="lang-switcher">{m.language_switcher_label()}</label>
	<select
		id="lang-switcher"
		value={current}
		onchange={(e) => switchTo((e.currentTarget as HTMLSelectElement).value as Locale)}
		class="appearance-none bg-transparent border border-[var(--color-border)] rounded-lg px-3 py-1.5 pr-8 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
		aria-label={m.language_switcher_label()}
	>
		{#each localeCodes as code (code)}
			<option value={code}>{locales[code].label}</option>
		{/each}
	</select>
	<svg
		class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
	</svg>
</div>
