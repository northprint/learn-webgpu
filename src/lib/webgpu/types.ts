/**
 * WebGPU related type definitions
 */

export interface WebGPUContext {
	adapter: GPUAdapter;
	device: GPUDevice;
	canvas: HTMLCanvasElement;
	context: GPUCanvasContext;
	format: GPUTextureFormat;
}

export interface ShaderModule {
	vertex: string;
	fragment: string;
}

export interface TutorialStep {
	title: string;
	content: string; // Markdown形式の説明
	hint?: string; // ヒント
	task?: string; // 実行すべきタスク
	validation?: {
		type: 'code-contains' | 'output-contains' | 'canvas-rendered';
		value: string;
	};
}

export interface TutorialExample {
	id: string;
	title: string;
	description: string;
	steps?: TutorialStep[]; // ステップバイステップの説明
	code: {
		javascript: string;
		vertexShader: string;
		fragmentShader: string;
	};
	initialCode?: { // 初期表示するコード（空白や基本的なテンプレート）
		javascript: string;
		vertexShader: string;
		fragmentShader: string;
	};
	solution?: { // 解答コード
		javascript: string;
		vertexShader: string;
		fragmentShader: string;
	};
	defaultValues?: Record<string, any>;
	challenges?: { // 追加の課題
		title: string;
		description: string;
		hint?: string;
	}[];
	externalResources?: string[]; // 外部リソース（画像、データファイルなど）のURL
}

export interface TutorialChapter {
	id: string;
	title: string;
	description: string;
	examples: TutorialExample[];
}

export interface EditorState {
	javascript: string;
	vertexShader: string;
	fragmentShader: string;
	activeTab: 'javascript' | 'vertex' | 'fragment';
}

export interface ConsoleMessage {
	type: 'log' | 'error' | 'warn' | 'info';
	message: string;
	timestamp: Date;
}