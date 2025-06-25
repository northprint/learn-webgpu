import type { TutorialChapter } from '$lib/webgpu/types';

export const buffersAndUniformsChapter: TutorialChapter = {
	id: 'buffers-uniforms',
	title: '基礎編: バッファとユニフォーム',
	description: 'GPUメモリの管理とデータの受け渡しを学びます',
	examples: [
		{
			id: 'vertex-buffers',
			title: '頂点バッファの使用',
			description: 'GPUメモリに頂点データを格納する',
			steps: [
				{
					title: 'バッファの基礎',
					content: `バッファはGPUメモリ上のデータ領域です。

**バッファの用途：**
- **VERTEX**: 頂点データの格納
- **INDEX**: インデックスデータの格納
- **UNIFORM**: ユニフォームデータの格納
- **STORAGE**: 汎用ストレージ

**バッファの作成手順：**
1. バッファを作成（サイズと用途を指定）
2. データを書き込む
3. パイプラインで使用`,
					task: '頂点バッファを作成して、三角形の頂点データを格納しましょう。'
				},
				{
					title: '頂点レイアウトの定義',
					content: `頂点レイアウトは、バッファ内のデータ構造を定義します。

**レイアウトの要素：**
- **arrayStride**: 各頂点のバイト数
- **attributes**: 各属性の情報
  - format: データ型（float32x3など）
  - offset: バッファ内のオフセット
  - shaderLocation: シェーダーでの場所

**重要**: データの配置はメモリアライメントを考慮する必要があります。`,
					task: '位置と色を含む頂点レイアウトを定義しましょう。',
					hint: 'float32x3は12バイト、float32x4は16バイトです。'
				},
				{
					title: 'インデックスバッファ',
					content: `インデックスバッファを使用すると、頂点の再利用が可能になります。

**メリット：**
- メモリ使用量の削減
- GPUの頂点キャッシュ効率の向上

**例：四角形の描画**
- 頂点バッファのみ: 6頂点（2つの三角形）
- インデックスバッファ使用: 4頂点 + 6インデックス`,
					task: 'インデックスバッファを使って四角形を効率的に描画しましょう。'
				}
			],
			initialCode: {
				javascript: `// 頂点バッファの使用
async function vertexBuffers() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // 頂点データ（位置と色）
  const vertices = new Float32Array([
    // TODO: 頂点データを定義（位置x,y,z、色r,g,b）
    
  ]);
  
  // TODO: 頂点バッファを作成
  
  
  // TODO: データをバッファに書き込む
  
  
  const shaderCode = \`
    struct VertexInput {
      @location(0) position: vec3f,
      @location(1) color: vec3f,
    };
    
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) color: vec3f,
    };
    
    @vertex
    fn vs_main(input: VertexInput) -> VertexOutput {
      var output: VertexOutput;
      output.position = vec4f(input.position, 1.0);
      output.color = input.color;
      return output;
    }
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      return vec4f(input.color, 1.0);
    }
  \`;
  
  // TODO: シェーダーモジュールとパイプラインを作成
  
  
  // TODO: 描画コマンドを実行
  
}

vertexBuffers().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// 頂点バッファの使用
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// 頂点データ（位置と色）
const vertices = new Float32Array([
  // x,    y,    z,   r,   g,   b
  -0.5, -0.5,  0.0, 1.0, 0.0, 0.0,  // 左下（赤）
   0.5, -0.5,  0.0, 0.0, 1.0, 0.0,  // 右下（緑）
   0.5,  0.5,  0.0, 0.0, 0.0, 1.0,  // 右上（青）
  -0.5,  0.5,  0.0, 1.0, 1.0, 0.0,  // 左上（黄）
]);

// インデックスデータ（2つの三角形で四角形を作る）
const indices = new Uint16Array([
  0, 1, 2,  // 最初の三角形
  0, 2, 3   // 2番目の三角形
]);

// 頂点バッファを作成
const vertexBuffer = device.createBuffer({
  label: 'Vertex buffer',
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

// インデックスバッファを作成
const indexBuffer = device.createBuffer({
  label: 'Index buffer',
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

// データをバッファに書き込む
device.queue.writeBuffer(vertexBuffer, 0, vertices);
device.queue.writeBuffer(indexBuffer, 0, indices);

const shaderCode = \`
  struct VertexInput {
    @location(0) position: vec3f,
    @location(1) color: vec3f,
  };
  
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
  };
  
  @vertex
  fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f(input.position, 1.0);
    output.color = input.color;
    return output;
  }
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    return vec4f(input.color, 1.0);
  }
\`;

// シェーダーモジュール
const shaderModule = device.createShaderModule({
  label: 'Vertex color shader',
  code: shaderCode
});

// パイプライン
const pipeline = device.createRenderPipeline({
  label: 'Vertex buffer pipeline',
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
    buffers: [{
      arrayStride: 24,  // 6 floats × 4 bytes
      attributes: [
        {
          // position
          format: 'float32x3',
          offset: 0,
          shaderLocation: 0,
        },
        {
          // color
          format: 'float32x3',
          offset: 12,  // 3 floats × 4 bytes
          shaderLocation: 1,
        }
      ]
    }]
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
pass.setVertexBuffer(0, vertexBuffer);
pass.setIndexBuffer(indexBuffer, 'uint16');
pass.drawIndexed(6);  // 6個のインデックスを描画
pass.end();

device.queue.submit([encoder.finish()]);

console.log('頂点バッファを使った描画が完了しました');`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: '立方体の描画',
					description: '8頂点と36インデックスを使って立方体を描画しましょう。',
					hint: '各面は2つの三角形で構成されます。'
				},
				{
					title: '頂点属性の追加',
					description: 'UV座標を追加して、市松模様を描画してみましょう。',
					hint: '頂点レイアウトに新しい属性を追加します。'
				}
			]
		},
		{
			id: 'uniforms',
			title: 'ユニフォームの使用',
			description: '全体で共有されるデータの管理',
			steps: [
				{
					title: 'ユニフォームとは',
					content: `ユニフォームは、すべての頂点やフラグメントで共通のデータです。

**典型的な用途：**
- 変換行列（MVP行列）
- 時間
- 画面サイズ
- ライトの位置

**特徴：**
- 描画中は変更不可
- すべてのシェーダーインスタンスで同じ値`,
					task: 'ユニフォームバッファを作成しましょう。'
				},
				{
					title: 'バインドグループ',
					content: `バインドグループは、リソース（バッファやテクスチャ）をシェーダーに結びつけます。

**バインドグループの構成：**
- レイアウト: リソースの型と配置を定義
- エントリ: 実際のリソースの割り当て

**重要**: バインドグループはパイプラインのレイアウトと一致する必要があります。`,
					task: 'ユニフォームバッファをバインドグループに設定しましょう。',
					hint: '@group(0) @binding(0)でシェーダー内の位置を指定します。'
				},
				{
					title: '動的な更新',
					content: `ユニフォームを更新することで、アニメーションを実現できます。

**更新の流れ：**
1. 新しい値を計算
2. writeBuffer()でGPUメモリを更新
3. 再描画

**注意点：**
- 頻繁な更新はパフォーマンスに影響
- 適切なタイミングで更新することが重要`,
					task: '時間経過で回転する三角形を作成しましょう。'
				}
			],
			initialCode: {
				javascript: `// ユニフォームの使用
async function uniforms() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // ユニフォームデータの構造
  const uniformData = new Float32Array([
    // TODO: 変換行列や時間などのデータ
    1.0, 0.0, 0.0, 0.0,  // 仮の値
  ]);
  
  // TODO: ユニフォームバッファを作成
  
  
  const shaderCode = \`
    struct Uniforms {
      // TODO: ユニフォームの構造を定義
      time: f32,
    };
    
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    
    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
      // TODO: ユニフォームを使った頂点変換
      var pos = array<vec2f, 3>(
        vec2f( 0.0,  0.5),
        vec2f(-0.5, -0.5),
        vec2f( 0.5, -0.5)
      );
      
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }
    
    @fragment
    fn fs_main() -> @location(0) vec4f {
      return vec4f(1.0, 0.0, 0.0, 1.0);
    }
  \`;
  
  // TODO: バインドグループレイアウトとバインドグループを作成
  
  
  // TODO: アニメーションループを実装
  
}

uniforms().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// ユニフォームの使用
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// ユニフォームバッファのサイズ（16バイトアライメント）
const uniformBufferSize = 64;
const uniformBuffer = device.createBuffer({
  label: 'Uniform buffer',
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const shaderCode = \`
  struct Uniforms {
    time: f32,
    resolution: vec2f,
    padding: f32,  // 16バイトアライメントのためのパディング
  };
  
  @group(0) @binding(0) var<uniform> uniforms: Uniforms;
  
  @vertex
  fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
    var pos = array<vec2f, 3>(
      vec2f( 0.0,  0.5),
      vec2f(-0.5, -0.5),
      vec2f( 0.5, -0.5)
    );
    
    // 時間に基づいて回転
    let angle = uniforms.time;
    let c = cos(angle);
    let s = sin(angle);
    
    let rotatedPos = vec2f(
      pos[vertexIndex].x * c - pos[vertexIndex].y * s,
      pos[vertexIndex].x * s + pos[vertexIndex].y * c
    );
    
    return vec4f(rotatedPos, 0.0, 1.0);
  }
  
  @fragment
  fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
    // 画面座標を正規化
    let uv = fragCoord.xy / uniforms.resolution;
    
    // 時間で変化する色
    let r = sin(uniforms.time) * 0.5 + 0.5;
    let g = sin(uniforms.time + 2.0) * 0.5 + 0.5;
    let b = sin(uniforms.time + 4.0) * 0.5 + 0.5;
    
    return vec4f(r, g, b, 1.0);
  }
\`;

// シェーダーモジュール
const shaderModule = device.createShaderModule({
  label: 'Uniform shader',
  code: shaderCode
});

// バインドグループレイアウト
const bindGroupLayout = device.createBindGroupLayout({
  label: 'Bind group layout',
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    buffer: { type: 'uniform' }
  }]
});

// バインドグループ
const bindGroup = device.createBindGroup({
  label: 'Bind group',
  layout: bindGroupLayout,
  entries: [{
    binding: 0,
    resource: { buffer: uniformBuffer }
  }]
});

// パイプライン
const pipeline = device.createRenderPipeline({
  label: 'Uniform pipeline',
  layout: device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  }),
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

// アニメーションループ
let startTime = Date.now();

function frame() {
  // 経過時間を計算
  const now = Date.now();
  const time = (now - startTime) / 1000.0;
  
  // ユニフォームデータを更新
  const uniformData = new Float32Array([
    time,
    canvas.width,
    canvas.height,
    0  // パディング
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  
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
  pass.setBindGroup(0, bindGroup);
  pass.draw(3);
  pass.end();
  
  device.queue.submit([encoder.finish()]);
  
  requestAnimationFrame(frame);
}

frame();`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: 'マウス追従',
					description: 'マウスの位置を追いかける図形を作成しましょう。',
					hint: 'マウス座標をユニフォームとして渡します。'
				},
				{
					title: '複数のユニフォーム',
					description: '複数の変換行列を使って、異なる動きをする図形を描画しましょう。',
					hint: '複数のバインディングを使用します。'
				}
			]
		}
	]
};