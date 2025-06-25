<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';
	
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
	
	// WGSLのための言語定義
	function registerWGSL(monaco: typeof Monaco) {
		// WGSLトークンプロバイダー
		monaco.languages.register({ id: 'wgsl' });
		
		monaco.languages.setMonarchTokensProvider('wgsl', {
			keywords: [
				'fn', 'let', 'var', 'const', 'struct', 'if', 'else', 'for', 'while',
				'return', 'break', 'continue', 'discard', 'true', 'false'
			],
			
			typeKeywords: [
				'bool', 'i32', 'u32', 'f32', 'f16', 'vec2', 'vec3', 'vec4',
				'vec2f', 'vec3f', 'vec4f', 'vec2i', 'vec3i', 'vec4i',
				'mat2x2', 'mat3x3', 'mat4x4', 'array', 'texture_2d', 'sampler'
			],
			
			operators: [
				'=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
				'&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
				'<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
				'%=', '<<=', '>>=', '>>>='
			],
			
			symbols: /[=><!~?:&|+\-*\/\^%]+/,
			
			tokenizer: {
				root: [
					// 識別子とキーワード
					[/[a-zA-Z_]\w*/, {
						cases: {
							'@typeKeywords': 'type',
							'@keywords': 'keyword',
							'@default': 'identifier'
						}
					}],
					
					// デコレータ
					[/@[a-zA-Z_]\w*/, 'annotation'],
					
					// 数値
					[/\d*\.\d+([eE][\-+]?\d+)?[fh]?/, 'number.float'],
					[/0[xX][0-9a-fA-F]+[ul]?/, 'number.hex'],
					[/\d+[ul]?/, 'number'],
					
					// 文字列
					[/"([^"\\]|\\.)*$/, 'string.invalid'],
					[/"/, 'string', '@string'],
					
					// コメント
					[/\/\/.*$/, 'comment'],
					[/\/\*/, 'comment', '@comment'],
					
					// 記号
					[/[{}()\[\]]/, '@brackets'],
					[/[<>](?!@symbols)/, '@brackets'],
					[/@symbols/, {
						cases: {
							'@operators': 'operator',
							'@default': ''
						}
					}],
					
					// セミコロンとカンマ
					[/[;,.]/, 'delimiter'],
				],
				
				string: [
					[/[^\\"]+/, 'string'],
					[/\\./, 'string.escape.invalid'],
					[/"/, 'string', '@pop']
				],
				
				comment: [
					[/[^\/*]+/, 'comment'],
					[/\*\//, 'comment', '@pop'],
					[/[\/*]/, 'comment']
				],
			},
		});
		
		// 基本的な自動補完
		monaco.languages.registerCompletionItemProvider('wgsl', {
			provideCompletionItems: () => {
				const suggestions: any[] = [
					// 関数
					{ label: 'fn', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'fn ${1:name}(${2:params}) -> ${3:type} {\n\t$0\n}' },
					{ label: 'struct', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'struct ${1:Name} {\n\t${2:field}: ${3:type},\n}' },
					
					// 型
					{ label: 'vec2f', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'vec2f' },
					{ label: 'vec3f', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'vec3f' },
					{ label: 'vec4f', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'vec4f' },
					
					// デコレータ
					{ label: '@vertex', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@vertex' },
					{ label: '@fragment', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@fragment' },
					{ label: '@builtin', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@builtin(${1:position})' },
					{ label: '@location', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@location(${1:0})' },
				];
				
				return { suggestions };
			}
		});
	}
	
	async function initializeEditor() {
		if (!editorContainer || editor) {
			return;
		}
		
		try {
			console.log('[MonacoEditor] Initializing editor...');
			console.log('[MonacoEditor] Container:', editorContainer);
			console.log('[MonacoEditor] Initial code:', code);
			
			monaco = await loader.init();
			
			// WGSLサポートを追加
			registerWGSL(monaco);
			
			// エディタを作成
			console.log('[MonacoEditor] Creating editor with initial code:', code?.substring(0, 100) + '...');
			editor = monaco.editor.create(editorContainer, {
				value: code || '',
				language: language === 'wgsl' ? 'wgsl' : language,
				theme: theme,
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
			const observer = new MutationObserver(() => {
				const isDark = document.documentElement.classList.contains('dark');
				editor?.updateOptions({ theme: isDark ? 'vs-dark' : 'vs' });
			});
			
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class']
			});
			
			console.log('[MonacoEditor] Editor initialized successfully');
			
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
		console.log('[MonacoEditor] Effect check - container:', !!editorContainer, 'mounted:', mounted);
		if (editorContainer && mounted) {
			console.log('[MonacoEditor] Both conditions met, initializing...');
			initializeEditor();
		}
	});
	
	onMount(() => {
		console.log('[MonacoEditor] Component mounted');
		mounted = true;
		
		// Monacoローダーの設定
		loader.config({ 
			paths: { 
				vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' 
			} 
		});
		
		// 少し遅延を入れて初期化を試みる
		setTimeout(() => {
			console.log('[MonacoEditor] Attempting delayed initialization - container:', !!editorContainer);
			if (editorContainer) {
				initializeEditor();
			}
		}, 100);
		
		return () => {
			if (editor) {
				editor.dispose();
			}
		};
	});
	
	// 外部からのコード更新を監視
	$effect(() => {
		console.log('[MonacoEditor] Code effect, editor exists:', !!editor, 'code length:', code?.length);
		if (editor) {
			const currentValue = editor.getValue();
			if (currentValue !== code) {
				console.log('[MonacoEditor] Updating editor content from:', currentValue.substring(0, 30) + '...', 'to:', code.substring(0, 30) + '...');
				isUpdatingExternally = true;
				editor.setValue(code || '');
				isUpdatingExternally = false;
			}
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