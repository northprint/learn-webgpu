<!--
  ParticleField: WebGPU コンピュートシェーダーによる Boids（群れ）を
  「柔らかく光るシアンの粒子」として描画する上品な背景。
  - compute: flocking（分離・整列・結合）で群れの動き
  - render: インスタンスごとにビルボードquad＋放射状アルファ減衰でソフトな発光粒子
  - 色はアクセントのシアン、速度で明るさ/サイズ変化、ゆらぎ（twinkle）
  - premultiplied alpha の「over」合成なので light/dark 両対応
  - prefers-reduced-motion で静止、WebGPU非対応なら何も描画しない（グリッド＋グローがフォールバック）
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let canvas: HTMLCanvasElement;
	let device: GPUDevice | undefined;
	let context: GPUCanvasContext | undefined;
	let animationId = 0;
	let resizeObserver: ResizeObserver | undefined;
	let destroyed = false;
	let startTime = performance.now();

	const NUM = 200;
	const WORKGROUP_SIZE = 64;

	onMount(() => {
		init();
		return () => {
			destroyed = true;
			if (animationId) cancelAnimationFrame(animationId);
			resizeObserver?.disconnect();
		};
	});

	onDestroy(() => {
		destroyed = true;
		if (animationId) cancelAnimationFrame(animationId);
		resizeObserver?.disconnect();
	});

	async function init() {
		if (typeof navigator === 'undefined' || !navigator.gpu) return;

		try {
			const adapter = await navigator.gpu.requestAdapter();
			if (!adapter || destroyed) return;
			device = await adapter.requestDevice();
			if (destroyed) return;

			context = canvas.getContext('webgpu') as GPUCanvasContext;
			const format = navigator.gpu.getPreferredCanvasFormat();
			context.configure({ device, format, alphaMode: 'premultiplied' });

			// --- Boids 初期データ（position, velocity, acceleration, seed, padding）---
			const data = new Float32Array(NUM * 8);
			for (let i = 0; i < NUM; i++) {
				const o = i * 8;
				data[o + 0] = Math.random() * 2 - 1;
				data[o + 1] = Math.random() * 2 - 1;
				const a = Math.random() * Math.PI * 2;
				const s = 0.0006 + Math.random() * 0.0014;
				data[o + 2] = Math.cos(a) * s;
				data[o + 3] = Math.sin(a) * s;
				data[o + 4] = 0;
				data[o + 5] = 0;
				data[o + 6] = Math.random(); // per-particle seed（サイズ/明るさ/位相）
				data[o + 7] = 0;
			}

			const boidsBuffer = device.createBuffer({
				size: data.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
			});
			device.queue.writeBuffer(boidsBuffer, 0, data);

			const params = new Float32Array([
				NUM, // numBoids
				0.12, // visualRange
				0.045, // separationDistance
				0.0016, // maxSpeed
				0.00018, // separationForce
				0.00008, // alignmentForce
				0.00008, // cohesionForce
				0 // padding
			]);
			const paramsBuffer = device.createBuffer({
				size: params.byteLength,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
			});
			device.queue.writeBuffer(paramsBuffer, 0, params);

			// render uniform: resolution(vec2), time, pad
			const renderParamsBuffer = device.createBuffer({
				size: 16,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
			});

			const computeModule = device.createShaderModule({ code: computeWGSL });
			const renderModule = device.createShaderModule({ code: renderWGSL });

			const computeBGL = device.createBindGroupLayout({
				entries: [
					{ binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
					{ binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
				]
			});
			const renderBGL = device.createBindGroupLayout({
				entries: [
					{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
					{ binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }
				]
			});

			const computeBindGroup = device.createBindGroup({
				layout: computeBGL,
				entries: [
					{ binding: 0, resource: { buffer: boidsBuffer } },
					{ binding: 1, resource: { buffer: paramsBuffer } }
				]
			});
			const renderBindGroup = device.createBindGroup({
				layout: renderBGL,
				entries: [
					{ binding: 0, resource: { buffer: boidsBuffer } },
					{ binding: 1, resource: { buffer: renderParamsBuffer } }
				]
			});

			const computePipeline = device.createComputePipeline({
				layout: device.createPipelineLayout({ bindGroupLayouts: [computeBGL] }),
				compute: { module: computeModule, entryPoint: 'main' }
			});

			const renderPipeline = device.createRenderPipeline({
				layout: device.createPipelineLayout({ bindGroupLayouts: [renderBGL] }),
				vertex: { module: renderModule, entryPoint: 'vs_main' },
				fragment: {
					module: renderModule,
					entryPoint: 'fs_main',
					targets: [
						{
							format,
							blend: {
								// premultiplied alpha の over 合成
								color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
								alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
							}
						}
					]
				},
				primitive: { topology: 'triangle-list' }
			});

			// リサイズ対応
			const applySize = (w: number, h: number) => {
				const dpr = Math.min(window.devicePixelRatio || 1, 2);
				canvas.width = Math.max(1, Math.floor(w * dpr));
				canvas.height = Math.max(1, Math.floor(h * dpr));
			};
			resizeObserver = new ResizeObserver((entries) => {
				for (const e of entries) applySize(e.contentRect.width, e.contentRect.height);
			});
			resizeObserver.observe(canvas);
			applySize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

			const reduceMotion =
				window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

			const writeRenderParams = (time: number) => {
				device!.queue.writeBuffer(
					renderParamsBuffer,
					0,
					new Float32Array([canvas.width, canvas.height, time, 0])
				);
			};

			const renderOnce = (time: number, runCompute: boolean) => {
				if (!device || !context) return;
				if (runCompute) {
					const ce = device.createCommandEncoder();
					const cp = ce.beginComputePass();
					cp.setPipeline(computePipeline);
					cp.setBindGroup(0, computeBindGroup);
					cp.dispatchWorkgroups(Math.ceil(NUM / WORKGROUP_SIZE));
					cp.end();
					device.queue.submit([ce.finish()]);
				}
				writeRenderParams(time);
				const encoder = device.createCommandEncoder();
				const pass = encoder.beginRenderPass({
					colorAttachments: [
						{
							view: context.getCurrentTexture().createView(),
							clearValue: { r: 0, g: 0, b: 0, a: 0 },
							loadOp: 'clear',
							storeOp: 'store'
						}
					]
				});
				pass.setPipeline(renderPipeline);
				pass.setBindGroup(0, renderBindGroup);
				pass.draw(6, NUM);
				pass.end();
				device.queue.submit([encoder.finish()]);
			};

			if (reduceMotion) {
				// 静止: 一度だけ描画
				renderOnce(0, false);
				return;
			}

			const loop = () => {
				if (destroyed || !device) return;
				const t = (performance.now() - startTime) / 1000;
				renderOnce(t, true);
				animationId = requestAnimationFrame(loop);
			};
			loop();
		} catch (e) {
			// 失敗時は静かにフォールバック（グリッド＋グローのみ）
			console.warn('ParticleField init failed:', e);
		}
	}

	const computeWGSL = `
		struct Boid {
			position: vec2f,
			velocity: vec2f,
			acceleration: vec2f,
			seed: f32,
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
		fn main(@builtin(global_invocation_id) gid: vec3u) {
			let index = gid.x;
			if (index >= u32(params.numBoids)) { return; }
			var boid = boids[index];
			var separation = vec2f(0.0);
			var alignment = vec2f(0.0);
			var cohesion = vec2f(0.0);
			var neighborCount = 0.0;
			var separationCount = 0.0;

			for (var i = 0u; i < u32(params.numBoids); i++) {
				if (i == index) { continue; }
				let other = boids[i];
				let diff = boid.position - other.position;
				let dist = length(diff);
				if (dist < params.visualRange && dist > 0.0) {
					if (dist < params.separationDistance) {
						separation += normalize(diff) / dist;
						separationCount += 1.0;
					}
					alignment += other.velocity;
					cohesion += other.position;
					neighborCount += 1.0;
				}
			}

			boid.acceleration = vec2f(0.0);
			if (separationCount > 0.0) {
				separation = separation / separationCount;
				boid.acceleration += separation * params.separationForce;
			}
			if (neighborCount > 0.0) {
				alignment = alignment / neighborCount - boid.velocity;
				boid.acceleration += alignment * params.alignmentForce;
				cohesion = cohesion / neighborCount - boid.position;
				boid.acceleration += cohesion * params.cohesionForce;
			}

			let margin = 0.15;
			if (boid.position.x < -1.0 + margin) { boid.acceleration.x += 0.0008; }
			if (boid.position.x > 1.0 - margin) { boid.acceleration.x -= 0.0008; }
			if (boid.position.y < -1.0 + margin) { boid.acceleration.y += 0.0008; }
			if (boid.position.y > 1.0 - margin) { boid.acceleration.y -= 0.0008; }

			boid.velocity += boid.acceleration;
			let speed = length(boid.velocity);
			if (speed > params.maxSpeed) {
				boid.velocity = normalize(boid.velocity) * params.maxSpeed;
			}
			boid.position += boid.velocity;

			// ラップアラウンド
			if (boid.position.x < -1.05) { boid.position.x = 1.05; }
			if (boid.position.x > 1.05) { boid.position.x = -1.05; }
			if (boid.position.y < -1.05) { boid.position.y = 1.05; }
			if (boid.position.y > 1.05) { boid.position.y = -1.05; }

			boids[index] = boid;
		}
	`;

	const renderWGSL = `
		struct Boid {
			position: vec2f,
			velocity: vec2f,
			acceleration: vec2f,
			seed: f32,
			padding: f32,
		};
		struct RP {
			resolution: vec2f,
			time: f32,
			pad: f32,
		};
		@group(0) @binding(0) var<storage, read> boids: array<Boid>;
		@group(0) @binding(1) var<uniform> rp: RP;

		struct VSOut {
			@builtin(position) pos: vec4f,
			@location(0) uv: vec2f,
			@location(1) color: vec3f,
			@location(2) alpha: f32,
		};

		@vertex
		fn vs_main(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VSOut {
			var corners = array<vec2f, 6>(
				vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
				vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
			);
			let c = corners[vi];
			let b = boids[ii];
			let seed = b.seed;

			// 発光半径（px）— 粒子ごとにばらつき
			let radiusPx = mix(8.0, 20.0, seed);
			// アスペクトを考慮して真円に
			let halfClip = vec2f(radiusPx * 2.0 / rp.resolution.x, radiusPx * 2.0 / rp.resolution.y);

			var out: VSOut;
			out.pos = vec4f(b.position + c * halfClip, 0.0, 1.0);
			out.uv = c;

			let speed = clamp(length(b.velocity) * 450.0, 0.0, 1.0);
			// ゆらぎ
			let tw = 0.72 + 0.28 * sin(rp.time * 1.4 + seed * 6.2831);
			out.alpha = (0.30 + 0.42 * speed) * tw * (0.55 + 0.45 * seed);

			// シアン → 明るいシアン（速度で明度）
			let cyan = vec3f(0.27, 0.76, 0.95);
			let bright = vec3f(0.72, 0.95, 1.0);
			out.color = mix(cyan, bright, speed);
			return out;
		}

		@fragment
		fn fs_main(in: VSOut) -> @location(0) vec4f {
			let d = length(in.uv);
			// ソフトな円＋明るいコア
			let soft = smoothstep(1.0, 0.0, d);
			let a = pow(soft, 1.8) * in.alpha;
			// premultiplied alpha
			return vec4f(in.color * a, a);
		}
	`;
</script>

<canvas bind:this={canvas} class="particle-canvas"></canvas>

<style>
	.particle-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
