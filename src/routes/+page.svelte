<script lang="ts">
	import { onMount } from 'svelte';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	
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

		// WebGPUサポートチェック
		try {
			if (!('gpu' in navigator)) {
				errorMessage = m.home_err_no_api();
				webgpuSupported = false;
			} else {
				const adapter = await navigator.gpu.requestAdapter();

				if (!adapter) {
					errorMessage = m.home_err_no_adapter();
					webgpuSupported = false;
				} else {
					// デバイスの取得も試みる
					try {
						const device = await adapter.requestDevice();

						// 成功！
						webgpuSupported = true;
						device.destroy();
					} catch (deviceError) {
						errorMessage = m.home_err_device();
						webgpuSupported = false;
					}
				}
			}
		} catch (e) {
			errorMessage = m.home_err_generic();
			webgpuSupported = false;
		} finally {
			checkingSupport = false;
		}
	});
</script>

<svelte:head>
	<title>{m.home_meta_title()}</title>
	<meta name="description" content={m.home_meta_description()} />
</svelte:head>

<div class="relative min-h-screen">
	<!-- ヒーロー背景（ドットグリッド + アクセントグロー） -->
	<HeroBackground />

	<!-- WebGPU パーティクル（群れ）: ヒーロー上部のみ・下端フェード -->
	{#if webgpuSupported && !checkingSupport}
		<div
			class="pointer-events-none absolute inset-x-0 top-0 h-screen z-0 overflow-hidden
				[mask-image:linear-gradient(to_bottom,#000_50%,transparent_92%)]
				[-webkit-mask-image:linear-gradient(to_bottom,#000_50%,transparent_92%)]"
		>
			<ParticleField />
		</div>
	{/if}

	<div class="container mx-auto px-4 py-20 relative z-10">
	<!-- ヒーローセクション -->
	<section class="text-center mb-20">
		<div class="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-sm text-xs font-medium text-[var(--color-muted)]">
			<span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
			WebGPU · WGSL · Compute
		</div>
		<h1 class="text-5xl sm:text-6xl font-bold mb-6 leading-[1.1]">
			<span class="brand-gradient">{m.home_hero_title()}</span>
		</h1>
		<p class="text-lg sm:text-xl text-[var(--color-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
			{m.home_hero_subtitle()}
		</p>
		
		{#if checkingSupport}
			<div class="flex justify-center">
				<div class="animate-spin h-8 w-8 border-4 border-gpu-blue border-t-transparent rounded-full"></div>
			</div>
		{:else if webgpuSupported}
			<div class="flex gap-4 justify-center">
				<a href={localizeHref('/tutorial')} class="btn-primary">
					{m.home_cta_start_tutorial()}
				</a>
				<a href={localizeHref('/playground')} class="btn-secondary">
					{m.home_cta_try_playground()}
				</a>
			</div>
		{:else}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6 max-w-2xl mx-auto">
				<h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
					{m.home_unsupported_title()}
				</h3>

				<div class="space-y-3 text-sm">
					<div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
						<p class="font-medium text-red-700 dark:text-red-300 mb-1">{m.home_unsupported_browser_label()}</p>
						<p class="text-gray-700 dark:text-gray-300">
							{m.home_unsupported_browser_version_template({ name: browserInfo.browserName, version: browserInfo.browserVersion })}
						</p>
					</div>

					{#if errorMessage}
						<div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
							<p class="font-medium text-red-700 dark:text-red-300 mb-1">{m.home_unsupported_error_label()}</p>
							<p class="text-gray-700 dark:text-gray-300">{errorMessage}</p>
						</div>
					{/if}

					<div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
						<p class="font-medium text-red-700 dark:text-red-300 mb-2">{m.home_unsupported_solution_label()}</p>
						<ul class="space-y-2 text-gray-700 dark:text-gray-300">
							{#if browserInfo.isChrome && browserInfo.chromeVersion < 113}
								<li class="flex items-start gap-2">
									<span class="text-red-500">•</span>
									<span>{m.home_unsupported_chrome_old({ version: String(browserInfo.chromeVersion) })}</span>
								</li>
							{:else if browserInfo.isChrome && browserInfo.chromeVersion >= 113}
								<li class="flex items-start gap-2">
									<span class="text-yellow-500">•</span>
									<span>{m.home_unsupported_chrome_recent({ version: String(browserInfo.chromeVersion) })}</span>
								</li>
								<li class="ml-6">
									• {m.home_unsupported_chrome_check_gpu()}
								</li>
								<li class="ml-6">
									• {@html m.home_unsupported_chrome_gpu_page()}
								</li>
								<li class="ml-6">
									• {m.home_unsupported_chrome_driver()}
								</li>
							{/if}
							<li class="flex items-start gap-2">
								<span class="text-green-500">•</span>
								<span>{m.home_unsupported_env_intro()}</span>
							</li>
							<li class="ml-6">• {m.home_unsupported_env_os()}</li>
							<li class="ml-6">• {m.home_unsupported_env_gpu()}</li>
							<li class="ml-6">• {m.home_unsupported_env_driver()}</li>
							{#if navigator.userAgent.includes('Linux')}
								<li class="flex items-start gap-2 mt-3">
									<span class="text-orange-500">•</span>
									<span>{m.home_unsupported_linux_note()}</span>
								</li>
							{/if}
						</ul>
					</div>

					{#if navigator.platform.includes('Linux')}
						<div class="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
							<p class="font-medium text-blue-700 dark:text-blue-300 mb-2">{m.home_unsupported_linux_title()}</p>
							<ul class="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
								<li>• {m.home_unsupported_linux_driver()}</li>
								<li>• {m.home_unsupported_linux_accel()}</li>
								<li>• {@html m.home_unsupported_linux_gpu_page()}</li>
							</ul>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</section>
	
	<!-- 特徴セクション -->
	<section class="grid md:grid-cols-3 gap-6 mb-20">
		<div class="card card-interactive">
			<div class="w-11 h-11 bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/20 rounded-lg flex items-center justify-center mb-4 text-[var(--color-accent)]">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold mb-2">{m.home_features_stepwise_title()}</h3>
			<p class="text-sm text-[var(--color-muted)] leading-relaxed">
				{m.home_features_stepwise_body()}
			</p>
		</div>

		<div class="card card-interactive">
			<div class="w-11 h-11 bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/20 rounded-lg flex items-center justify-center mb-4 text-[var(--color-accent)]">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold mb-2">{m.home_features_interactive_title()}</h3>
			<p class="text-sm text-[var(--color-muted)] leading-relaxed">
				{m.home_features_interactive_body()}
			</p>
		</div>

		<div class="card card-interactive">
			<div class="w-11 h-11 bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/20 rounded-lg flex items-center justify-center mb-4 text-[var(--color-accent)]">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold mb-2">{m.home_features_practical_title()}</h3>
			<p class="text-sm text-[var(--color-muted)] leading-relaxed">
				{m.home_features_practical_body()}
			</p>
		</div>
	</section>
	
	<!-- カリキュラムセクション -->
	<section class="mb-20">
		<h2 class="text-2xl sm:text-3xl font-bold mb-10 text-center">{m.home_curriculum_title()}</h2>

		<div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
			<div class="card">
				<h3 class="text-sm font-semibold mb-4 inline-flex items-center gap-2 text-[var(--color-accent)]">
					<span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
					{m.home_curriculum_basics_title()}
				</h3>
				<ul class="space-y-2.5 text-sm text-[var(--color-muted)]">
					<li class="flex items-start gap-2.5"><span class="text-[var(--color-accent)] mt-0.5">✓</span><span>{m.home_curriculum_basics_1()}</span></li>
					<li class="flex items-start gap-2.5"><span class="text-[var(--color-accent)] mt-0.5">✓</span><span>{m.home_curriculum_basics_2()}</span></li>
					<li class="flex items-start gap-2.5"><span class="text-[var(--color-accent)] mt-0.5">✓</span><span>{m.home_curriculum_basics_3()}</span></li>
					<li class="flex items-start gap-2.5"><span class="text-[var(--color-accent)] mt-0.5">✓</span><span>{m.home_curriculum_basics_4()}</span></li>
				</ul>
			</div>

			<div class="card">
				<h3 class="text-sm font-semibold mb-4 inline-flex items-center gap-2 text-gpu-purple">
					<span class="w-1.5 h-1.5 rounded-full bg-gpu-purple"></span>
					{m.home_curriculum_advanced_title()}
				</h3>
				<ul class="space-y-2.5 text-sm text-[var(--color-muted)]">
					<li class="flex items-start gap-2.5"><span class="text-gpu-purple mt-0.5">✓</span><span>{m.home_curriculum_advanced_1()}</span></li>
					<li class="flex items-start gap-2.5"><span class="text-gpu-purple mt-0.5">✓</span><span>{m.home_curriculum_advanced_2()}</span></li>
					<li class="flex items-start gap-2.5"><span class="text-gpu-purple mt-0.5">✓</span><span>{m.home_curriculum_advanced_3()}</span></li>
					<li class="flex items-start gap-2.5"><span class="text-gpu-purple mt-0.5">✓</span><span>{m.home_curriculum_advanced_4()}</span></li>
				</ul>
			</div>
		</div>
	</section>

	<!-- CTAセクション -->
	<section class="relative text-center py-16 px-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
		<div class="absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-accent)_30%,transparent),transparent_70%)] pointer-events-none"></div>
		<div class="relative">
			<h2 class="text-2xl sm:text-3xl font-bold mb-4">{m.home_cta_ready_title()}</h2>
			<p class="text-base sm:text-lg text-[var(--color-muted)] mb-8 max-w-xl mx-auto">
				{m.home_cta_ready_subtitle()}
			</p>
			<a href={localizeHref('/tutorial')} class="btn-primary text-base px-7 py-3">
				{m.home_cta_ready_button()}
			</a>
		</div>
	</section>
</div>
</div>