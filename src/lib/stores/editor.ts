import { writable } from 'svelte/store';
import type { EditorState, ConsoleMessage } from '$lib/webgpu/types';

// エディタの状態管理
export const editorState = writable<EditorState>({
	javascript: '',
	vertexShader: '',
	fragmentShader: '',
	activeTab: 'javascript'
});

// コンソールメッセージの管理
function createConsoleStore() {
	const { subscribe, update, set } = writable<ConsoleMessage[]>([]);
	
	return {
		subscribe,
		
		// メッセージを追加
		log(message: string) {
			update(messages => [...messages, {
				type: 'log',
				message,
				timestamp: new Date()
			}]);
		},
		
		// エラーメッセージを追加
		error(message: string) {
			update(messages => [...messages, {
				type: 'error',
				message,
				timestamp: new Date()
			}]);
		},
		
		// 警告メッセージを追加
		warn(message: string) {
			update(messages => [...messages, {
				type: 'warn',
				message,
				timestamp: new Date()
			}]);
		},
		
		// 情報メッセージを追加
		info(message: string) {
			update(messages => [...messages, {
				type: 'info',
				message,
				timestamp: new Date()
			}]);
		},
		
		// コンソールをクリア
		clear() {
			set([]);
		}
	};
}

export const consoleMessages = createConsoleStore();

// コード実行状態の管理
export const executionState = writable({
	isRunning: false,
	lastRunTime: null as Date | null,
	error: null as string | null
});

// エディタのユーティリティ関数
export function resetEditor() {
	editorState.set({
		javascript: '',
		vertexShader: '',
		fragmentShader: '',
		activeTab: 'javascript'
	});
	consoleMessages.clear();
	executionState.set({
		isRunning: false,
		lastRunTime: null,
		error: null
	});
}

// コードをエディタにロード
export function loadCode(code: { javascript: string; vertexShader: string; fragmentShader: string }) {
	console.log('[editor.ts] loadCode called with:', {
		javascript: code.javascript?.substring(0, 50) + '...',
		vertexShader: code.vertexShader?.substring(0, 50) + '...',
		fragmentShader: code.fragmentShader?.substring(0, 50) + '...'
	});
	
	// 完全に新しいオブジェクトを作成して強制的に更新
	editorState.set({
		javascript: code.javascript || '',
		vertexShader: code.vertexShader || '',
		fragmentShader: code.fragmentShader || '',
		activeTab: 'javascript'
	});
}