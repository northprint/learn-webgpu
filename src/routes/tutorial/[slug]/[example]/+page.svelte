<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { goto, afterNavigate } from '$app/navigation';
	import WebGPUCanvas from '$lib/components/WebGPUCanvas.svelte';
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import ConsoleOutput from '$lib/components/ConsoleOutput.svelte';
	import TutorialSteps from '$lib/components/TutorialSteps.svelte';
	import { getTutorialExample, getTutorialChapter, getNextExample } from '$lib/tutorials/index.js';
	import { editorState, consoleMessages, executionState, loadCode } from '$lib/stores/editor.js';
	import { progress } from '$lib/stores/progress.js';
	import type { WebGPUContext } from '$lib/webgpu/types.js';
	import { createConsoleBridge, checkSyntax, executeUserCode } from '$lib/webgpu/codeRunner';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	
	let webgpuContext: WebGPUContext | null = null;
	let currentExecutionId = 0;
	let canvasComponent = $state<WebGPUCanvas | null>(null);
	let activeAnimationFrame: number | null = null;
	let activeTimeouts: ReturnType<typeof setTimeout>[] = [];
	let createdResources: any[] = [];
	
	// URLパラメータから現在のチャプターと例題を取得
	let chapterId = $derived($page.params.slug);
	let exampleId = $derived($page.params.example);
	let chapter = $derived(getTutorialChapter(chapterId));
	let example = $derived(chapter ? getTutorialExample(chapterId, exampleId) : undefined);
	
	// 次の単元の情報を取得
	let nextExample = $derived(
		chapterId && exampleId ? getNextExample(chapterId, exampleId) : null
	);
	let nextChapter = $derived(
		nextExample ? getTutorialChapter(nextExample.chapterId) : null
	);
	let nextExampleInfo = $derived(
		nextExample && nextChapter ? getTutorialExample(nextExample.chapterId, nextExample.exampleId) : null
	);
	
	// タブとビューの管理
	let activeTab = $state<'javascript' | 'vertex' | 'fragment'>('javascript');
	let viewMode = $state<'learn' | 'code'>('learn');
	let showSolution = $state(false);
	let currentStep = $state(0);
	let typingMode = $state(false); // 写経モード
	
	// 最小限のシェーダーコードテンプレート
	const minimalVertexShader = `// 最小限の頂点シェーダー
@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  // TODO: 頂点座標を実装してください
  return vec4f(0.0, 0.0, 0.0, 1.0);
}`;

	const minimalFragmentShader = `// 最小限のフラグメントシェーダー
@fragment
fn fs_main() -> @location(0) vec4f {
  // TODO: 色を実装してください
  return vec4f(0.5, 0.5, 0.5, 1.0); // グレー
}`;

	// 例題のコードをエディタにロード
	$effect(() => {
		// exampleが変更された時のみ実行（showSolutionの変更では実行しない）
		if (example) {
			const codeToLoad = example.initialCode || example.code;
			if (codeToLoad) {
				// 空のシェーダーコードを最小限のテンプレートで置き換え
				const processedCode = {
					javascript: codeToLoad.javascript || '',
					vertexShader: codeToLoad.vertexShader || minimalVertexShader,
					fragmentShader: codeToLoad.fragmentShader || minimalFragmentShader
				};
				loadCode(processedCode);
			}
			progress.setLastVisited($page.url.pathname);
			currentStep = 0;
			showSolution = false;
			viewMode = example.steps ? 'learn' : 'code';
		}
	});
	
	// ページが変更されたときにキャンバスをクリアとリソースをクリーンアップ
	$effect(() => {
		if (chapterId && exampleId) {
			// 実行中のアニメーションフレームをキャンセル
			if (activeAnimationFrame !== null) {
				cancelAnimationFrame(activeAnimationFrame);
				activeAnimationFrame = null;
			}
			
			// アクティブなタイムアウトをクリア
			activeTimeouts.forEach(id => clearTimeout(id));
			activeTimeouts = [];
			
			// 実行IDをインクリメント（古い非同期処理を無効化）
			currentExecutionId++;
			
			// WebGPUリソースのクリーンアップ
			cleanupWebGPUResources();
			
			// キャンバスのリセット
			if (canvasComponent) {
				canvasComponent.clearCanvas();
				// コンテキストのリセット
				canvasComponent.resetContext();
			}
			
			// WebGPUコンテキストをクリア
			webgpuContext = null;
			
			// スクロール位置をトップに戻す
			window.scrollTo(0, 0);
			
			consoleMessages.clear();
			consoleMessages.info(m.tutorial_detail_msg_loaded());
		}
		
		return () => {
			// エフェクトのクリーンアップ時にもリソースを解放
			if (activeAnimationFrame !== null) {
				cancelAnimationFrame(activeAnimationFrame);
			}
			activeTimeouts.forEach(id => clearTimeout(id));
			cleanupWebGPUResources();
		};
	});
	
	// WebGPUコンテキストの準備完了
	function handleContextReady(context: WebGPUContext) {
		webgpuContext = context;
		consoleMessages.info(m.tutorial_detail_msg_ctx_ready());
	}
	
	// WebGPUリソースのクリーンアップ
	function cleanupWebGPUResources() {
		// 作成されたリソースの破棄
		createdResources.forEach(resource => {
			try {
				if (resource && typeof resource.destroy === 'function') {
					resource.destroy();
				}
			} catch (e) {
				console.warn('Failed to destroy resource:', e);
			}
		});
		createdResources = [];
	}
	
	// コードの実行
	async function runCode() {
		if (!webgpuContext) {
			consoleMessages.error('WebGPUが初期化されていません');
			return;
		}
		
		executionState.update(state => ({
			...state,
			isRunning: true,
			error: null
		}));
		
		consoleMessages.clear();
		consoleMessages.log('コードを実行中...');
		
		const executionId = ++currentExecutionId;
		
		try {
			// デバイスロストイベントのハンドリングを設定
			const device = webgpuContext.device;
			const lostPromise = device.lost.then((info) => {
				// "already been used to create a device"エラーは正常動作の一部なので無視
				if (info.message && !info.message.includes('already been used to create a device')) {
					consoleMessages.error(`GPUデバイスが失われました: ${info.reason}`);
					if (info.message) {
						consoleMessages.error(`詳細: ${info.message}`);
					}
				}
			});
			
			// カスタムコンソールの拡張
			const customConsole = createConsoleBridge(consoleMessages);
			
			// シェーダーコンパイル用のヘルパー関数
			const createShaderModule = async (code: string, type: 'vertex' | 'fragment') => {
				try {
					// エラースコープをプッシュ
					device.pushErrorScope('validation');
					
					const shaderModule = device.createShaderModule({
						label: `${type} shader`,
						code: code
					});
					
					// エラーをポップして確認
					const error = await device.popErrorScope();
					if (error) {
						throw new Error(`シェーダーコンパイルエラー (${type}): ${error.message}`);
					}
					
					// コンパイル情報を取得（利用可能な場合）
					if ('getCompilationInfo' in shaderModule) {
						const info = await (shaderModule as any).getCompilationInfo();
						if (info.messages && info.messages.length > 0) {
							customConsole.warn(`----- ${type.toUpperCase()} シェーダーコンパイル情報 -----`);
							
							// シェーダーコードを行番号付きで表示
							const shaderCode = type === 'vertex' ? $editorState.vertexShader : $editorState.fragmentShader;
							const lines = shaderCode.split('\n');
							
							for (const message of info.messages) {
								const level = message.type;
								const lineNum = message.lineNum || 0;
								const linePos = message.linePos || 0;
								
								// エラー位置の前後のコードを表示
								if (lineNum > 0 && lineNum <= lines.length) {
									const startLine = Math.max(0, lineNum - 3);
									const endLine = Math.min(lines.length, lineNum + 2);
									
									customConsole.warn('問題のあるコード:');
									for (let i = startLine; i < endLine; i++) {
										const prefix = i === lineNum - 1 ? '>>> ' : '    ';
										customConsole.warn(`${prefix}${i + 1}: ${lines[i]}`);
										
										// エラー位置を矢印で示す
										if (i === lineNum - 1 && linePos > 0) {
											const arrow = ' '.repeat(prefix.length + (i + 1).toString().length + 2 + linePos - 1) + '^';
											customConsole.warn(arrow);
										}
									}
								}
								
								const msg = `シェーダー${level} (${type}) [行 ${lineNum}, 列 ${linePos}]: ${message.message}`;
								
								if (level === 'error') {
									customConsole.error(msg);
								} else if (level === 'warning') {
									customConsole.warn(msg);
								} else {
									customConsole.info(msg);
								}
							}
							customConsole.warn('----------------------------------------');
						}
					}
					
					return shaderModule;
				} catch (error) {
					throw new Error(`シェーダーモジュール作成エラー (${type}): ${error instanceof Error ? error.message : String(error)}`);
				}
			};
			
			const canvas = webgpuContext.canvas;
			const currentExecId = executionId;
			
			// カスタムrequestAnimationFrame
			const customRequestAnimationFrame = (callback: FrameRequestCallback) => {
				// 実行IDが異なる場合は何もしない
				if (currentExecId !== currentExecutionId) {
					return 0;
				}
				
				const frameId = requestAnimationFrame((time) => {
					// 再度実行IDをチェック
					if (currentExecId === currentExecutionId) {
						callback(time);
					}
				});
				activeAnimationFrame = frameId;
				return frameId;
			};
			
			// カスタムsetTimeout
			const customSetTimeout = (callback: Function, delay: number) => {
				const timeoutId = setTimeout(() => {
					if (currentExecId === currentExecutionId) {
						callback();
					}
				}, delay);
				activeTimeouts.push(timeoutId);
				return timeoutId;
			};
			
			// リソーストラッキング用の配列にリソースを追加
			const trackResource = (resource: any) => {
				if (resource && currentExecId === currentExecutionId) {
					createdResources.push(resource);
				}
				return resource;
			};
			
			// キャンバスのプロキシを作成して、既に設定されたコンテキストを返す
			const canvasProxy = new Proxy(canvas, {
				get(target, prop) {
					if (prop === 'getContext') {
						return (contextType: string) => {
							if (contextType === 'webgpu') {
								// 既に設定済みのコンテキストを返す（runCode 冒頭で null チェック済み）
								return webgpuContext!.context;
							}
							return target.getContext(contextType);
						};
					}
					const value = target[prop as keyof HTMLCanvasElement];
					if (typeof value === 'function') {
						return value.bind(target);
					}
					return value;
				},
				set(target, prop, value) {
					// 読み取り専用プロパティを除外
					const readOnlyProps = ['offsetHeight', 'offsetLeft', 'offsetParent', 'offsetTop', 'offsetWidth', 
						'ownerDocument', 'parentElement', 'parentNode', 'previousElementSibling', 'previousSibling',
						'nextElementSibling', 'nextSibling', 'nodeType', 'nodeName', 'nodeValue', 'baseURI',
						'childNodes', 'firstChild', 'lastChild', 'clientHeight', 'clientLeft', 'clientTop', 'clientWidth',
						'scrollHeight', 'scrollWidth', 'shadowRoot', 'tagName', 'namespaceURI', 'prefix', 'localName',
						'isConnected', 'childElementCount', 'children', 'firstElementChild', 'lastElementChild'];
					
					if (readOnlyProps.includes(prop as string)) {
						return true; // 読み取り専用プロパティは無視
					}
					
					try {
						(target as any)[prop] = value;
						return true;
					} catch (e) {
						// エラーが発生した場合は無視
						return true;
					}
				}
			});
			
			// navigatorオブジェクトのプロキシを作成
			const navigatorProxy = new Proxy(navigator, {
				get(target, prop) {
					if (prop === 'gpu' && navigator.gpu) {
						return {
							requestAdapter: async (options?: GPURequestAdapterOptions) => {
								// 実行IDが異なる場合はエラー
								if (currentExecId !== currentExecutionId) {
									throw new Error('チュートリアルが変更されました。');
								}
								
								// webgpuContextがnullでないことを確認
								if (!webgpuContext) {
									throw new Error('WebGPUコンテキストが初期化されていません');
								}
								// アダプターのプロキシを返す
								return new Proxy(webgpuContext.adapter, {
									get(target, prop) {
										if (prop === 'requestDevice') {
											return async () => {
												// 既存のデバイスを返す
												return webgpuContext!.device;
											};
										}
										return target[prop as keyof GPUAdapter];
									}
								});
							},
							getPreferredCanvasFormat: () => webgpuContext?.format || 'bgra8unorm'
						};
					}
					// その他のプロパティはバインドして返す
					const value = target[prop as keyof Navigator];
					if (typeof value === 'function') {
						return value.bind(target);
					}
					return value;
				}
			});
			
			const executionEnv = {
				console: customConsole,
				canvas: canvasProxy,
				navigator: navigatorProxy,
				document: {
					querySelector: (selector: string) => {
						if (selector === 'canvas') {
							return canvasProxy;
						}
						return null;
					}
				},
				window: new Proxy(window, {
					get(target, prop) {
						if (prop === 'requestAnimationFrame') {
							return customRequestAnimationFrame;
						}
						if (prop === 'setTimeout') {
							return customSetTimeout;
						}
						const value = target[prop as keyof Window];
						if (typeof value === 'function') {
							return value.bind(target);
						}
						return value;
					}
				}),
				requestAnimationFrame: customRequestAnimationFrame,
				setTimeout: customSetTimeout,
				// WebGPU関連のヘルパー
				gpu: webgpuContext,
				device: webgpuContext.device,
				adapter: webgpuContext.adapter,
				canvasContext: webgpuContext.context,
				context: webgpuContext.context,
				format: webgpuContext.format,
				// シェーダーコードへのアクセス
				vertexShaderCode: $editorState.vertexShader,
				fragmentShaderCode: $editorState.fragmentShader,
				// ヘルパー関数
				createShaderModule,
				// エラーハンドリング用の関数
				checkGPUError: async () => {
					if (!webgpuContext) return null;
					const device = webgpuContext.device;
					device.pushErrorScope('validation');
					device.pushErrorScope('out-of-memory');
					
					// 少し待機してエラーを収集
					await new Promise(resolve => setTimeout(resolve, 0));
					
					const validationError = await device.popErrorScope();
					const oomError = await device.popErrorScope();
					
					if (validationError) {
						customConsole.error(`GPU検証エラー: ${validationError.message}`);
					}
					if (oomError) {
						customConsole.error(`GPUメモリ不足エラー: ${oomError.message}`);
					}
					
					return !validationError && !oomError;
				}
			};
			
			const code = $editorState.javascript;
			
			
			// コードの前処理 - 基本的なシンタックスチェック
			checkSyntax(code);

			// executionEnv をスコープ変数兼 this として渡して実行
			await executeUserCode(code, executionEnv, { improveStack: true });
			
			// 最終的なGPUエラーチェック
			await executionEnv.checkGPUError();
			
			if (executionId === currentExecutionId) {
				consoleMessages.log('実行が完了しました');
				executionState.update(state => ({
					...state,
					isRunning: false,
					lastRunTime: new Date()
				}));
				
			}
		} catch (error) {
			if (executionId === currentExecutionId) {
				
				let errorMessage = '不明なエラー';
				let errorDetails = '';
				
				if (error instanceof Error) {
					errorMessage = error.message;
				} else if (typeof error === 'string') {
					errorMessage = error;
				} else if (error && typeof error === 'object' && 'message' in error) {
					errorMessage = String(error.message);
				}
				
				if (error instanceof Error) {
					
					// チュートリアル変更エラーの特別処理
					if (errorMessage.includes('チュートリアルが変更されました')) {
						errorDetails = '別のチュートリアルに移動したため、実行が中断されました。もう一度実行ボタンをクリックしてください。';
						consoleMessages.warn('ヒント: 新しいチュートリアルで実行する場合は、もう一度実行ボタンをクリックしてください。');
					}
					// WebGPU固有のエラーを検出して、より分かりやすいメッセージを提供
					else if (errorMessage.includes('requestAdapter')) {
						errorDetails = 'WebGPUアダプターの取得に失敗しました。ブラウザがWebGPUをサポートしているか確認してください。';
					} else if (errorMessage.includes('requestDevice')) {
						errorDetails = 'WebGPUデバイスの取得に失敗しました。GPUドライバーが最新か確認してください。';
					} else if (errorMessage.includes('createShaderModule')) {
						errorDetails = 'シェーダーのコンパイルに失敗しました。WGSLシンタックスを確認してください。';
					} else if (errorMessage.includes('createBuffer')) {
						errorDetails = 'バッファーの作成に失敗しました。サイズとusageフラグを確認してください。';
					} else if (errorMessage.includes('createTexture')) {
						errorDetails = 'テクスチャの作成に失敗しました。フォーマットとサイズを確認してください。';
					} else if (errorMessage.includes('createRenderPipeline') || errorMessage.includes('createComputePipeline')) {
						errorDetails = 'パイプラインの作成に失敗しました。シェーダーとバインドグループレイアウトの互換性を確認してください。';
					}
					
					// スタックトレースから行番号を抽出
					if (error.stack) {
						const lineMatch = error.stack.match(/<anonymous>:(\d+):(\d+)/);
						if (lineMatch) {
							errorDetails += `\nエラー位置: 行 ${lineMatch[1]}, 列 ${lineMatch[2]}`;
						}
					}
				}
				
				consoleMessages.error(`実行エラー: ${errorMessage}`);
				if (errorDetails) {
					consoleMessages.error(errorDetails);
				}
				
				executionState.update(state => ({
					...state,
					isRunning: false,
					error: errorMessage
				}));
			}
		}
	}
	
	// コードをリセット
	function resetCode() {
		if (example) {
			const resetCode = example.initialCode || example.code;
			if (resetCode) {
				// 空のシェーダーコードを最小限のテンプレートで置き換え
				const processedCode = {
					javascript: resetCode.javascript || '',
					vertexShader: resetCode.vertexShader || minimalVertexShader,
					fragmentShader: resetCode.fragmentShader || minimalFragmentShader
				};
				loadCode(processedCode);
				consoleMessages.clear();
				consoleMessages.info(m.tutorial_detail_msg_reset());
				showSolution = false;
			}
		}
	}
	
	// 解答の表示切り替え
	function toggleSolution() {
		if (example && example.initialCode) {
			showSolution = !showSolution;
			const codeToLoad = showSolution ? example.code : example.initialCode;
			if (codeToLoad) {
				// 空のシェーダーコードを最小限のテンプレートで置き換え
				const processedCode = {
					javascript: codeToLoad.javascript || '',
					vertexShader: codeToLoad.vertexShader || minimalVertexShader,
					fragmentShader: codeToLoad.fragmentShader || minimalFragmentShader
				};
				loadCode(processedCode);
				consoleMessages.info(showSolution ? m.tutorial_detail_msg_showing_solution() : m.tutorial_detail_msg_back_to_problem());
			}
		}
	}
	
	// 完了をマーク
	function markAsCompleted() {
		if (chapterId && exampleId) {
			progress.markCompleted(chapterId, exampleId);
			consoleMessages.info(m.tutorial_detail_msg_marked_complete());
		}
	}
	
	// 次の単元へ遷移
	function navigateToNextExample() {
		if (chapterId && exampleId) {
			const next = getNextExample(chapterId, exampleId);
			if (next) {
				// スクロール位置をトップに戻す
				window.scrollTo(0, 0);
				goto(localizeHref(`/tutorial/${next.chapterId}/${next.exampleId}`));
			} else {
				// 最後の単元の場合は、チュートリアルトップに戻る
				window.scrollTo(0, 0);
				goto(localizeHref('/tutorial'));
			}
		}
	}
	
	// navigate-next-exampleイベントのリスナーを設定
	onMount(() => {
		const handleNavigateNext = () => navigateToNextExample();
		window.addEventListener('navigate-next-example', handleNavigateNext);
		
		return () => {
			window.removeEventListener('navigate-next-example', handleNavigateNext);
		};
	});
	
	// ナビゲーション後にスクロール位置をリセット
	afterNavigate(() => {
		window.scrollTo(0, 0);
	});
	
	// コンポーネント破棄時のクリーンアップ
	onDestroy(() => {
		// アニメーションフレームのキャンセル
		if (activeAnimationFrame !== null) {
			cancelAnimationFrame(activeAnimationFrame);
		}
		
		// タイムアウトのクリア
		activeTimeouts.forEach(id => clearTimeout(id));
		
		// WebGPUリソースのクリーンアップ
		cleanupWebGPUResources();
		
		// 実行状態のリセット
		executionState.update(state => ({
			...state,
			isRunning: false,
			error: null
		}));
		
	});
