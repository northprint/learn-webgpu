<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { currentLocale } from '$lib/stores/locale';
	import BackgroundAnimation from '$lib/components/BackgroundAnimation.svelte';
	
	let webgpuSupported = $state(false);
	let checkingSupport = $state(true);
	let browserInfo = $state<{
		browserName: string;
		browserVersion: string;
		isChrome: boolean;
		chromeVersion: number;
	}>({ browserName: '', browserVersion: '', isChrome: false, chromeVersion: 0 });
	let errorMessage = $state<string>('');
	
	// ブラウザ情報を取得
	function getBrowserInfo() {
		const userAgent = navigator.userAgent;
		let browserName = 'Unknown';
		let browserVersion = 'Unknown';
		let isChrome = false;
		let chromeVersion = 0;
		
		if (userAgent.includes('Chrome')) {
			isChrome = true;
			const match = userAgent.match(/Chrome\/(\d+)\./);
			if (match) {
				chromeVersion = parseInt(match[1]);
				browserVersion = match[1];
			}
			
			if (userAgent.includes('Edg/')) {
				browserName = 'Microsoft Edge';
			} else if (userAgent.includes('OPR/')) {
				browserName = 'Opera';
			} else {
				browserName = 'Google Chrome';
			}
		} else if (userAgent.includes('Firefox')) {
			browserName = 'Mozilla Firefox';
			const match = userAgent.match(/Firefox\/(\d+)\./);
			if (match) {
				browserVersion = match[1];
			}
		} else if (userAgent.includes('Safari')) {
			browserName = 'Safari';
			const match = userAgent.match(/Version\/(\d+)\./);
			if (match) {
				browserVersion = match[1];
			}
		}
		
		return { browserName, browserVersion, isChrome, chromeVersion };
	}
	
	onMount(async () => {
		// ブラウザ情報を取得
		browserInfo = getBrowserInfo();
		console.log('[HomePage] Browser info:', browserInfo);
		
		// WebGPUサポートチェック
		console.log('[HomePage] Checking WebGPU support...');
		console.log('[HomePage] navigator.gpu:', 'gpu' in navigator);
		
		try {
			if (!('gpu' in navigator)) {
				console.log('[HomePage] WebGPU API not available');
				errorMessage = 'WebGPU APIがブラウザで利用できません。';
				webgpuSupported = false;
			} else {
				console.log('[HomePage] Requesting adapter...');
				const adapter = await navigator.gpu.requestAdapter();
				console.log('[HomePage] Adapter:', adapter);
				
				if (!adapter) {
					console.log('[HomePage] No adapter available');
					errorMessage = 'WebGPUアダプターが利用できません。GPUが無効化されているか、ドライバーの更新が必要な可能性があります。';
					webgpuSupported = false;
				} else {
					// デバイスの取得も試みる
					console.log('[HomePage] Requesting device...');
					try {
						const device = await adapter.requestDevice();
						console.log('[HomePage] Device:', device);
						
						// 成功！
						webgpuSupported = true;
						device.destroy();
					} catch (deviceError) {
						console.error('[HomePage] Device request failed:', deviceError);
						errorMessage = 'WebGPUデバイスの初期化に失敗しました。';
						webgpuSupported = false;
					}
				}
			}
		} catch (e) {
			console.error('[HomePage] WebGPU check failed:', e);
			errorMessage = 'WebGPUのチェック中にエラーが発生しました。';
			webgpuSupported = false;
		} finally {
			checkingSupport = false;
			console.log('[HomePage] WebGPU supported:', webgpuSupported);
		}
	});
</script>

