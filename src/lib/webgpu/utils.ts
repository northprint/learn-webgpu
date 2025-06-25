/**
 * WebGPU initialization utilities
 */

/**
 * Check if WebGPU is supported in the current browser
 */
export async function checkWebGPUSupport(): Promise<boolean> {
	if (!('gpu' in navigator)) {
		console.log('WebGPU API not found in navigator');
		return false;
	}
	
	try {
		// より詳細なオプションを指定してアダプターをリクエスト
		const adapter = await navigator.gpu.requestAdapter({
			powerPreference: 'high-performance',
			forceFallbackAdapter: false
		});
		
		if (!adapter) {
			console.log('No WebGPU adapter available');
			return false;
		}
		
		// デバイスも取得できるか確認
		const device = await adapter.requestDevice();
		console.log('WebGPU support confirmed:', {
			adapter: adapter,
			device: device,
			features: Array.from(adapter.features || []),
			limits: adapter.limits
		});
		
		// デバイスを破棄
		device.destroy();
		
		return true;
	} catch (e) {
		console.error('Failed to initialize WebGPU:', e);
		return false;
	}
}

/**
 * Initialize WebGPU and return adapter and device
 */
export async function initWebGPU() {
	if (!('gpu' in navigator)) {
		throw new Error('WebGPU is not supported in this browser');
	}
	
	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
		throw new Error('Failed to request WebGPU adapter');
	}
	
	const device = await adapter.requestDevice();
	
	// エラーハンドリング設定
	device.lost.then((info) => {
		console.error(`WebGPU device was lost: ${info.message}`);
		if (info.reason !== 'destroyed') {
			// デバイスが予期せず失われた場合の処理
			initWebGPU();
		}
	});
	
	return { adapter, device };
}

/**
 * Create and configure canvas for WebGPU rendering
 */
export function configureCanvas(
	canvas: HTMLCanvasElement,
	device: GPUDevice,
	format?: GPUTextureFormat
): GPUCanvasContext {
	const context = canvas.getContext('webgpu');
	if (!context) {
		throw new Error('Failed to get WebGPU context from canvas');
	}
	
	const devicePixelRatio = window.devicePixelRatio || 1;
	canvas.width = canvas.clientWidth * devicePixelRatio;
	canvas.height = canvas.clientHeight * devicePixelRatio;
	
	const preferredFormat = format || navigator.gpu.getPreferredCanvasFormat();
	
	context.configure({
		device,
		format: preferredFormat,
		alphaMode: 'premultiplied',
	});
	
	return context;
}

/**
 * Create a simple render pipeline
 */
export function createRenderPipeline(
	device: GPUDevice,
	vertexShader: string,
	fragmentShader: string,
	format: GPUTextureFormat
): GPURenderPipeline {
	const vertexModule = device.createShaderModule({
		label: 'Vertex shader',
		code: vertexShader
	});
	
	const fragmentModule = device.createShaderModule({
		label: 'Fragment shader',
		code: fragmentShader
	});
	
	return device.createRenderPipeline({
		label: 'Basic render pipeline',
		layout: 'auto',
		vertex: {
			module: vertexModule,
			entryPoint: 'main'
		},
		fragment: {
			module: fragmentModule,
			entryPoint: 'main',
			targets: [{
				format
			}]
		},
		primitive: {
			topology: 'triangle-list'
		}
	});
}

/**
 * Load shader code from a URL or string
 */
export async function loadShader(source: string): Promise<string> {
	// URLの場合はfetchで取得
	if (source.startsWith('http') || source.startsWith('/')) {
		const response = await fetch(source);
		if (!response.ok) {
			throw new Error(`Failed to load shader from ${source}`);
		}
		return await response.text();
	}
	
	// そのまま返す
	return source;
}