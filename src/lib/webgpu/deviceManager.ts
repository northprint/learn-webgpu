import type { WebGPUContext } from './types';

class WebGPUDeviceManager {
	private static instance: WebGPUDeviceManager | null = null;
	private device: GPUDevice | null = null;
	private adapter: GPUAdapter | null = null;
	private canvasContexts = new WeakMap<HTMLCanvasElement, GPUCanvasContext>();
	
	private constructor() {}
	
	static getInstance(): WebGPUDeviceManager {
		if (!WebGPUDeviceManager.instance) {
			WebGPUDeviceManager.instance = new WebGPUDeviceManager();
		}
		return WebGPUDeviceManager.instance;
	}
	
	async getDevice(): Promise<GPUDevice> {
		// 既存のデバイスが有効な場合はそれを返す
		if (this.device) {
			// デバイスロストをチェック
			try {
				// デバイスが失われていないかテスト（簡単なバッファ作成で確認）
				const testBuffer = this.device.createBuffer({
					size: 4,
					usage: GPUBufferUsage.VERTEX
				});
				testBuffer.destroy();
				return this.device;
			} catch (e) {
				// デバイスが無効な場合は、リセット
				this.device = null;
				this.adapter = null;
			}
		}
		
		// 新しいアダプターとデバイスを作成
		if (!navigator.gpu) {
			throw new Error('WebGPUはこのブラウザでサポートされていません');
		}
		
		// 常に新しいアダプターを取得
		this.adapter = await navigator.gpu.requestAdapter({
			powerPreference: 'high-performance'
		});
		
		if (!this.adapter) {
			throw new Error('WebGPUアダプターが見つかりません');
		}
		
		this.device = await this.adapter.requestDevice();
		
		// デバイスエラーのキャプチャ設定
		this.device.addEventListener('uncapturederror', (event) => {
			console.error('[DeviceManager] Uncaptured device error:', event.error);
		});
		
		// デバイスロストハンドリング
		this.device.lost.then((info) => {
			// "already been used to create a device"エラーは無視（正常な動作の一部）
			if (!info.message.includes('already been used to create a device')) {
				console.error(`[DeviceManager] Device lost: ${info.message}`);
			}
			this.device = null;
			this.adapter = null;
		});
		
		return this.device;
	}
	
	async createContext(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
		const device = await this.getDevice();
		
		// キャンバスに対して既存のコンテキストがあるか確認
		let context = this.canvasContexts.get(canvas);
		
		if (!context) {
			context = canvas.getContext('webgpu');
			if (!context) {
				throw new Error('WebGPUコンテキストを取得できません');
			}
			this.canvasContexts.set(canvas, context);
		}
		
		const format = navigator.gpu.getPreferredCanvasFormat();
		
		// キャンバスを設定
		context.configure({
			device,
			format,
			alphaMode: 'premultiplied',
		});
		
		return {
			adapter: this.adapter!,
			device,
			canvas,
			context,
			format
		};
	}
	
	// キャンバスのコンテキストをリセット
	async resetCanvasContext(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
		// 既存のコンテキストを解放
		this.releaseCanvasContext(canvas);
		
		// 新しいコンテキストを作成して返す
		return await this.createContext(canvas);
	}
	
	// キャンバスのコンテキストを解放
	releaseCanvasContext(canvas: HTMLCanvasElement): void {
		const context = this.canvasContexts.get(canvas);
		if (context) {
			try {
				context.unconfigure();
			} catch (e) {
				console.warn('[DeviceManager] Failed to unconfigure context:', e);
			}
			this.canvasContexts.delete(canvas);
		}
	}
}

export const webgpuDeviceManager = WebGPUDeviceManager.getInstance();