<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';
	import { MONACO_CDN_URL } from '$lib/config';
	import { registerWGSL } from '$lib/wgsl-language';
	
	interface Props {
		code: string;
		language: 'javascript' | 'wgsl' | 'typescript';
		onCodeChange?: (code: string) => void;
		readOnly?: boolean;
		height?: string;
		theme?: 'vs' | 'vs-dark' | 'hc-black';
		class?: string;
	}
	
	let { 
		code = $bindable(''), 
		language, 
		onCodeChange, 
		readOnly = false,
		height = '400px',
		theme = 'vs-dark',
		class: className = ''
	}: Props = $props();
	
	
	let editorContainer: HTMLDivElement | undefined;
	let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	let monaco: typeof Monaco;
	let isUpdatingExternally = false;
	let mounted = false;
	let themeObserver: MutationObserver | null = null;
	
	async function initializeEditor() {
		if (!editorContainer || editor) {
			return;
		}
		
		try {
			monaco = await loader.init();

			// WGSLサポートを追加
			registerWGSL(monaco);

			// 現在のページテーマに合わせて初期テーマを決定 (props の theme は無視せず override)
			const isDarkInitial = document.documentElement.classList.contains('dark');
			const initialTheme = isDarkInitial ? 'vs-dark' : 'vs';

			// エディタを作成
			editor = monaco.editor.create(editorContainer, {
				value: code || '',
				language: language === 'wgsl' ? 'wgsl' : language,
				theme: initialTheme,
				readOnly: readOnly,
				automaticLayout: true,
				minimap: { enabled: false },
				fontSize: 14,
				lineNumbers: 'on',
				roundedSelection: false,
				scrollBeyondLastLine: false,
				wordWrap: 'on',
				wrappingStrategy: 'advanced',
				folding: true,
				renderLineHighlight: 'all',
				suggestOnTriggerCharacters: true,
				acceptSuggestionOnEnter: 'smart',
				tabSize: 2,
				insertSpaces: true,
			});
			
			// コード変更の監視
			editor.onDidChangeModelContent(() => {
				if (!isUpdatingExternally) {
					const newCode = editor!.getValue();
					code = newCode;
					if (onCodeChange) {
						onCodeChange(newCode);
					}
				}
			});
			
			// テーマの監視
			themeObserver = new MutationObserver(() => {
				const isDark = document.documentElement.classList.contains('dark');
				editor?.updateOptions({ theme: isDark ? 'vs-dark' : 'vs' });
			});
			
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class']
			});
			
			// エディタのレイアウトを強制的に更新
			setTimeout(() => {
				editor?.layout();
			}, 100);
		} catch (error) {
			console.error('[MonacoEditor] Failed to initialize:', error);
		}
	}
	
	// エディタコンテナが設定されたら初期化
	$effect(() => {
		if (editorContainer && mounted) {
			initializeEditor();
		}
	});
	
	onMount(() => {
		mounted = true;

		// Monacoローダーの設定
		loader.config({ paths: { vs: MONACO_CDN_URL } });

		// 少し遅延を入れて初期化を試みる（$effectのフォールバック）
		setTimeout(() => {
			if (editorContainer) {
				initializeEditor();
			}
		}, 100);
		
		return () => {
			themeObserver?.disconnect();
			if (editor) {
				editor.dispose();
			}
		};
	});
	
	// 外部からのコード更新を監視
	// code を if の前で読むことで、editor が null の間も依存として追跡される
	$effect(() => {
		const latestCode = code;
		if (editor && editor.getValue() !== latestCode) {
			isUpdatingExternally = true;
			editor.setValue(latestCode || '');
			isUpdatingExternally = false;
		}
	});
	
	// 言語の変更を監視
	$effect(() => {
		if (editor && monaco) {
			const model = editor.getModel();
			if (model) {
				monaco.editor.setModelLanguage(model, language === 'wgsl' ? 'wgsl' : language);
			}
		}
	});
</script>

<div 
	class="monaco-editor-container {className}" 
	style="height: {height}"
	bind:this={editorContainer}
></div>

<style>
	.monaco-editor-container {
		@apply border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden;
		min-height: 200px;
	}
</style>