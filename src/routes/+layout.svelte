<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	
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
					WebGPU Learn
				</span>
			</a>
			
			<nav class="flex items-center gap-6">
				<a href="/tutorial" class="hover:text-gpu-blue transition-colors">
					チュートリアル
				</a>
				<a href="/playground" class="hover:text-gpu-blue transition-colors">
					プレイグラウンド
				</a>
				<a href="/reference" class="hover:text-gpu-blue transition-colors">
					リファレンス
				</a>
				
				<button
					onclick={toggleDarkMode}
					class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					aria-label="ダークモード切り替え"
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
			</nav>
		</div>
	</header>
	
	<main class="flex-1">
		<slot />
	</main>
	
	<footer class="border-t border-[var(--color-border)] py-8 mt-16">
		<div class="container mx-auto px-4 text-center text-sm text-gray-900 dark:text-gray-400 font-medium">
			<p>WebGPU Learn - WebGPUを学ぶためのインタラクティブチュートリアル</p>
			<p class="mt-2">
				<a href="https://github.com/yourusername/learn-webgpu" class="hover:text-gpu-blue transition-colors">
					GitHub
				</a>
			</p>
		</div>
	</footer>
</div>