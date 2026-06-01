<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import WebGPUCanvas from '$lib/components/WebGPUCanvas.svelte';
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import ConsoleOutput from '$lib/components/ConsoleOutput.svelte';
	import { consoleMessages } from '$lib/stores/editor';
	import type { WebGPUContext } from '$lib/webgpu/types';
	import { createConsoleBridge, executeUserCode } from '$lib/webgpu/codeRunner';
	import { samples } from '$lib/playground/samples';
	import { m } from '$lib/paraglide/messages';

	// Localized display name for each sample (keys mirror `samples` keys).
	const sampleLabel: Record<string, () => string> = {
		triangle: m.sample_triangle,
		rainbow: m.sample_rainbow,
		animated: m.sample_animated,
		particles: m.sample_particles,
		fractal: m.sample_fractal,
		wave: m.sample_wave,
		'3dcube': m.sample_3dcube,
		compute: m.sample_compute,
		texture: m.sample_texture,
		lighting: m.sample_lighting,
		postprocess: m.sample_postprocess,
		'custom-shader': m.sample_custom_shader
	};
	
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
		consoleMessages.info(m.playground_msg_ready());
	}
	
	// コードを実行
	async function runCode() {
		if (!webgpuContext) {
			consoleMessages.error(m.playground_msg_not_initialized());
			return;
		}
		
		isRunning = true;
		consoleMessages.clear();
		consoleMessages.log(m.playground_msg_running());

		// 先にすべてのアニメーションを停止
		if (activeAnimationIds.size > 0) {
			consoleMessages.log(m.playground_msg_stop_anim({ count: String(activeAnimationIds.size) }));
			activeAnimationIds.forEach(id => cancelAnimationFrame(id));
			activeAnimationIds.clear();
			// アニメーションループが完全に停止するまで待機
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		// 実行前にWebGPUコンテキストをリセット
		if (webgpuCanvasComponent && webgpuCanvasComponent.resetContext) {
			consoleMessages.log(m.playground_msg_reset_ctx());
			try {
				await webgpuCanvasComponent.resetContext();
				await new Promise(resolve => setTimeout(resolve, 50));

				if (!webgpuContext) {
					consoleMessages.error(m.playground_msg_reset_failed());
					isRunning = false;
					return;
				}
			} catch (error) {
				consoleMessages.error(m.playground_msg_reset_error({ error: String(error) }));
				isRunning = false;
				return;
			}
		}
		
		try {
			// カスタムconsoleオブジェクト
			const customConsole = createConsoleBridge(consoleMessages);
			
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
			await executeUserCode(javascriptCode, executionEnv);
			consoleMessages.log(m.playground_msg_run_done());
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : m.playground_msg_unknown_error();
			consoleMessages.error(m.playground_msg_run_error({ error: errorMessage }));
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
	async function loadSample(sampleName: string) {
		if (!sampleName || !samples[sampleName]) return;
		
		// 実行中のアニメーションを停止
		if (activeAnimationIds.size > 0) {
			activeAnimationIds.forEach(id => cancelAnimationFrame(id));
			activeAnimationIds.clear();
		}
		
		const sample = samples[sampleName];
		javascriptCode = sample.javascript;
		
		if (sample.vertexShader) {
			vertexShader = sample.vertexShader;
		}
		
		if (sample.fragmentShader) {
			fragmentShader = sample.fragmentShader;
		}
		
		// キャンバスをクリア
		if (webgpuCanvasComponent && webgpuCanvasComponent.clearCanvas) {
			webgpuCanvasComponent.clearCanvas();
		}
		
		consoleMessages.clear();
		const displayName = sampleLabel[sampleName]?.() ?? sample.name;
		consoleMessages.info(m.playground_msg_sample_loaded({ name: displayName }));
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
	<title>{m.playground_meta_title()}</title>
</svelte:head>

<div class="playground-layout">
	<!-- ヘッダー -->
	<div class="playground-header">
		<div>
			<p class="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)] mb-0.5">Playground</p>
			<h1 class="text-2xl font-bold">{m.playground_title()}</h1>
		</div>
		<div class="flex items-center gap-4">
			<select onchange={(e) => loadSample(e.currentTarget.value)} class="sample-select" aria-label={m.playground_samples_label()}>
				<option value="">{m.playground_select_sample()}</option>
				{#each Object.keys(sampleLabel) as key (key)}
					<option value={key}>{sampleLabel[key]()}</option>
				{/each}
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
					{m.playground_tab_vertex()}
				</button>
				<button
					class="editor-tab"
					class:active={activeTab === 'fragment'}
					onclick={() => activeTab = 'fragment'}
				>
					{m.playground_tab_fragment()}
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
						{m.playground_running()}
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{m.playground_run()}
					{/if}
				</button>
				<button onclick={clearCode} class="btn-secondary">{m.playground_clear()}</button>
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
		@apply px-4 py-2 rounded-lg text-sm transition-colors;
		border: 1px solid var(--color-border-strong);
		background-color: var(--color-surface);
		color: var(--color-text);
	}

	.sample-select:hover {
		border-color: var(--color-accent);
	}

	.playground-main {
		@apply flex-1 flex overflow-hidden;
	}

	.playground-editor {
		@apply flex-1 flex flex-col;
	}

	.editor-tabs {
		@apply flex border-b border-[var(--color-border)] px-4;
		background-color: var(--color-surface);
	}

	.editor-tab {
		@apply px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-colors;
		color: var(--color-muted);
	}

	.editor-tab:hover {
		color: var(--color-text);
	}

	.editor-tab.active {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.editor-container {
		@apply flex-1 overflow-hidden;
	}

	.editor-controls {
		@apply px-4 py-3 border-t border-[var(--color-border)] flex gap-3;
		background-color: var(--color-surface);
	}

	.playground-preview {
		@apply w-[640px] flex flex-col border-l border-[var(--color-border)];
	}

	.preview-canvas {
		@apply flex-1 p-4 flex items-center justify-center;
		background-color: var(--color-surface);
		background-image: radial-gradient(
			color-mix(in srgb, var(--color-muted) 16%, transparent) 1px,
			transparent 1px
		);
		background-size: 20px 20px;
	}
	
	.preview-console {
		@apply h-64 border-t border-[var(--color-border)];
	}
</style>