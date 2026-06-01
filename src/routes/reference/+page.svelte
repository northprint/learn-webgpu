<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.reference_meta_title()}</title>
</svelte:head>

<div class="container mx-auto px-6 py-8 max-w-4xl">
	<div class="mb-8">
		<p class="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)] mb-2">Reference</p>
		<h1 class="text-3xl font-bold">{m.reference_title()}</h1>
	</div>

	<div class="prose dark:prose-invert max-w-none">
		<section class="mb-12">
			<h2 class="text-2xl font-semibold mb-4">{m.reference_basics_title()}</h2>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_basics_adapter_title()}</h3>
				<p class="text-[var(--color-muted)] mb-3">
					{m.reference_basics_adapter_body()}
				</p>
				<div class="code-block">
					<pre><code>{`const adapter = await navigator.gpu.requestAdapter();`}</code></pre>
				</div>
			</div>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_basics_device_title()}</h3>
				<p class="text-[var(--color-muted)] mb-3">
					{m.reference_basics_device_body()}
				</p>
				<div class="code-block">
					<pre><code>{`const device = await adapter.requestDevice();`}</code></pre>
				</div>
			</div>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_basics_encoder_title()}</h3>
				<p class="text-[var(--color-muted)] mb-3">
					{m.reference_basics_encoder_body()}
				</p>
				<div class="code-block">
					<pre><code>{`const encoder = device.createCommandEncoder();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);`}</code></pre>
				</div>
			</div>
		</section>

		<section class="mb-12">
			<h2 class="text-2xl font-semibold mb-4">{m.reference_shader_title()}</h2>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_shader_structure_title()}</h3>
				<div class="code-block">
					<pre><code>{`// Vertex shader
@vertex
fn vs_main(@location(0) position: vec3f) -> @builtin(position) vec4f {
  return vec4f(position, 1.0);
}

// Fragment shader
@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}`}</code></pre>
				</div>
			</div>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_shader_types_title()}</h3>
				<ul class="list-disc list-inside space-y-1 text-[var(--color-muted)]">
					<li>{@html m.reference_shader_types_f32()}</li>
					<li>{@html m.reference_shader_types_i32()}</li>
					<li>{@html m.reference_shader_types_u32()}</li>
					<li>{@html m.reference_shader_types_bool()}</li>
					<li>{@html m.reference_shader_types_vec()}</li>
					<li>{@html m.reference_shader_types_mat()}</li>
				</ul>
			</div>
		</section>

		<section class="mb-12">
			<h2 class="text-2xl font-semibold mb-4">{m.reference_pipeline_title()}</h2>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_pipeline_render_title()}</h3>
				<div class="code-block">
					<pre><code>{`const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
    buffers: [{
      arrayStride: 12,
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
			<h2 class="text-2xl font-semibold mb-4">{m.reference_resources_title()}</h2>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_resources_buffer_title()}</h3>
				<div class="code-block">
					<pre><code>{`const buffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});

device.queue.writeBuffer(buffer, 0, vertices);`}</code></pre>
				</div>
			</div>

			<div class="card mb-6">
				<h3 class="text-xl font-semibold mb-2">{m.reference_resources_texture_title()}</h3>
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
			<h2 class="text-2xl font-semibold mb-4">{m.reference_links_title()}</h2>
			<ul class="space-y-2">
				<li>
					<a href="https://www.w3.org/TR/webgpu/" target="_blank" rel="noopener noreferrer" class="text-[var(--color-accent)] hover:underline">
						{m.reference_links_webgpu_spec()}
					</a>
				</li>
				<li>
					<a href="https://www.w3.org/TR/WGSL/" target="_blank" rel="noopener noreferrer" class="text-[var(--color-accent)] hover:underline">
						{m.reference_links_wgsl_spec()}
					</a>
				</li>
				<li>
					<a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API" target="_blank" rel="noopener noreferrer" class="text-[var(--color-accent)] hover:underline">
						{m.reference_links_mdn()}
					</a>
				</li>
			</ul>
		</section>
	</div>
</div>
