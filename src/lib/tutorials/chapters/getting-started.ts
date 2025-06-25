import type { TutorialChapter } from '$lib/webgpu/types';

export const gettingStartedChapter: TutorialChapter = {
	id: 'getting-started',
	title: '基礎編: WebGPUの基本概念とセットアップ',
	description: 'WebGPUの基本概念を理解し、開発環境をセットアップします',
	examples: [
		{
			id: 'webgpu-init',
			title: 'WebGPUの初期化',
			description: 'WebGPUアダプターとデバイスの取得方法を学びます',
			steps: [
				{
					title: 'WebGPUの基本概念',
					content: `WebGPUは、Webブラウザで高性能なグラフィックスと計算を実現するための新しいAPIです。

**主要な概念：**
- **Adapter（アダプター）**: GPUハードウェアへのアクセスを表します
- **Device（デバイス）**: GPUとの通信インターフェースです
- **Queue（キュー）**: GPUへのコマンド送信を管理します

まずは、WebGPUが使用可能かチェックしましょう。`,
					task: 'コンソールに「WebGPUの初期化に成功しました！」と表示されるまで、コードを実行してみましょう。'
				},
				{
					title: 'アダプターの取得',
					content: `\`navigator.gpu.requestAdapter()\`を使用してGPUアダプターを取得します。

オプションで以下を指定できます：
- \`powerPreference\`: 'low-power' または 'high-performance'
- \`forceFallbackAdapter\`: ソフトウェア実装を強制`,
					task: 'コードを修正して、高性能モードでアダプターを取得してみましょう。',
					hint: 'requestAdapter()に{ powerPreference: "high-performance" }を渡します。'
				},
				{
					title: 'デバイスの作成',
					content: `アダプターから\`requestDevice()\`でデバイスを作成します。

デバイスは実際のGPU操作に使用されます：
- バッファーの作成
- テクスチャの作成
- シェーダーのコンパイル
- レンダリングパイプラインの作成`,
					task: 'デバイスが正常に作成されたことを確認し、デバイスの機能を調べてみましょう。'
				}
			],
			initialCode: {
				javascript: `// WebGPUの初期化を始めましょう！
async function initWebGPU() {
  // TODO: WebGPUのサポートをチェック
  // ヒント: navigator.gpu が存在するか確認します
  
  
  // TODO: アダプターを取得
  // ヒント: navigator.gpu.requestAdapter() を使用します
  
  
  // TODO: デバイスを取得
  // ヒント: adapter.requestDevice() を使用します
  
  
  console.log('初期化を完了してください...');
  
  // TODO: 取得したアダプターとデバイスを返す
}

// 実行
initWebGPU().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// WebGPUの初期化
async function initWebGPU() {
  // WebGPUがサポートされているか確認
  if (!navigator.gpu) {
    throw new Error('WebGPUはこのブラウザでサポートされていません');
  }
  
  // アダプターを取得
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPUアダプターが見つかりません');
  }
  
  // デバイスを取得
  const device = await adapter.requestDevice();
  
  console.log('WebGPUの初期化に成功しました！');
  console.log('アダプター情報:', adapter);
  console.log('デバイス情報:', device);
  
  return { adapter, device };
}

// 実行
initWebGPU().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			}
		},
		{
			id: 'canvas-setup',
			title: 'キャンバスのセットアップ',
			description: 'WebGPUでキャンバスに描画する準備を行います',
			steps: [
				{
					title: 'キャンバスコンテキストの取得',
					content: `WebGPUで描画するには、キャンバスのWebGPUコンテキストを取得する必要があります。

**手順：**
1. HTMLキャンバス要素を取得
2. \`getContext('webgpu')\`でコンテキストを取得
3. デバイスとフォーマットを設定`,
					task: 'キャンバスのWebGPUコンテキストを取得しましょう。'
				},
				{
					title: 'スワップチェーンの設定',
					content: `スワップチェーンは、画面に表示するテクスチャを管理します。

**設定項目：**
- \`device\`: 使用するGPUデバイス
- \`format\`: テクスチャフォーマット（通常は'bgra8unorm'）
- \`usage\`: テクスチャの使用方法`,
					task: 'キャンバスコンテキストを設定して、背景色をクリアしてみましょう。',
					hint: 'context.configure()を使用します。'
				},
				{
					title: '最初の描画',
					content: `コマンドエンコーダーを使用して、描画コマンドを記録します。

**基本的な流れ：**
1. コマンドエンコーダーを作成
2. レンダーパスを開始
3. 描画コマンドを記録
4. コマンドバッファーを送信`,
					task: '背景を青色でクリアしてみましょう。'
				}
			],
			initialCode: {
				javascript: `// キャンバスのセットアップ
async function setupCanvas() {
  // WebGPUの初期化
  const { adapter, device } = await initWebGPU();
  
  // TODO: キャンバス要素を取得
  // ヒント: document.querySelector('canvas') を使用
  
  
  // TODO: WebGPUコンテキストを取得
  // ヒント: canvas.getContext('webgpu') を使用
  
  
  // TODO: 推奨フォーマットを取得
  // ヒント: navigator.gpu.getPreferredCanvasFormat() を使用
  
  
  // TODO: コンテキストを設定
  // ヒント: context.configure({ device, format }) を使用
  
  
  console.log('キャンバスの設定を完了してください...');
}

// WebGPUの初期化（前の例から）
async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPUはこのブラウザでサポートされていません');
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPUアダプターが見つかりません');
  }
  const device = await adapter.requestDevice();
  return { adapter, device };
}

// 実行
setupCanvas().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// キャンバスのセットアップと最初の描画
async function setupCanvas() {
  // WebGPUの初期化
  const { adapter, device } = await initWebGPU();
  
  // キャンバス要素を取得
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    throw new Error('キャンバス要素が見つかりません');
  }
  
  // WebGPUコンテキストを取得
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new Error('WebGPUコンテキストを取得できません');
  }
  
  // 推奨フォーマットを取得
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  // コンテキストを設定
  context.configure({
    device: device,
    format: canvasFormat,
  });
  
  // 背景をクリア
  const encoder = device.createCommandEncoder();
  
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.0, g: 0.2, b: 0.4, a: 1.0 }, // 青色
      loadOp: 'clear',
      storeOp: 'store',
    }]
  });
  
  pass.end();
  device.queue.submit([encoder.finish()]);
  
  console.log('キャンバスのセットアップが完了しました！');
}

// WebGPUの初期化（前の例から）
async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPUはこのブラウザでサポートされていません');
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPUアダプターが見つかりません');
  }
  const device = await adapter.requestDevice();
  return { adapter, device };
}

// 実行
setupCanvas().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: '異なる背景色',
					description: '背景を異なる色（例：赤、緑、黄色）に変更してみましょう。',
					hint: 'clearValueのr, g, b値を変更します。'
				},
				{
					title: 'アニメーション',
					description: '時間とともに背景色が変化するアニメーションを作成してみましょう。',
					hint: 'requestAnimationFrame()を使用して、フレームごとに色を更新します。'
				}
			]
		}
	]
};