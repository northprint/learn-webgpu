<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import WebGPUCanvas from '$lib/components/WebGPUCanvas.svelte';
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import ConsoleOutput from '$lib/components/ConsoleOutput.svelte';
	import { consoleMessages } from '$lib/stores/editor';
	import type { WebGPUContext } from '$lib/webgpu/types';
	import { samples } from '$lib/playground/samples';
	
	let webgpuContext: WebGPUContext | null = null;
	let webgpuCanvasComponent: WebGPUCanvas | null = null;
	let isRunning = $state(false);
	let activeTab: 'javascript' | 'vertex' | 'fragment' = $state('javascript');
	let activeAnimationIds = new Set<number>();
	
	// デフォルトのプレイグラウンドコード
	let javascriptCode = $state(`// WebGPUプレイグラウンド
// 自由にコードを書いて実験してみましょう！

async function main() {
  // キャンバスとWebGPUの初期化
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({
    device: device,
    format: canvasFormat,
  });
  
  // ここにあなたのコードを書いてください
  console.log('WebGPUプレイグラウンドへようこそ！');
  
  // 例: 背景色をクリア
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.2, g: 0.3, b: 0.5, a: 1.0 },
      loadOp: 'clear',
      storeOp: 'store'
    }]
  });
  pass.end();
  device.queue.submit([encoder.finish()]);
}

main().catch(console.error);`);
	
	let vertexShader = $state(`@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  // 頂点シェーダーコード
  return vec4f(0.0, 0.0, 0.0, 1.0);
}`);
	
	let fragmentShader = $state(`@fragment
fn fs_main() -> @location(0) vec4f {
  // フラグメントシェーダーコード
  return vec4f(1.0, 0.0, 0.0, 1.0);
}`);
	
	// WebGPUコンテキストの準備完了
	function handleContextReady(context: WebGPUContext) {
		webgpuContext = context;
		consoleMessages.info('WebGPUの準備が完了しました');
	}
	
	// コードを実行
	async function runCode() {
		if (!webgpuContext) {
			consoleMessages.error('WebGPUが初期化されていません');
			return;
		}
		
		isRunning = true;
		consoleMessages.clear();
		consoleMessages.log('コードを実行中...');
		
		// 先にすべてのアニメーションを停止
		if (activeAnimationIds.size > 0) {
			consoleMessages.log(`前のアニメーションを停止します... (${activeAnimationIds.size}個)`);
			activeAnimationIds.forEach(id => cancelAnimationFrame(id));
			activeAnimationIds.clear();
			// アニメーションループが完全に停止するまで待機
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		// 実行前にWebGPUコンテキストをリセット
		if (webgpuCanvasComponent && webgpuCanvasComponent.resetContext) {
			consoleMessages.log('WebGPUコンテキストをリセット中...');
			try {
				await webgpuCanvasComponent.resetContext();
				// リセット後、新しいコンテキストが設定されるまで少し待つ
				await new Promise(resolve => setTimeout(resolve, 100));
				
				// コンテキストが正常に再初期化されたか確認
				if (!webgpuContext) {
					consoleMessages.error('WebGPUコンテキストのリセットに失敗しました');
					isRunning = false;
					return;
				}
			} catch (error) {
				consoleMessages.error('WebGPUコンテキストのリセット中にエラーが発生しました: ' + error);
				isRunning = false;
				return;
			}
		}
		
		try {
			// カスタムconsoleオブジェクト
			const customConsole = {
				log: (...args: any[]) => consoleMessages.log(args.join(' ')),
				error: (...args: any[]) => consoleMessages.error(args.join(' ')),
				warn: (...args: any[]) => consoleMessages.warn(args.join(' ')),
				info: (...args: any[]) => consoleMessages.info(args.join(' ')),
			};
			
			// キャンバスのサイズを確認
			if (webgpuContext?.canvas) {
				console.log('[Playground] Canvas size before execution:', 
					webgpuContext.canvas.width, 'x', webgpuContext.canvas.height);
			}
			
			
			// カスタムrequestAnimationFrame
			const customRequestAnimationFrame = (callback: FrameRequestCallback) => {
				const id = requestAnimationFrame((time) => {
					activeAnimationIds.delete(id);
					callback(time);
				});
				activeAnimationIds.add(id);
				return id;
			};
			
			// 実行環境を準備（リセット後の新しいコンテキストを使用）
			const executionEnv = {
				console: customConsole,
				canvas: webgpuContext.canvas,
				navigator,
				document: {
					querySelector: (selector: string) => {
						if (selector === 'canvas') {
							// WebGPUキャンバスのみを返す（Monaco Editorのキャンバスを除外）
							return webgpuContext?.canvas || null;
						}
						return null;
					}
				},
				window: {
					...window,
					vertexShaderCode: vertexShader,
					fragmentShaderCode: fragmentShader,
					// WebGPUコンテキストを直接提供（リセット後の新しいコンテキスト）
					webgpuDevice: webgpuContext.device,
					webgpuContext: webgpuContext.context,
					webgpuFormat: webgpuContext.format
				},
				// requestAnimationFrameをオーバーライド
				requestAnimationFrame: customRequestAnimationFrame,
				cancelAnimationFrame: (id: number) => {
					cancelAnimationFrame(id);
					activeAnimationIds.delete(id);
				}
			};
			
			// 非同期関数として実行
			const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
			const executeCode = new AsyncFunction(
				...Object.keys(executionEnv),
				javascriptCode
			);
			
			await executeCode(...Object.values(executionEnv));
			consoleMessages.log('実行が完了しました');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '不明なエラー';
			consoleMessages.error(`実行エラー: ${errorMessage}`);
		} finally {
			isRunning = false;
		}
	}
	
	// コードをクリア
	function clearCode() {
		javascriptCode = '';
		vertexShader = '';
		fragmentShader = '';
		consoleMessages.clear();
	}
	
	// サンプルコードをロード
	function loadSample(sampleName: string) {
		if (!sampleName || !samples[sampleName]) return;
		
		const sample = samples[sampleName];
		javascriptCode = sample.javascript;
		
		if (sample.vertexShader) {
			vertexShader = sample.vertexShader;
		}
		
		if (sample.fragmentShader) {
			fragmentShader = sample.fragmentShader;
		}
		
		consoleMessages.clear();
		consoleMessages.info(`サンプル「${sample.name}」をロードしました`);
	}
	
	// ページ破棄時のクリーンアップ
	onDestroy(() => {
		// 実行中のアニメーションを停止
		if (activeAnimationIds.size > 0) {
			activeAnimationIds.forEach(id => cancelAnimationFrame(id));
			activeAnimationIds.clear();
		}
		
		// WebGPUコンテキストをクリア
		webgpuContext = null;
		
		// コンソールメッセージをクリア
		consoleMessages.clear();
	});
</script>

<svelte:head>
	<title>プレイグラウンド - Learn WebGPU</title>
</svelte:head>

<div class="playground-layout">
	<!-- ヘッダー -->
	<div class="playground-header">
		<h1 class="text-2xl font-bold">WebGPUプレイグラウンド</h1>
		<div class="flex items-center gap-4">
			<select onchange={(e) => loadSample(e.currentTarget.value)} class="sample-select">
				<option value="">サンプルを選択...</option>
				<option value="triangle">基本的な三角形</option>
				<option value="rainbow">レインボー三角形</option>
				<option value="animated">アニメーション三角形</option>
				<option value="particles">パーティクルシステム</option>
				<option value="fractal">フラクタル（マンデルブロ集合）</option>
				<option value="wave">波のアニメーション</option>
				<option value="3dcube">3D回転キューブ</option>
				<option value="compute">コンピュートシェーダー（Conway's Game of Life）</option>
				<option value="texture">テクスチャマッピング</option>
				<option value="lighting">ライティング（Phongシェーディング）</option>
				<option value="postprocess">ポストプロセッシング（ブルーム効果）</option>
				<option value="custom-shader">カスタムシェーダー（頂点・フラグメントタブ使用）</option>
			</select>
		</div>
	</div>
	
	<!-- メインコンテンツ -->
	<div class="playground-main">
		<!-- 左側: コードエディタ -->
		<div class="playground-editor">
			<!-- タブ -->
			<div class="editor-tabs">
				<button
					class="editor-tab"
					class:active={activeTab === 'javascript'}
					onclick={() => activeTab = 'javascript'}
				>
					JavaScript
				</button>
				<button
					class="editor-tab"
					class:active={activeTab === 'vertex'}
					onclick={() => activeTab = 'vertex'}
				>
					頂点シェーダー
				</button>
				<button
					class="editor-tab"
					class:active={activeTab === 'fragment'}
					onclick={() => activeTab = 'fragment'}
				>
					フラグメントシェーダー
				</button>
			</div>
			
			<!-- エディタ -->
			<div class="editor-container">
				{#if activeTab === 'javascript'}
					<MonacoEditor
						bind:code={javascriptCode}
						language="javascript"
						height="100%"
					/>
				{:else if activeTab === 'vertex'}
					<MonacoEditor
						bind:code={vertexShader}
						language="wgsl"
						height="100%"
					/>
				{:else}
					<MonacoEditor
						bind:code={fragmentShader}
						language="wgsl"
						height="100%"
					/>
				{/if}
			</div>
			
			<!-- コントロール -->
			<div class="editor-controls">
				<button
					onclick={runCode}
					disabled={isRunning}
					class="btn-primary flex items-center gap-2"
				>
					{#if isRunning}
						<div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
						実行中...
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						実行
					{/if}
				</button>
				<button onclick={clearCode} class="btn-secondary">クリア</button>
			</div>
		</div>
		
		<!-- 右側: プレビューとコンソール -->
		<div class="playground-preview">
			<div class="preview-canvas">
				<WebGPUCanvas
					bind:this={webgpuCanvasComponent}
					onContextReady={handleContextReady}
					width={600}
					height={450}
				/>
			</div>
			<div class="preview-console">
				<ConsoleOutput
					messages={$consoleMessages}
					onClear={() => consoleMessages.clear()}
					height="100%"
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.playground-layout {
		@apply h-[calc(100vh-theme(spacing.16))] flex flex-col;
	}
	
	.playground-header {
		@apply px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between;
	}
	
	.sample-select {
		@apply px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg;
		background-color: rgb(255 255 255);
	}
	
	:global(.dark) .sample-select {
		background-color: rgb(31 41 55);
	}
	
	.playground-main {
		@apply flex-1 flex overflow-hidden;
	}
	
	.playground-editor {
		@apply flex-1 flex flex-col;
	}
	
	.editor-tabs {
		@apply flex border-b border-[var(--color-border)] px-4;
	}
	
	.editor-tab {
		@apply px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
	}
	
	.editor-tab.active {
		@apply text-gpu-blue border-gpu-blue;
	}
	
	.editor-container {
		@apply flex-1 overflow-hidden;
	}
	
	.editor-controls {
		@apply px-4 py-3 border-t border-[var(--color-border)] flex gap-3;
	}
	
	.playground-preview {
		@apply w-[640px] flex flex-col border-l border-[var(--color-border)];
	}
	
	.preview-canvas {
		@apply flex-1 p-4 flex items-center justify-center;
		background-color: rgb(249 250 251);
	}
	
	:global(.dark) .preview-canvas {
		background-color: rgb(17 24 39 / 0.5);
	}
	
	.preview-console {
		@apply h-64 border-t border-[var(--color-border)];
	}
</style>