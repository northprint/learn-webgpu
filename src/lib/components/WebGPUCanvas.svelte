<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import type { WebGPUContext } from '$lib/webgpu/types';
	import { webgpuDeviceManager } from '$lib/webgpu/deviceManager';
	
	interface Props {
		onContextReady?: (context: WebGPUContext) => void;
		width?: number;
		height?: number;
		class?: string;
	}
	
	let { onContextReady, width = 640, height = 480, class: className = '' }: Props = $props();
	
	let canvasElement = $state<HTMLCanvasElement | null>(null);
	let context: WebGPUContext | null = null;
	let error = $state<string | null>(null);
	let isInitializing = $state(true);
	let showCanvas = $state(false);
	
	// キャンバスをクリアする関数をエクスポート
	export function clearCanvas() {
		if (!context || !canvasElement) return;
		
		
		try {
			const { device, context: canvasContext, format } = context;
			
			// デバイスが失われていないかチェック
			if (device.lost) {
				console.warn('[WebGPUCanvas] Device is lost, skipping clear');
				// デバイスが失われた場合はリセットを呼び出す（非同期）
				resetContext().catch(e => console.error('[WebGPUCanvas] Failed to reset context:', e));
				return;
			}
			
			// コマンドエンコーダーを作成
			const encoder = device.createCommandEncoder();
			
			// 現在のテクスチャを取得
			const texture = canvasContext.getCurrentTexture();
			
			// レンダーパスを開始（黒でクリア）
			const pass = encoder.beginRenderPass({
				colorAttachments: [{
					view: texture.createView(),
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
					loadOp: 'clear',
					storeOp: 'store'
				}]
			});
			
			pass.end();
			
			// コマンドをGPUに送信
			device.queue.submit([encoder.finish()]);
		} catch (e) {
			console.error('[WebGPUCanvas] Failed to clear canvas:', e);
		}
	}
	
	// WebGPUコンテキストをリセットする関数
	export async function resetContext() {
		if (!canvasElement) return;
		
		try {
			// deviceManagerを使用してキャンバスをリセット
			await webgpuDeviceManager.resetCanvasContext(canvasElement);
			
			// コンテキストが存在しない場合は初期化
			if (!context) {
				await initializeWebGPU();
			} else {
				// コールバックを再実行
				if (onContextReady) {
					onContextReady(context);
				}
			}
		} catch (e) {
			console.error('[WebGPUCanvas] Failed to reset context:', e);
			// エラーが発生した場合は再初期化
			await initializeWebGPU();
		}
	}
	
	// onMountを使用して初期化
	onMount(async () => {
		
		// まずキャンバスを表示
		showCanvas = true;
		
		// tick()を使ってDOMの更新を待つ
		await tick();
		
		// さらに少し待つ
		await new Promise(resolve => setTimeout(resolve, 50));
		
		if (!canvasElement) {
			console.error('[WebGPUCanvas] Canvas element not found after mount');
			error = 'キャンバス要素が見つかりません';
			isInitializing = false;
			return;
		}
		
		await initializeWebGPU();
	});
	
	onDestroy(() => {
		// クリーンアップ
		if (canvasElement) {
			// deviceManagerを使用してコンテキストを解放
			webgpuDeviceManager.releaseCanvasContext(canvasElement);
		}
		context = null;
		showCanvas = false;
	});
	
	async function initializeWebGPU() {
		if (!canvasElement) {
			console.error('[WebGPUCanvas] Canvas element not available');
			error = 'キャンバス要素が見つかりません';
			isInitializing = false;
			return;
		}
		try {
			// キャンバスサイズ設定
			if (canvasElement) {
				canvasElement.width = width;
				canvasElement.height = height;
				canvasElement.style.width = `${width}px`;
				canvasElement.style.height = `${height}px`;
			}
			
			// deviceManagerを使用してコンテキストを作成
			context = await webgpuDeviceManager.createContext(canvasElement);
			
			// 初期化完了
			isInitializing = false;
			
			// コールバックを実行
			if (onContextReady) {
				onContextReady(context);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'WebGPUの初期化に失敗しました';
			isInitializing = false;
			console.error('[WebGPUCanvas] Initialization failed:', e);
		}
	}
	
	// リサイズハンドラー
	function handleResize() {
		if (!canvasElement || !context) return;
		
		const devicePixelRatio = window.devicePixelRatio || 1;
		if (canvasElement) {
			// 論理サイズを維持
			canvasElement.width = width;
			canvasElement.height = height;
			canvasElement.style.width = `${width}px`;
			canvasElement.style.height = `${height}px`;
		}
		
		// 再設定が必要な場合はコールバックを呼び出す
		if (onContextReady) {
			onContextReady(context);
		}
	}
	
	$effect(() => {
		// width/heightが変更されたらリサイズ
		if (canvasElement && context) {
			handleResize();
		}
	});
</script>

<div class="webgpu-canvas-container {className}">
	{#if error}
		<div class="error-message">
			<svg class="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p class="text-red-600 dark:text-red-400">{error}</p>
			<p class="text-sm text-gray-800 dark:text-gray-400 mt-2">
				WebGPU対応ブラウザ（Chrome 113+、Edge 113+）をご利用ください
			</p>
		</div>
	{:else}
		{#if isInitializing}
			<div class="loading-message">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gpu-blue"></div>
				<p class="mt-4 text-gray-800 dark:text-gray-400">WebGPUを初期化中...</p>
			</div>
		{/if}
		{#if showCanvas}
			<canvas
				bind:this={canvasElement}
				width={width}
				height={height}
				class="border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
				style="width: {width}px; height: {height}px; max-width: 100%; max-height: 100%; {isInitializing ? 'display: none;' : ''}"
			></canvas>
		{/if}
	{/if}
</div>

<style>
	.webgpu-canvas-container {
		position: relative;
		display: inline-block;
		max-width: 100%;
		max-height: 100%;
	}
	
	.error-message,
	.loading-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		@apply bg-gray-50 dark:bg-gray-900;
		border-radius: 0.5rem;
		min-height: 300px;
	}
</style>