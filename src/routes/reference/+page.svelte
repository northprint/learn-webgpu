<script lang="ts">
	// WebGPUリファレンス
</script>

<svelte:head>
	<title>リファレンス - Learn WebGPU</title>
</svelte:head>

<div class="container mx-auto px-6 py-8 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">WebGPUリファレンス</h1>
	
	<div class="prose dark:prose-invert max-w-none">
		<section class="mb-12">
			<h2 class="text-2xl font-semibold mb-4">基本概念</h2>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">GPUAdapter</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-3">
					物理的なGPUデバイスへのアクセスを提供するオブジェクト。
				</p>
				<div class="code-block">
					<pre><code>{`const adapter = await navigator.gpu.requestAdapter();`}</code></pre>
				</div>
			</div>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">GPUDevice</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-3">
					GPUリソースの作成とコマンドの実行に使用される論理デバイス。
				</p>
				<div class="code-block">
					<pre><code>{`const device = await adapter.requestDevice();`}</code></pre>
				</div>
			</div>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">GPUCommandEncoder</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-3">
					GPUコマンドをエンコードしてコマンドバッファを作成。
				</p>
				<div class="code-block">
					<pre><code>{`const encoder = device.createCommandEncoder();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);`}</code></pre>
				</div>
			</div>
		</section>
		
		<section class="mb-12">
			<h2 class="text-2xl font-semibold mb-4">シェーダー（WGSL）</h2>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">基本構造</h3>
				<div class="code-block">
					<pre><code>{`// 頂点シェーダー
@vertex
fn vs_main(@location(0) position: vec3f) -> @builtin(position) vec4f {
  return vec4f(position, 1.0);
}

// フラグメントシェーダー
@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0); // 赤色
}`}</code></pre>
				</div>
			</div>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">データ型</h3>
				<ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
					<li><code>f32</code> - 32ビット浮動小数点数</li>
					<li><code>i32</code> - 32ビット符号付き整数</li>
					<li><code>u32</code> - 32ビット符号なし整数</li>
					<li><code>bool</code> - 真偽値</li>
					<li><code>vec2f</code>, <code>vec3f</code>, <code>vec4f</code> - ベクトル型</li>
					<li><code>mat4x4f</code> - 4x4行列</li>
				</ul>
			</div>
		</section>
		
		<section class="mb-12">
			<h2 class="text-2xl font-semibold mb-4">パイプライン</h2>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">レンダーパイプライン</h3>
				<div class="code-block">
					<pre><code>{`const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
    buffers: [{
      arrayStride: 12, // 3 * 4 bytes
      attributes: [{
        format: 'float32x3',
        offset: 0,
        shaderLocation: 0
      }]
    }]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{
      format: canvasFormat
    }]
  },
  primitive: {
    topology: 'triangle-list'
  }
});`}</code></pre>
				</div>
			</div>
		</section>
		
		<section class="mb-12">
			<h2 class="text-2xl font-semibold mb-4">リソース管理</h2>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">バッファ</h3>
				<div class="code-block">
					<pre><code>{`// バッファの作成
const buffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});

// データの書き込み
device.queue.writeBuffer(buffer, 0, vertices);`}</code></pre>
				</div>
			</div>
			
			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">テクスチャ</h3>
				<div class="code-block">
					<pre><code>{`const texture = device.createTexture({
  size: { width: 256, height: 256 },
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | 
         GPUTextureUsage.COPY_DST
});`}</code></pre>
				</div>
			</div>
		</section>
		
		<section>
			<h2 class="text-2xl font-semibold mb-4">役立つリンク</h2>
			<ul class="space-y-2">
				<li>
					<a href="https://www.w3.org/TR/webgpu/" target="_blank" rel="noopener noreferrer" class="text-gpu-blue hover:underline">
						WebGPU仕様書 →
					</a>
				</li>
				<li>
					<a href="https://www.w3.org/TR/WGSL/" target="_blank" rel="noopener noreferrer" class="text-gpu-blue hover:underline">
						WGSL仕様書 →
					</a>
				</li>
				<li>
					<a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API" target="_blank" rel="noopener noreferrer" class="text-gpu-blue hover:underline">
						MDN WebGPUドキュメント →
					</a>
				</li>
			</ul>
		</section>
	</div>
</div>