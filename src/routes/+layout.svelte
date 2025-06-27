<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { initI18n, getInitialLocale } from '$lib/i18n';
	import { currentLocale } from '$lib/stores/locale';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	
	// i18nを初期化
	initI18n();
	
	// 初期言語を設定
	const initialLocale = getInitialLocale();
	locale.set(initialLocale);
	currentLocale.set(initialLocale);
	
	// SSRセーフな初期値設定
	let darkMode = $state(typeof window !== 'undefined' ? 
		(localStorage.getItem('darkMode') === 'true' || 
		window.matchMedia('(prefers-color-scheme: dark)').matches) : true);
	
	onMount(() => {
		// クライアントサイドでの初期設定
		const stored = localStorage.getItem('darkMode');
		if (stored !== null) {
			darkMode = stored === 'true';
		} else {
			darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		updateTheme();
	});
	
	function toggleDarkMode() {
		darkMode = !darkMode;
		localStorage.setItem('darkMode', String(darkMode));
		updateTheme();
	}
	
	function updateTheme() {
		if (typeof document !== 'undefined') {
			if (darkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}
	
	// 初期レンダリング時にもテーマを適用
	$effect(() => {
		updateTheme();
	});
</script>

<div class="min-h-screen flex flex-col">
	<header class="border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg)] z-50">
		<div class="container mx-auto px-4 py-4 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2">
				<span class="text-2xl font-bold bg-gradient-to-r from-gpu-blue via-gpu-purple to-gpu-pink bg-clip-text text-transparent">
					Learn WebGPU
				</span>
			</a>
			
			<nav class="flex items-center gap-6">
				<a href="/tutorial" class="hover:text-gpu-blue transition-colors">
					{$_('nav.tutorial')}
				</a>
				<a href="/playground" class="hover:text-gpu-blue transition-colors">
					{$_('nav.playground')}
				</a>
				<a href="/reference" class="hover:text-gpu-blue transition-colors">
					{$_('nav.reference')}
				</a>
				
				<div class="flex items-center gap-2">
					<LanguageSelector />
					
					<a 
						href="https://github.com/northprint/learn-webgpu" 
						target="_blank"
						rel="noopener noreferrer"
						class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
						aria-label="GitHub"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
					</a>
					
					<a href="/settings" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={$_('nav.settings')}>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</a>
					
					<button
						onclick={toggleDarkMode}
						class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						aria-label={darkMode ? $_('theme.light') : $_('theme.dark')}
					>
					{#if darkMode}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
						</svg>
					{/if}
				</button>
				</div>
			</nav>
		</div>
	</header>
	
	<main class="flex-1">
		<slot />
	</main>
	
	<footer class="border-t border-[var(--color-border)] py-8 mt-16">
		<div class="container mx-auto px-4 text-center text-sm text-gray-900 dark:text-gray-400 font-medium">
			<p>{$_('app.title')} - {$_('app.description')}</p>
			<p class="mt-2">
				<a href="https://github.com/northprint/learn-webgpu" target="_blank" rel="noopener noreferrer" class="hover:text-gpu-blue transition-colors">
					{$_('footer.github')}
				</a>
			</p>
		</div>
	</footer>
</div>