<svelte:head>
	<title>{$_('app.title')} - {$_('app.description')}</title>
	<meta name="description" content="{$_('app.description')}" />
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
			{$_('app.title')}
		</h1>
		<p class="text-xl text-gray-900 dark:text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
			{$_('hero.subtitle')}
		</p>
		
		{#if checkingSupport}
			<div class="flex justify-center">
				<div class="animate-spin h-8 w-8 border-4 border-gpu-blue border-t-transparent rounded-full"></div>
			</div>
		{:else if webgpuSupported}
			<div class="flex gap-4 justify-center">
				<a href="/tutorial" class="btn-primary">
					{$_('hero.startTutorial')}
				</a>
				<a href="/playground" class="btn-secondary">
					{$_('hero.tryPlayground')}
				</a>
			</div>
		{:else}

			<div class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6 max-w-2xl mx-auto">
				<h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
					{$_('hero.webgpuNotSupported')}
				</h3>
				
				<div class="space-y-3 text-sm">
					<!-- ブラウザ情報 -->
					<div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
						<p class="font-medium text-red-700 dark:text-red-300 mb-1">{$_('hero.browserInfo')}:</p>
						<p class="text-gray-700 dark:text-gray-300">
							{browserInfo.browserName} {$_('hero.version')} {browserInfo.browserVersion}
						</p>
					</div>
					
					<!-- エラーメッセージ -->
					{#if errorMessage}
						<div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
							<p class="font-medium text-red-700 dark:text-red-300 mb-1">{$_('hero.errorDetails')}:</p>
							<p class="text-gray-700 dark:text-gray-300">{errorMessage}</p>
						</div>
					{/if}
					
					<!-- 推奨事項 -->
					<div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
						<p class="font-medium text-red-700 dark:text-red-300 mb-2">{$_('hero.solutions')}:</p>
						<ul class="space-y-2 text-gray-700 dark:text-gray-300">
							{#if browserInfo.isChrome && browserInfo.chromeVersion < 113}
								<li class="flex items-start gap-2">
									<span class="text-red-500">•</span>
									<span>{$_('hero.chromeOldVersion', { values: { version: browserInfo.chromeVersion } })}</span>
								</li>
							{:else if browserInfo.isChrome && browserInfo.chromeVersion >= 113}
								<li class="flex items-start gap-2">
									<span class="text-yellow-500">•</span>
									<span>{$_('hero.chromeWebGPUCheck', { values: { version: browserInfo.chromeVersion } })}:</span>
								</li>
								<li class="ml-6">
									• {$_('hero.gpuAccelerationCheck')}
								</li>
								<li class="ml-6">
									• <code class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded">chrome://gpu</code> {$_('hero.checkGPUInfo')}
								</li>
								<li class="ml-6">
									• {$_('hero.updateDrivers')}
								</li>
							{/if}
							<li class="flex items-start gap-2">
								<span class="text-green-500">•</span>
								<span>{$_('hero.stableEnvironments')}:</span>
							</li>
							<li class="ml-6">
								• {$_('hero.osRequirement')}
							</li>
							<li class="ml-6">
								• {$_('hero.gpuRequirement')}
							</li>
							<li class="ml-6">
								• {$_('hero.driverRequirement')}
							</li>
							{#if navigator.userAgent.includes('Linux')}
								<li class="flex items-start gap-2 mt-3">
									<span class="text-orange-500">•</span>
									<span>{$_('hero.linuxNote')}</span>
								</li>
							{/if}
						</ul>
					</div>
					
					<!-- LinuxでのGPU確認 -->
					{#if navigator.platform.includes('Linux')}
						<div class="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
							<p class="font-medium text-blue-700 dark:text-blue-300 mb-2">Linux環境の追加確認事項:</p>
							<ul class="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
								<li>• GPUドライバーが正しくインストールされているか確認</li>
								<li>• ハードウェアアクセラレーションが有効になっているか確認</li>
								<li>• <code class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded">chrome://gpu</code> でGPU情報を確認</li>
							</ul>
						</div>
					{/if}
				</div>
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
			<h3 class="text-xl font-semibold mb-2">{$_('features.stepByStep.title')}</h3>
			<p class="text-gray-800 dark:text-gray-300">
				{$_('features.stepByStep.description')}
			</p>
		</div>
		
		<div class="card">
			<div class="w-12 h-12 bg-gpu-purple/10 rounded-lg flex items-center justify-center mb-4">
				<svg class="w-6 h-6 text-gpu-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">{$_('features.interactive.title')}</h3>
			<p class="text-gray-800 dark:text-gray-300">
				{$_('features.interactive.description')}
			</p>
		</div>
		
		<div class="card">
			<div class="w-12 h-12 bg-gpu-pink/10 rounded-lg flex items-center justify-center mb-4">
				<svg class="w-6 h-6 text-gpu-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">{$_('features.practical.title')}</h3>
			<p class="text-gray-800 dark:text-gray-300">
				{$_('features.practical.description')}
			</p>
		</div>
	</section>
	
	<!-- カリキュラムセクション -->
	<section class="mb-16">
		<h2 class="text-3xl font-bold mb-8 text-center">{$_('curriculum.title')}</h2>
		
		<div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
			<div class="card">
				<h3 class="text-lg font-semibold mb-3 text-gpu-blue">{$_('curriculum.basics.title')}</h3>
				<ul class="space-y-2 text-sm">
					{#each $_('curriculum.basics.items') as item}
						<li class="flex items-start gap-2">
							<span class="text-green-500 mt-0.5">✓</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold mb-3 text-gpu-purple">{$_('curriculum.advanced.title')}</h3>
				<ul class="space-y-2 text-sm">
					{#each $_('curriculum.advanced.items') as item}
						<li class="flex items-start gap-2">
							<span class="text-green-500 mt-0.5">✓</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>
	
	<!-- CTAセクション -->
	<section class="text-center py-12 bg-gradient-to-r from-gpu-blue/10 via-gpu-purple/10 to-gpu-pink/10 rounded-2xl">
		<h2 class="text-3xl font-bold mb-4">{$_('cta.title')}</h2>
		<p class="text-lg text-gray-900 dark:text-gray-300 mb-8 font-medium">
			{$_('cta.subtitle')}
		</p>
		<a href="/tutorial" class="btn-primary text-lg px-8 py-3">
			{$_('cta.button')}
		</a>
	</section>
</div>
</div>