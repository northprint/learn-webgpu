<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
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
	let javascriptCode = $state('');
	
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
		consoleMessages.info($_('playground.messages.sampleLoaded', { values: { name: sample.name } }));
	}
	
	// ページ破棄時のクリーンアップ
	onMount(() => {
		// デフォルトコードを設定
		javascriptCode = `// ${$_('playground.title')}
// ${$_('playground.description')}

async function main() {
  // ${$_('playground.code.initCanvas')}
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({
    device: device,
    format: canvasFormat,
  });
  
  // ${$_('playground.code.yourCode')}
  console.log('${$_('playground.code.welcome')}');
  
  // ${$_('playground.code.example')}
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

main().catch(console.error);`;
	});

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
	<title>{$_('nav.playground')} - {$_('app.title')}</title>
</svelte:head>

<div class="playground-layout">
	<!-- ヘッダー -->
	<div class="playground-header">
		<h1 class="text-2xl font-bold">{$_('playground.title')}</h1>
		<div class="flex items-center gap-4">
			<select onchange={(e) => loadSample(e.currentTarget.value)} class="sample-select">
				<option value="">{$_('playground.samples.select')}</option>
				<option value="triangle">{$_('playground.samples.triangle')}</option>
				<option value="rainbow">{$_('playground.samples.rainbow')}</option>
				<option value="animated">{$_('playground.samples.animated')}</option>
				<option value="particles">{$_('playground.samples.particles')}</option>
				<option value="fractal">{$_('playground.samples.fractal')}</option>
				<option value="wave">{$_('playground.samples.wave')}</option>
				<option value="3dcube">{$_('playground.samples.3dcube')}</option>
				<option value="compute">{$_('playground.samples.compute')}</option>
				<option value="texture">{$_('playground.samples.texture')}</option>
				<option value="lighting">{$_('playground.samples.lighting')}</option>
				<option value="postprocess">{$_('playground.samples.postprocess')}</option>
				<option value="custom-shader">{$_('playground.samples.customShader')}</option>
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
					{$_('tutorialDetail.tabs.vertexShader')}
				</button>
				<button
					class="editor-tab"
					class:active={activeTab === 'fragment'}
					onclick={() => activeTab = 'fragment'}
				>
					{$_('tutorialDetail.tabs.fragmentShader')}
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
						{$_('tutorialDetail.status.running')}
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{$_('actions.run')}
					{/if}
				</button>
				<button onclick={clearCode} class="btn-secondary">{$_('playground.actions.clear')}</button>
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