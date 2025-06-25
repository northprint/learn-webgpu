<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	let canvas: HTMLCanvasElement;
	let device: GPUDevice;
	let context: GPUCanvasContext;
	let pipeline: GPURenderPipeline;
	let computePipeline: GPUComputePipeline;
	let animationId: number;
	let startTime = Date.now();
	
	const NUM_BOIDS = 200;
	const WORKGROUP_SIZE = 64;
	
	onMount(async () => {
		if (!navigator.gpu) {
			console.warn('WebGPU not supported');
			return;
		}
		
		try {
			const adapter = await navigator.gpu.requestAdapter();
			if (!adapter) {
				console.warn('No GPU adapter found');
				return;
			}
			
			device = await adapter.requestDevice();
			context = canvas.getContext('webgpu')!;
			
			const format = navigator.gpu.getPreferredCanvasFormat();
			context.configure({
				device,
				format,
				alphaMode: 'premultiplied'
			});
			
			// Boidsのデータ構造（位置、速度、加速度）
			const boidsData = new Float32Array(NUM_BOIDS * 8); // x,y,vx,vy,ax,ay,angle,padding
			for (let i = 0; i < NUM_BOIDS; i++) {
				const offset = i * 8;
				// ランダムな初期位置
				boidsData[offset + 0] = Math.random() * 2 - 1; // x
				boidsData[offset + 1] = Math.random() * 2 - 1; // y
				// ランダムな初期速度
				const angle = Math.random() * Math.PI * 2;
				const speed = 0.001 + Math.random() * 0.002;
				boidsData[offset + 2] = Math.cos(angle) * speed; // vx
				boidsData[offset + 3] = Math.sin(angle) * speed; // vy
				boidsData[offset + 4] = 0; // ax
				boidsData[offset + 5] = 0; // ay
				boidsData[offset + 6] = angle; // angle
				boidsData[offset + 7] = 0; // padding
			}
			
			// バッファの作成
			const boidsBuffer = device.createBuffer({
				size: boidsData.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
			device.queue.writeBuffer(boidsBuffer, 0, boidsData);
			
			// パラメータバッファ
			const paramsData = new Float32Array([
				NUM_BOIDS,    // numBoids
				0.1,          // visualRange
				0.05,         // separationDistance
				0.001,        // maxSpeed
				0.0002,       // separationForce
				0.0001,       // alignmentForce
				0.0001,       // cohesionForce
				0             // padding
			]);
			
			const paramsBuffer = device.createBuffer({
				size: paramsData.byteLength,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
			});
			device.queue.writeBuffer(paramsBuffer, 0, paramsData);
			
			// コンピュートシェーダー（Boidsの動き）
			const computeShaderCode = `
				struct Boid {
					position: vec2f,
					velocity: vec2f,
					acceleration: vec2f,
					angle: f32,
					padding: f32,
				};
				
				struct Params {
					numBoids: f32,
					visualRange: f32,
					separationDistance: f32,
					maxSpeed: f32,
					separationForce: f32,
					alignmentForce: f32,
					cohesionForce: f32,
					padding: f32,
				};
				
				@group(0) @binding(0) var<storage, read_write> boids: array<Boid>;
				@group(0) @binding(1) var<uniform> params: Params;
				
				@compute @workgroup_size(${WORKGROUP_SIZE})
				fn main(@builtin(global_invocation_id) global_id: vec3u) {
					let index = global_id.x;
					if (index >= u32(params.numBoids)) {
						return;
					}
					
					var boid = boids[index];
					var separation = vec2f(0.0);
					var alignment = vec2f(0.0);
					var cohesion = vec2f(0.0);
					var neighborCount = 0.0;
					var separationCount = 0.0;
					
					// 他のBoidsとの相互作用を計算
					for (var i = 0u; i < u32(params.numBoids); i++) {
						if (i == index) {
							continue;
						}
						
						let other = boids[i];
						let diff = boid.position - other.position;
						let dist = length(diff);
						
						// 視界範囲内のBoids
						if (dist < params.visualRange && dist > 0.0) {
							// 分離
							if (dist < params.separationDistance) {
								separation += normalize(diff) / dist;
								separationCount += 1.0;
							}
							
							// 整列と結合
							alignment += other.velocity;
							cohesion += other.position;
							neighborCount += 1.0;
						}
					}
					
					// 力を適用
					boid.acceleration = vec2f(0.0);
					
					// 分離
					if (separationCount > 0.0) {
						separation = separation / separationCount;
						boid.acceleration += separation * params.separationForce;
					}
					
					// 整列
					if (neighborCount > 0.0) {
						alignment = alignment / neighborCount - boid.velocity;
						boid.acceleration += alignment * params.alignmentForce;
						
						// 結合
						cohesion = cohesion / neighborCount - boid.position;
						boid.acceleration += cohesion * params.cohesionForce;
					}
					
					// 境界での反発
					let margin = 0.2;
					if (boid.position.x < -1.0 + margin) {
						boid.acceleration.x += 0.001;
					}
					if (boid.position.x > 1.0 - margin) {
						boid.acceleration.x -= 0.001;
					}
					if (boid.position.y < -1.0 + margin) {
						boid.acceleration.y += 0.001;
					}
					if (boid.position.y > 1.0 - margin) {
						boid.acceleration.y -= 0.001;
					}
					
					// 速度と位置を更新
					boid.velocity += boid.acceleration;
					
					// 速度制限
					let speed = length(boid.velocity);
					if (speed > params.maxSpeed) {
						boid.velocity = normalize(boid.velocity) * params.maxSpeed;
					}
					
					boid.position += boid.velocity;
					
					// 位置を画面内に制限（ラップアラウンド）
					if (boid.position.x < -1.0) {
						boid.position.x = 1.0;
					}
					if (boid.position.x > 1.0) {
						boid.position.x = -1.0;
					}
					if (boid.position.y < -1.0) {
						boid.position.y = 1.0;
					}
					if (boid.position.y > 1.0) {
						boid.position.y = -1.0;
					}
					
					// 角度を速度方向に更新
					if (length(boid.velocity) > 0.0) {
						boid.angle = atan2(boid.velocity.y, boid.velocity.x);
					}
					
					boids[index] = boid;
				}
			`;
			
			const computeShaderModule = device.createShaderModule({
				code: computeShaderCode
			});
			
			// レンダリングシェーダー
			const renderShaderCode = `
				struct Boid {
					position: vec2f,
					velocity: vec2f,
					acceleration: vec2f,
					angle: f32,
					padding: f32,
				};
				
				struct VertexOutput {
					@builtin(position) position: vec4f,
					@location(0) color: vec3f,
				};
				
				@group(0) @binding(0) var<storage, read> boids: array<Boid>;
				
				@vertex
				fn vs_main(
					@builtin(vertex_index) vertexIndex: u32,
					@builtin(instance_index) instanceIndex: u32
				) -> VertexOutput {
					var output: VertexOutput;
					
					let boid = boids[instanceIndex];
					let angle = boid.angle;
					
					// 小さな三角形の頂点
					var vertices = array<vec2f, 3>(
						vec2f(0.02, 0.0),     // 前
						vec2f(-0.013, 0.01),  // 左後ろ
						vec2f(-0.013, -0.01)  // 右後ろ
					);
					
					let vertex = vertices[vertexIndex];
					
					// 回転
					let c = cos(angle);
					let s = sin(angle);
					let rotated = vec2f(
						vertex.x * c - vertex.y * s,
						vertex.x * s + vertex.y * c
					);
					
					// 位置を適用
					output.position = vec4f(
						boid.position.x + rotated.x,
						boid.position.y + rotated.y,
						0.0,
						1.0
					);
					
					// 速度に基づいた色（明るい青から紫へ）
					let speed = length(boid.velocity) * 500.0;
					output.color = mix(
						vec3f(0.0, 0.5, 1.0),  // 明るい青（WebGPU Blue）
						vec3f(0.8, 0.3, 1.0),  // 紫（WebGPU Purple）
						clamp(speed, 0.0, 1.0)
					);
					
					return output;
				}
				
				@fragment
				fn fs_main(input: VertexOutput) -> @location(0) vec4f {
					return vec4f(input.color, 0.6);
				}
			`;
			
			const renderShaderModule = device.createShaderModule({
				code: renderShaderCode
			});
			
			// バインドグループレイアウト
			const computeBindGroupLayout = device.createBindGroupLayout({
				entries: [
					{
						binding: 0,
						visibility: GPUShaderStage.COMPUTE,
						buffer: { type: 'storage' }
					},
					{
						binding: 1,
						visibility: GPUShaderStage.COMPUTE,
						buffer: { type: 'uniform' }
					}
				]
			});
			
			const renderBindGroupLayout = device.createBindGroupLayout({
				entries: [
					{
						binding: 0,
						visibility: GPUShaderStage.VERTEX,
						buffer: { type: 'read-only-storage' }
					}
				]
			});
			
			// バインドグループ
			const computeBindGroup = device.createBindGroup({
				layout: computeBindGroupLayout,
				entries: [
					{
						binding: 0,
						resource: { buffer: boidsBuffer }
					},
					{
						binding: 1,
						resource: { buffer: paramsBuffer }
					}
				]
			});
			
			const renderBindGroup = device.createBindGroup({
				layout: renderBindGroupLayout,
				entries: [
					{
						binding: 0,
						resource: { buffer: boidsBuffer }
					}
				]
			});
			
			// パイプライン
			computePipeline = device.createComputePipeline({
				layout: device.createPipelineLayout({
					bindGroupLayouts: [computeBindGroupLayout]
				}),
				compute: {
					module: computeShaderModule,
					entryPoint: 'main'
				}
			});
			
			pipeline = device.createRenderPipeline({
				layout: device.createPipelineLayout({
					bindGroupLayouts: [renderBindGroupLayout]
				}),
				vertex: {
					module: renderShaderModule,
					entryPoint: 'vs_main'
				},
				fragment: {
					module: renderShaderModule,
					entryPoint: 'fs_main',
					targets: [{
						format,
						blend: {
							color: {
								srcFactor: 'src-alpha',
								dstFactor: 'one-minus-src-alpha',
								operation: 'add'
							},
							alpha: {
								srcFactor: 'one',
								dstFactor: 'one-minus-src-alpha',
								operation: 'add'
							}
						}
					}]
				},
				primitive: {
					topology: 'triangle-list'
				}
			});
			
			// アニメーションループ
			const animate = () => {
				// コンピュートパス（Boidsの更新）
				const computeEncoder = device.createCommandEncoder();
				const computePass = computeEncoder.beginComputePass();
				computePass.setPipeline(computePipeline);
				computePass.setBindGroup(0, computeBindGroup);
				computePass.dispatchWorkgroups(Math.ceil(NUM_BOIDS / WORKGROUP_SIZE));
				computePass.end();
				device.queue.submit([computeEncoder.finish()]);
				
				// レンダーパス
				const encoder = device.createCommandEncoder();
				const pass = encoder.beginRenderPass({
					colorAttachments: [{
						view: context.getCurrentTexture().createView(),
						clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
						loadOp: 'clear',
						storeOp: 'store'
					}]
				});
				
				pass.setPipeline(pipeline);
				pass.setBindGroup(0, renderBindGroup);
				pass.draw(3, NUM_BOIDS); // 3頂点 × NUM_BOIDS インスタンス
				pass.end();
				
				device.queue.submit([encoder.finish()]);
				animationId = requestAnimationFrame(animate);
			};
			
			animate();
			
		} catch (error) {
			console.error('WebGPU initialization failed:', error);
		}
	});
	
	onDestroy(() => {
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
	});
	
	// ウィンドウリサイズ対応
	let resizeObserver: ResizeObserver;
	onMount(() => {
		resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				canvas.width = width * devicePixelRatio;
				canvas.height = height * devicePixelRatio;
			}
		});
		resizeObserver.observe(canvas);
	});
	
	onDestroy(() => {
		resizeObserver?.disconnect();
	});
</script>

<canvas
	bind:this={canvas}
	class="absolute inset-0 w-full h-full -z-10 opacity-50"
></canvas>

<style>
	canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>