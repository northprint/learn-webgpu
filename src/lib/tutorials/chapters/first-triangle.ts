import type { TutorialChapter } from '$lib/webgpu/types';

export const firstTriangleChapter: TutorialChapter = {
	id: 'first-triangle',
	title: '基礎編: 最初の三角形',
	description: 'WebGPUで三角形を描画する基本的な手順を学びます',
	examples: [
		{
			id: 'basic-triangle',
			title: '基本的な三角形の描画',
			description: '頂点シェーダーとフラグメントシェーダーを使った描画',
			steps: [
				{
					title: 'シェーダーの基礎',
					content: `WebGPUでは、描画処理をGPU上で実行するためにシェーダーを使用します。

**主なシェーダーの種類：**
- **頂点シェーダー**: 各頂点の位置を計算
- **フラグメントシェーダー**: 各ピクセルの色を計算

**WGSL（WebGPU Shading Language）**
WebGPU専用のシェーディング言語で、Rustに似た構文を持ちます。`,
					task: '頂点シェーダーで三角形の頂点位置を定義しましょう。'
				},
				{
					title: 'レンダーパイプライン',
					content: `レンダーパイプラインは、描画処理の設定をまとめたものです。

**パイプラインに含まれる設定：**
- シェーダーモジュール
- 頂点バッファのレイアウト
- プリミティブの種類（三角形、線など）
- カラーフォーマット

**重要な概念：**
パイプラインは一度作成すると変更できません（イミュータブル）。`,
					task: 'レンダーパイプラインを作成し、シェーダーを設定しましょう。'
				},
				{
					title: 'レンダリングコマンド',
					content: `WebGPUでは、コマンドエンコーダーを使ってGPUへの命令を記録します。

**レンダリングの流れ：**
1. コマンドエンコーダーの作成
2. レンダーパスの開始
3. パイプラインの設定
4. 描画コマンドの発行
5. レンダーパスの終了
6. コマンドバッファの提出`,
					task: '描画コマンドを実行して三角形を表示しましょう。',
					hint: 'draw()メソッドで頂点数を指定します。'
				}
			],
			initialCode: {
				javascript: `// 最初の三角形を描画
async function drawTriangle() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({
    device: device,
    format: canvasFormat,
  });
  
  // シェーダーコード
  const shaderCode = \`
    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
      // TODO: 頂点位置を定義
      var pos = array<vec2f, 3>(
        vec2f(0.0, 0.0),
        vec2f(0.0, 0.0),
        vec2f(0.0, 0.0)
      );
      
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }
    
    @fragment
    fn fs_main() -> @location(0) vec4f {
      // TODO: フラグメントの色を返す
      return vec4f(0.0, 0.0, 0.0, 1.0);
    }
  \`;
  
  // TODO: シェーダーモジュールを作成
  
  
  // TODO: レンダーパイプラインを作成
  
  
  // TODO: レンダリングコマンドを実行
  
}

drawTriangle().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// 最初の三角形を描画
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// シェーダーコード
const shaderCode = \`
  @vertex
  fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
    // 頂点位置を定義（正三角形）
    var pos = array<vec2f, 3>(
      vec2f( 0.0,  0.5),  // 上
      vec2f(-0.5, -0.5),  // 左下
      vec2f( 0.5, -0.5)   // 右下
    );
    
    return vec4f(pos[vertexIndex], 0.0, 1.0);
  }
  
  @fragment
  fn fs_main() -> @location(0) vec4f {
    // 赤色を返す
    return vec4f(1.0, 0.0, 0.0, 1.0);
  }
\`;

// シェーダーモジュールを作成
const shaderModule = device.createShaderModule({
  label: 'Triangle shader',
  code: shaderCode
});

// レンダーパイプラインを作成
const pipeline = device.createRenderPipeline({
  label: 'Triangle pipeline',
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main'
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{
      format: format
    }]
  },
  primitive: {
    topology: 'triangle-list'
  }
});

// レンダリングコマンドを実行
const encoder = device.createCommandEncoder();

const pass = encoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    clearValue: { r: 0.0, g: 0.2, b: 0.4, a: 1.0 },
    loadOp: 'clear',
    storeOp: 'store'
  }]
});

pass.setPipeline(pipeline);
pass.draw(3); // 3頂点を描画
pass.end();

device.queue.submit([encoder.finish()]);

console.log('三角形の描画が完了しました');`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: 'カラフルな三角形',
					description: '各頂点に異なる色を設定して、グラデーションのある三角形を作成しましょう。',
					hint: '頂点シェーダーから色情報を渡し、フラグメントシェーダーで補間された色を使用します。'
				},
				{
					title: '複数の三角形',
					description: '画面に3つの三角形を異なる位置に描画してみましょう。',
					hint: '頂点データを拡張して、draw()の頂点数を増やします。'
				}
			]
		},
		{
			id: 'colored-triangle',
			title: 'カラフルな三角形',
			description: '頂点カラーと補間を理解する',
			steps: [
				{
					title: '頂点属性の追加',
					content: `頂点には位置以外の情報も持たせることができます。

**頂点属性の例：**
- 位置（position）
- 色（color）
- テクスチャ座標（uv）
- 法線（normal）

**シェーダー間のデータの受け渡し：**
\`@location\`属性を使って、頂点シェーダーからフラグメントシェーダーへデータを渡します。`,
					task: '頂点シェーダーに色属性を追加しましょう。'
				},
				{
					title: '補間の仕組み',
					content: `GPUは頂点間の値を自動的に補間します。

**補間の種類：**
- **perspective**: 遠近法を考慮した補間（デフォルト）
- **linear**: 線形補間
- **flat**: 補間なし（最初の頂点の値を使用）

この補間により、頂点カラーがスムーズなグラデーションになります。`,
					task: '各頂点に異なる色を設定して、補間を確認しましょう。'
				}
			],
			initialCode: {
				javascript: `// カラフルな三角形
async function colorfulTriangle() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  const shaderCode = \`
    struct VertexOutput {
      @builtin(position) position: vec4f,
      // TODO: 色情報を追加
    };
    
    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      
      // 頂点位置
      var positions = array<vec2f, 3>(
        vec2f( 0.0,  0.5),
        vec2f(-0.5, -0.5),
        vec2f( 0.5, -0.5)
      );
      
      // TODO: 各頂点の色を定義
      
      
      output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
      // TODO: 色を出力に設定
      
      return output;
    }
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      // TODO: 補間された色を使用
      return vec4f(0.0, 0.0, 0.0, 1.0);
    }
  \`;
  
  // TODO: パイプラインの作成と描画
  
}

colorfulTriangle().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// カラフルな三角形
// チュートリアル環境では device, context, canvas, format が既に利用可能です

const shaderCode = \`
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
  };
  
  @vertex
  fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;
    
    // 頂点位置
    var positions = array<vec2f, 3>(
      vec2f( 0.0,  0.5),
      vec2f(-0.5, -0.5),
      vec2f( 0.5, -0.5)
    );
    
    // 各頂点の色（RGB）
    var colors = array<vec3f, 3>(
      vec3f(1.0, 0.0, 0.0),  // 赤
      vec3f(0.0, 1.0, 0.0),  // 緑
      vec3f(0.0, 0.0, 1.0)   // 青
    );
    
    output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
    output.color = colors[vertexIndex];
    
    return output;
  }
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    // 補間された色を使用
    return vec4f(input.color, 1.0);
  }
\`;

// シェーダーモジュール
const shaderModule = device.createShaderModule({
  label: 'Colored triangle shader',
  code: shaderCode
});

// パイプライン
const pipeline = device.createRenderPipeline({
  label: 'Colored triangle pipeline',
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main'
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{
      format: format
    }]
  },
  primitive: {
    topology: 'triangle-list'
  }
});

// 描画
const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    clearValue: { r: 0.0, g: 0.2, b: 0.4, a: 1.0 },
    loadOp: 'clear',
    storeOp: 'store'
  }]
});

pass.setPipeline(pipeline);
pass.draw(3);
pass.end();

device.queue.submit([encoder.finish()]);

console.log('カラフルな三角形を描画しました');`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: 'HSVカラー',
					description: 'HSV色空間を使って、虹色のグラデーションを作成してみましょう。',
					hint: 'フラグメントシェーダーでHSVからRGBへの変換を実装します。'
				},
				{
					title: 'アニメーション',
					description: '色が時間とともに変化するアニメーションを追加しましょう。',
					hint: 'ユニフォームバッファを使って時間を渡します。'
				}
			]
		}
	]
};