</script>

<svelte:head>
	<title>{m.tutorial_detail_title_template({ title: example?.title || m.tutorial_detail_title_fallback() })}</title>
</svelte:head>

{#if !chapter || !example}
	<div class="flex items-center justify-center h-full">
		<div class="text-center">
			<h2 class="text-2xl font-bold text-gray-600 dark:text-gray-400">
				{m.tutorial_detail_not_found()}
			</h2>
			<a href={localizeHref('/tutorial')} class="mt-4 inline-block text-gpu-blue hover:underline">
				{m.tutorial_detail_not_found_link()}
			</a>
		</div>
	</div>
{:else}
	<div class="tutorial-example-layout">
		<!-- ヘッダー -->
		<div class="tutorial-header">
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
					{chapter.title}
				</div>
				<h1 class="text-2xl font-bold">{example.title}</h1>
				<p class="text-gray-600 dark:text-gray-400 mt-2">
					{example.description}
				</p>
			</div>
			
			<div class="flex items-center gap-4">
				<button
					onclick={markAsCompleted}
					class="btn-secondary text-sm"
				>
					{m.tutorial_detail_mark_done_short()}
				</button>
				{#if nextExample && nextExampleInfo}
					<button
						onclick={navigateToNextExample}
						class="btn-primary text-sm flex items-center gap-2"
						title={m.tutorial_detail_next_unit_title({ title: nextExampleInfo.title })}
					>
						{m.tutorial_detail_next_unit()}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
		
		<!-- メインコンテンツ -->
		<div class="tutorial-main">
			<!-- 左側: 学習コンテンツ -->
			<div class="tutorial-left">
				<!-- ビューモード切り替え -->
				<div class="view-mode-tabs">
					{#if example.steps}
						<button
							class="view-mode-tab"
							class:active={viewMode === 'learn'}
							onclick={() => viewMode = 'learn'}
						>
							{m.tutorial_detail_view_learn()}
						</button>
					{/if}
					<button
						class="view-mode-tab"
						class:active={viewMode === 'code'}
						onclick={() => viewMode = 'code'}
					>
						{m.tutorial_detail_view_code()}
					</button>
				</div>
				
				<!-- コンテンツエリア -->
				<div class="content-area">
					{#if viewMode === 'learn' && example.steps}
						<TutorialSteps 
							steps={example.steps}
							bind:currentStep
							chapterId={chapterId}
							exampleId={exampleId}
							class="h-full overflow-y-auto"
						/>
					{:else}
						<!-- コードエディタ -->
						<div class="code-editor-container">
							<!-- エディタタブ -->
							<div class="editor-tabs">
								<button
									class="editor-tab"
									class:active={activeTab === 'javascript'}
									onclick={() => activeTab = 'javascript'}
								>
									JavaScript
								</button>
								{#if example.code?.vertexShader}
									<button
										class="editor-tab"
										class:active={activeTab === 'vertex'}
										onclick={() => activeTab = 'vertex'}
									>
										{m.playground_tab_vertex()}
									</button>
								{/if}
								{#if example.code?.fragmentShader}
									<button
										class="editor-tab"
										class:active={activeTab === 'fragment'}
										onclick={() => activeTab = 'fragment'}
									>
										{m.playground_tab_fragment()}
									</button>
								{/if}
							</div>
							
							<!-- エディタ -->
							<div class="editor-container" class:typing-mode={typingMode}>
								{#if showSolution}
									<div class="solution-banner">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span>{m.tutorial_detail_solution_active()}</span>
									</div>
								{/if}
								
								{#if typingMode && example.code}
									<!-- 写経モード時の解答表示 -->
									<div class="typing-solution">
										<div class="typing-solution-header">
											<span class="text-sm font-medium text-gray-700 dark:text-gray-100">{m.tutorial_detail_typing_solution_label()}</span>
											<button
												onclick={() => typingMode = false}
												class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
											>
												{m.tutorial_detail_typing_exit()}
											</button>
										</div>
										<div class="typing-solution-code">
											<pre><code>{activeTab === 'javascript' ? example.code.javascript :
												activeTab === 'vertex' ? example.code.vertexShader :
												example.code.fragmentShader}</code></pre>
										</div>
									</div>
								{/if}
								{#if activeTab === 'javascript'}
									<MonacoEditor
										bind:code={$editorState.javascript}
										language="javascript"
										height="100%"
									/>
								{:else if activeTab === 'vertex'}
									<MonacoEditor
										bind:code={$editorState.vertexShader}
										language="wgsl"
										height="100%"
									/>
								{:else if activeTab === 'fragment'}
									<MonacoEditor
										bind:code={$editorState.fragmentShader}
										language="wgsl"
										height="100%"
									/>
								{/if}
							</div>
							
							<!-- コントロール -->
							<div class="editor-controls">
								<button
									onclick={runCode}
									disabled={$executionState.isRunning}
									class="btn-primary flex items-center gap-2"
								>
									{#if $executionState.isRunning}
										<div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
										{m.tutorial_detail_running()}
									{:else}
										{m.tutorial_detail_run_button()}
									{/if}
								</button>

								<button
									onclick={resetCode}
									class="btn-secondary"
								>
									{m.tutorial_detail_reset_button()}
								</button>

								{#if example.code}
									<button
										onclick={() => typingMode = !typingMode}
										class="btn-secondary flex items-center gap-2"
										title={m.tutorial_detail_typing_title()}
									>
										{#if typingMode}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
											{m.tutorial_detail_typing_on()}
										{:else}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
											</svg>
											{m.tutorial_detail_typing_off()}
										{/if}
									</button>
								{/if}

								{#if example.initialCode}
									<button
										onclick={toggleSolution}
										class="btn-secondary flex items-center gap-2 {showSolution ? 'btn-solution-active' : ''}"
									>
										{#if showSolution}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
											</svg>
											{m.tutorial_detail_solution_back()}
										{:else}
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l2 2 4-4M9 11l2 2 4-4m0 6l-8 8-4-4 1.5-1.5L5 14l6.5 6.5z" />
											</svg>
											{m.tutorial_detail_solution_show()}
										{/if}
									</button>
								{/if}
							</div>
						</div>
						
						<!-- チャレンジ -->
						{#if example.challenges && viewMode === 'code'}
							<div class="challenges-section">
								<h3 class="text-lg font-semibold mb-4">{m.tutorial_detail_challenges_title()}</h3>
								<div class="space-y-3">
									{#each example.challenges as challenge, i}
										<div class="challenge-card">
											<h4 class="font-medium mb-1">{i + 1}. {challenge.title}</h4>
											<p class="text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
											{#if challenge.hint}
												<details class="mt-2">
													<summary class="cursor-pointer text-sm text-gpu-blue">{m.tutorial_detail_challenges_hint()}</summary>
													<p class="mt-1 text-sm pl-4">{challenge.hint}</p>
												</details>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
			
			<!-- 右側: プレビューとコンソール -->
			<div class="tutorial-right">
				<div class="preview-canvas">
					<WebGPUCanvas
						bind:this={canvasComponent}
						onContextReady={handleContextReady}
						width={600}
						height={400}
						class="max-w-full max-h-full"
					/>
				</div>
				
				<div class="preview-console">
					<ConsoleOutput
						messages={$consoleMessages}
						onClear={() => consoleMessages.clear()}
						height="100%"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.tutorial-example-layout {
		@apply flex flex-col h-full;
	}
	
	.tutorial-header {
		@apply px-6 py-4 border-b border-[var(--color-border)] flex items-start justify-between;
		flex-shrink: 0;
	}
	
	.tutorial-main {
		@apply flex flex-1 min-h-0;
	}
	
	.tutorial-left {
		@apply flex-1 flex flex-col border-r border-[var(--color-border)];
	}
	
	.view-mode-tabs {
		@apply flex border-b border-[var(--color-border)] px-4;
		flex-shrink: 0;
		background-color: rgb(249 250 251);
	}
	
	:global(.dark) .view-mode-tabs {
		background-color: rgb(17 24 39 / 0.5);
	}
	
	.view-mode-tab {
		@apply px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
	}
	
	.view-mode-tab.active {
		@apply text-gpu-blue border-gpu-blue;
	}
	
	.content-area {
		@apply flex-1 flex flex-col overflow-hidden;
	}
	
	.code-editor-container {
		@apply flex flex-col h-full;
	}
	
	.editor-tabs {
		@apply flex border-b border-[var(--color-border)] px-4;
		flex-shrink: 0;
	}
	
	.editor-tab {
		@apply px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
	}
	
	.editor-tab.active {
		@apply text-gpu-blue border-gpu-blue;
	}
	
	.editor-container {
		@apply flex-1 overflow-hidden;
		position: relative;
	}
	
	.editor-container.typing-mode {
		@apply flex flex-col;
	}
	
	.typing-solution {
		@apply border-b border-[var(--color-border)];
		max-height: 40%;
		overflow-y: auto;
		flex-shrink: 0;
		background-color: rgb(249 250 251);
	}
	
	:global(.dark) .typing-solution {
		background-color: rgb(31 41 55 / 0.7);
	}
	
	.typing-solution-header {
		@apply px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between;
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: rgb(243 244 246);
	}
	
	:global(.dark) .typing-solution-header {
		background-color: rgb(31 41 55);
	}
	
	.typing-solution-code {
		@apply px-4 py-3 text-sm;
	}
	
	.typing-solution-code pre {
		@apply m-0 font-mono text-xs leading-relaxed;
		white-space: pre-wrap;
		word-wrap: break-word;
	}
	
	.typing-solution-code pre code {
		color: rgb(31 41 55) !important;
		opacity: 0.9;
	}
	
	:global(.dark) .typing-solution-code pre code {
		color: rgb(243 244 246) !important;
	}
	
	.solution-banner {
		@apply absolute top-2 right-2 z-10 px-3 py-1 bg-green-500 text-white text-sm rounded-lg flex items-center gap-2 shadow-lg;
	}
	
	.editor-controls {
		@apply px-4 py-3 border-t border-[var(--color-border)] flex gap-3;
		flex-shrink: 0;
	}
	
	.btn-solution-active {
		@apply bg-green-500 text-white hover:bg-green-600;
		@apply border-green-500;
	}
	
	.challenges-section {
		@apply p-4 border-t border-[var(--color-border)];
		max-height: 200px;
		overflow-y: auto;
		background-color: rgb(249 250 251);
	}
	
	:global(.dark) .challenges-section {
		background-color: rgb(17 24 39 / 0.5);
	}
	
	.challenge-card {
		@apply p-3 rounded-lg border border-gray-200 dark:border-gray-700;
		background-color: rgb(255 255 255);
	}
	
	:global(.dark) .challenge-card {
		background-color: rgb(31 41 55);
	}
	
	.tutorial-right {
		@apply w-[640px] flex flex-col;
	}
	
	.preview-canvas {
		@apply p-4;
		height: calc(100% - 256px);
		overflow: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgb(249 250 251);
	}
	
	:global(.dark) .preview-canvas {
		background-color: rgb(17 24 39 / 0.5);
	}
	
	.preview-console {
		@apply border-t border-[var(--color-border)];
		height: 256px;
		flex-shrink: 0;
	}
	
	/* レスポンシブ対応 */
	@media (max-width: 1024px) {
		.tutorial-main {
			@apply flex-col;
		}
		
		.tutorial-left {
			@apply border-r-0 border-b h-96;
		}
		
		.tutorial-right {
			@apply w-full;
		}
	}
</style>