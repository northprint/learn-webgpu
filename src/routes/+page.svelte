<script lang="ts">
	import { onMount } from 'svelte';
	import BackgroundAnimation from '$lib/components/BackgroundAnimation.svelte';
	
	let webgpuSupported = $state(false);
	let checkingSupport = $state(true);
	
	onMount(async () => {
		// WebGPUサポートチェック
		console.log('[HomePage] Checking WebGPU support...');
		console.log('[HomePage] navigator.gpu:', 'gpu' in navigator);
		
		try {
			if ('gpu' in navigator) {
				console.log('[HomePage] Requesting adapter...');
				const adapter = await navigator.gpu.requestAdapter();
				console.log('[HomePage] Adapter:', adapter);
				
				if (adapter) {
					// デバイスの取得も試みる
					console.log('[HomePage] Requesting device...');
					const device = await adapter.requestDevice();
					console.log('[HomePage] Device:', device);
					
					// 成功！
					webgpuSupported = true;
					device.destroy();
				} else {
					console.log('[HomePage] No adapter available');
					webgpuSupported = false;
				}
			} else {
				console.log('[HomePage] WebGPU API not available');
				webgpuSupported = false;
			}
		} catch (e) {
			console.error('[HomePage] WebGPU check failed:', e);
			webgpuSupported = false;
		} finally {
			checkingSupport = false;
			console.log('[HomePage] WebGPU supported:', webgpuSupported);
		}
	});
</script>

<svelte:head>
	<title>WebGPU Learn - WebGPUを学ぶためのインタラクティブチュートリアル</title>
	<meta name="description" content="WebGPUの基礎から応用まで、実際にコードを書きながら学べるインタラクティブなチュートリアル" />
</svelte:head>

<div class="relative min-h-screen">
	<!-- 背景アニメーション -->
	{#if webgpuSupported && !checkingSupport}
		<BackgroundAnimation />
	{/if}
	
	<div class="container mx-auto px-4 py-12 relative z-10">
	<!-- ヒーローセクション -->
	<section class="text-center mb-16">
		<h1 class="text-5xl font-bold mb-6 bg-gradient-to-r from-gpu-blue via-gpu-purple to-gpu-pink bg-clip-text text-transparent">
			WebGPUを学ぼう
		</h1>
		<p class="text-xl text-gray-900 dark:text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
			次世代のWeb グラフィックスAPI、WebGPUを実際にコードを書きながら学べるインタラクティブなチュートリアルです。
		</p>
		
		{#if checkingSupport}
			<div class="flex justify-center">
				<div class="animate-spin h-8 w-8 border-4 border-gpu-blue border-t-transparent rounded-full"></div>
			</div>
		{:else if webgpuSupported}
			<div class="flex gap-4 justify-center">
				<a href="/tutorial" class="btn-primary">
					チュートリアルを始める
				</a>
				<a href="/playground" class="btn-secondary">
					プレイグラウンドで試す
				</a>
			</div>
		{:else}
			<div class="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 max-w-md mx-auto">
				<p class="text-sm text-yellow-800 dark:text-yellow-200">
					お使いのブラウザはWebGPUをサポートしていません。
					Chrome 113+、Edge 113+、またはChrome Canaryをご利用ください。
				</p>
			</div>
		{/if}
	</section>
	
	<!-- 特徴セクション -->
	<section class="grid md:grid-cols-3 gap-8 mb-16">
		<div class="card">
			<div class="w-12 h-12 bg-gpu-blue/10 rounded-lg flex items-center justify-center mb-4">
				<svg class="w-6 h-6 text-gpu-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">段階的な学習</h3>
			<p class="text-gray-800 dark:text-gray-300">
				基礎から応用まで、段階的に学べるように構成されたチュートリアル
			</p>
		</div>
		
		<div class="card">
			<div class="w-12 h-12 bg-gpu-purple/10 rounded-lg flex items-center justify-center mb-4">
				<svg class="w-6 h-6 text-gpu-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">インタラクティブ</h3>
			<p class="text-gray-800 dark:text-gray-300">
				ブラウザ上でコードを編集し、リアルタイムで結果を確認
			</p>
		</div>
		
		<div class="card">
			<div class="w-12 h-12 bg-gpu-pink/10 rounded-lg flex items-center justify-center mb-4">
				<svg class="w-6 h-6 text-gpu-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">実践的な内容</h3>
			<p class="text-gray-800 dark:text-gray-300">
				実際のプロジェクトで使える実践的なテクニックを学習
			</p>
		</div>
	</section>
	
	<!-- カリキュラムセクション -->
	<section class="mb-16">
		<h2 class="text-3xl font-bold mb-8 text-center">学習内容</h2>
		
		<div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
			<div class="card">
				<h3 class="text-lg font-semibold mb-3 text-gpu-blue">基礎編</h3>
				<ul class="space-y-2 text-sm">
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>WebGPUの基本概念とセットアップ</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>最初の三角形を描画</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>シェーダー言語WGSL入門</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>バッファとデータ転送</span>
					</li>
				</ul>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold mb-3 text-gpu-purple">応用編</h3>
				<ul class="space-y-2 text-sm">
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>3D変換と行列計算</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>テクスチャマッピング</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>ライティングとシェーディング</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 mt-0.5">✓</span>
						<span>パフォーマンス最適化</span>
					</li>
				</ul>
			</div>
		</div>
	</section>
	
	<!-- CTAセクション -->
	<section class="text-center py-12 bg-gradient-to-r from-gpu-blue/10 via-gpu-purple/10 to-gpu-pink/10 rounded-2xl">
		<h2 class="text-3xl font-bold mb-4">準備はできましたか？</h2>
		<p class="text-lg text-gray-900 dark:text-gray-300 mb-8 font-medium">
			WebGPUの世界へ飛び込みましょう
		</p>
		<a href="/tutorial" class="btn-primary text-lg px-8 py-3">
			学習を始める →
		</a>
	</section>
</div>
</div>