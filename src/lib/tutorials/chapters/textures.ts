import type { TutorialChapter } from '$lib/webgpu/types';

export const texturesChapter: TutorialChapter = {
	id: 'textures',
	title: '応用編: テクスチャとサンプリング',
	description: '画像データの扱い方とテクスチャマッピングを学びます',
	examples: [
		{
			id: 'basic-texture',
			title: '基本的なテクスチャマッピング',
			description: '画像をポリゴンに貼り付ける',
			steps: [
				{
					title: 'テクスチャの基礎',
					content: `テクスチャは、GPU上の画像データです。

**テクスチャの用途：**
- 画像の表示
- 法線マップ
- 深度マップ
- レンダーターゲット

**重要な概念：**
- **UV座標**: テクスチャ上の位置（0.0〜1.0）
- **サンプラー**: テクスチャの読み取り方法を定義
- **ミップマップ**: 異なる解像度のテクスチャ`,
					task: 'テクスチャを作成し、画像データを読み込みましょう。'
				},
				{
					title: 'サンプラーの設定',
					content: `サンプラーは、テクスチャの読み取り方法を制御します。

**フィルタリング：**
- **nearest**: 最近傍補間（ピクセルアート向け）
- **linear**: 線形補間（スムーズな画像向け）

**アドレッシングモード：**
- **clamp-to-edge**: 端でクランプ
- **repeat**: 繰り返し
- **mirror-repeat**: 鏡像繰り返し`,
					task: '異なるサンプラー設定を試してみましょう。',
					hint: 'UV座標を1.0以上にしてアドレッシングモードの違いを確認できます。'
				},
				{
					title: 'テクスチャ座標',
					content: `UV座標は、テクスチャ上の位置を指定します。

**座標系：**
- U（横）: 0.0（左）〜 1.0（右）
- V（縦）: 0.0（上）〜 1.0（下）

**注意**: WebGPUではY軸が下向きです（OpenGLとは逆）。`,
					task: 'UV座標を調整して、テクスチャの一部だけを表示してみましょう。'
				}
			],
			initialCode: {
				javascript: `// 基本的なテクスチャマッピング
async function basicTexture() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // 頂点データ（位置とUV座標）
  const vertices = new Float32Array([
    // x,    y,   u,   v
    -0.5, -0.5, 0.0, 1.0,  // 左下
     0.5, -0.5, 1.0, 1.0,  // 右下
     0.5,  0.5, 1.0, 0.0,  // 右上
    -0.5,  0.5, 0.0, 0.0,  // 左上
  ]);
  
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  
  // TODO: テクスチャを作成
  
  
  // TODO: 画像データを生成またはロード
  
  
  // TODO: サンプラーを作成
  
  
  const shaderCode = \`
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
    };
    
    @vertex
    fn vs_main(
      @location(0) position: vec2f,
      @location(1) uv: vec2f
    ) -> VertexOutput {
      var output: VertexOutput;
      output.position = vec4f(position, 0.0, 1.0);
      output.uv = uv;
      return output;
    }
    
    @group(0) @binding(0) var mySampler: sampler;
    @group(0) @binding(1) var myTexture: texture_2d<f32>;
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      // TODO: テクスチャをサンプリング
      return vec4f(1.0, 0.0, 0.0, 1.0);
    }
  \`;
  
  // TODO: パイプラインとバインドグループを作成
  
}

basicTexture().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// 基本的なテクスチャマッピング
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// 頂点データ（位置とUV座標）
const vertices = new Float32Array([
  // x,    y,   u,   v
  -0.8, -0.8, 0.0, 1.0,  // 左下
   0.8, -0.8, 1.0, 1.0,  // 右下
   0.8,  0.8, 1.0, 0.0,  // 右上
  -0.8,  0.8, 0.0, 0.0,  // 左上
]);

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

// バッファの作成
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
const indexBuffer = device.createBuffer({
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);
device.queue.writeBuffer(indexBuffer, 0, indices);

// チェッカーボードテクスチャを生成
const textureSize = 256;
const textureData = new Uint8Array(textureSize * textureSize * 4);

for (let y = 0; y < textureSize; y++) {
  for (let x = 0; x < textureSize; x++) {
    const i = (y * textureSize + x) * 4;
    const checker = ((x / 32) ^ (y / 32)) & 1;
    
    textureData[i + 0] = checker ? 255 : 0;      // R
    textureData[i + 1] = checker ? 255 : 0;      // G
    textureData[i + 2] = checker ? 255 : 0;      // B
    textureData[i + 3] = 255;                    // A
  }
}

// テクスチャを作成
const texture = device.createTexture({
  size: [textureSize, textureSize],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});

// テクスチャにデータを書き込む
device.queue.writeTexture(
  { texture },
  textureData,
  { bytesPerRow: textureSize * 4, rowsPerImage: textureSize },
  { width: textureSize, height: textureSize }
);

// サンプラーを作成
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
  addressModeU: 'repeat',
  addressModeV: 'repeat',
});

const shaderCode = \`
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
  };
  
  @vertex
  fn vs_main(
    @location(0) position: vec2f,
    @location(1) uv: vec2f
  ) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f(position, 0.0, 1.0);
    output.uv = uv;
    return output;
  }
  
  @group(0) @binding(0) var mySampler: sampler;
  @group(0) @binding(1) var myTexture: texture_2d<f32>;
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    return textureSample(myTexture, mySampler, input.uv);
  }
\`;

// シェーダーモジュール
const shaderModule = device.createShaderModule({
  code: shaderCode
});

// バインドグループレイアウト
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: { type: 'filtering' }
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: 'float' }
    }
  ]
});

// バインドグループ
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    { binding: 0, resource: sampler },
    { binding: 1, resource: texture.createView() }
  ]
});

// パイプライン
const pipeline = device.createRenderPipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  }),
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
    buffers: [{
      arrayStride: 16,  // 4 floats × 4 bytes
      attributes: [
        { format: 'float32x2', offset: 0, shaderLocation: 0 },  // position
        { format: 'float32x2', offset: 8, shaderLocation: 1 }   // uv
      ]
    }]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{ format: format }]
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
pass.setBindGroup(0, bindGroup);
pass.setVertexBuffer(0, vertexBuffer);
pass.setIndexBuffer(indexBuffer, 'uint16');
pass.drawIndexed(6);
pass.end();

device.queue.submit([encoder.finish()]);

console.log('テクスチャマッピングが完了しました');`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: 'グラデーションテクスチャ',
					description: '虹色のグラデーションテクスチャを生成してみましょう。',
					hint: 'HSVからRGBへの変換を使用します。'
				},
				{
					title: 'テクスチャアニメーション',
					description: 'UV座標を時間で変化させて、テクスチャをスクロールさせましょう。',
					hint: 'ユニフォームバッファで時間を渡します。'
				}
			]
		},
		{
			id: 'multiple-textures',
			title: '複数テクスチャの合成',
			description: 'テクスチャをブレンドして高度な表現を実現',
			steps: [
				{
					title: '複数テクスチャの使用',
					content: `複数のテクスチャを組み合わせることで、より豊かな表現が可能になります。

**一般的な用途：**
- ディフューズマップ + 法線マップ
- カラーテクスチャ + マスクテクスチャ
- ベーステクスチャ + デカールテクスチャ

**注意点：**
バインディング数には制限があります（通常は最低16個）。`,
					task: '2つのテクスチャを用意しましょう。'
				},
				{
					title: 'テクスチャのブレンド',
					content: `シェーダー内でテクスチャをブレンドする方法はいくつかあります。

**ブレンドモード：**
- **加算**: color1 + color2
- **乗算**: color1 * color2
- **線形補間**: mix(color1, color2, factor)
- **スクリーン**: 1 - (1 - color1) * (1 - color2)`,
					task: '異なるブレンドモードを実装してみましょう。',
					hint: 'mix()関数を使うと簡単に補間できます。'
				}
			],
			initialCode: {
				javascript: `// 複数テクスチャの合成
async function multipleTextures() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // TODO: 2つのテクスチャを作成
  
  
  const shaderCode = \`
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
    };
    
    @group(0) @binding(0) var mySampler: sampler;
    @group(0) @binding(1) var texture1: texture_2d<f32>;
    @group(0) @binding(2) var texture2: texture_2d<f32>;
    
    @vertex
    fn vs_main(
      @location(0) position: vec2f,
      @location(1) uv: vec2f
    ) -> VertexOutput {
      var output: VertexOutput;
      output.position = vec4f(position, 0.0, 1.0);
      output.uv = uv;
      return output;
    }
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      // TODO: 2つのテクスチャをサンプリングしてブレンド
      return vec4f(1.0);
    }
  \`;
  
  // TODO: パイプラインの作成と描画
  
}

multipleTextures().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// 複数テクスチャの合成
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// 頂点データ
const vertices = new Float32Array([
  -0.8, -0.8, 0.0, 1.0,
   0.8, -0.8, 1.0, 1.0,
   0.8,  0.8, 1.0, 0.0,
  -0.8,  0.8, 0.0, 0.0,
]);
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

// バッファ
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
const indexBuffer = device.createBuffer({
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);
device.queue.writeBuffer(indexBuffer, 0, indices);

// テクスチャサイズ
const textureSize = 256;

// テクスチャ1: カラフルなパターン
const texture1Data = new Uint8Array(textureSize * textureSize * 4);
for (let y = 0; y < textureSize; y++) {
  for (let x = 0; x < textureSize; x++) {
    const i = (y * textureSize + x) * 4;
    texture1Data[i + 0] = (x / textureSize * 255) | 0;      // R
    texture1Data[i + 1] = (y / textureSize * 255) | 0;      // G
    texture1Data[i + 2] = 128;                               // B
    texture1Data[i + 3] = 255;                               // A
  }
}

// テクスチャ2: 円形マスク
const texture2Data = new Uint8Array(textureSize * textureSize * 4);
const center = textureSize / 2;
const radius = textureSize / 3;

for (let y = 0; y < textureSize; y++) {
  for (let x = 0; x < textureSize; x++) {
    const i = (y * textureSize + x) * 4;
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const mask = distance < radius ? 255 : 0;
    
    texture2Data[i + 0] = mask;
    texture2Data[i + 1] = mask;
    texture2Data[i + 2] = mask;
    texture2Data[i + 3] = 255;
  }
}

// テクスチャを作成
const texture1 = device.createTexture({
  size: [textureSize, textureSize],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});

const texture2 = device.createTexture({
  size: [textureSize, textureSize],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});

// データを書き込む
device.queue.writeTexture(
  { texture: texture1 },
  texture1Data,
  { bytesPerRow: textureSize * 4 },
  { width: textureSize, height: textureSize }
);

device.queue.writeTexture(
  { texture: texture2 },
  texture2Data,
  { bytesPerRow: textureSize * 4 },
  { width: textureSize, height: textureSize }
);

// サンプラー
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
});

// ユニフォームバッファ（ブレンドファクター）
const uniformBuffer = device.createBuffer({
  size: 16,  // vec4のサイズ
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// ブレンドファクターを設定
const blendFactor = 0.5;
device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([blendFactor, 0, 0, 0]));

const shaderCode = \`
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
  };
  
  struct Uniforms {
    blendFactor: f32,
  };
  
  @group(0) @binding(0) var mySampler: sampler;
  @group(0) @binding(1) var texture1: texture_2d<f32>;
  @group(0) @binding(2) var texture2: texture_2d<f32>;
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;
  
  @vertex
  fn vs_main(
    @location(0) position: vec2f,
    @location(1) uv: vec2f
  ) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f(position, 0.0, 1.0);
    output.uv = uv;
    return output;
  }
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    let color1 = textureSample(texture1, mySampler, input.uv);
    let color2 = textureSample(texture2, mySampler, input.uv);
    
    // マスクとして texture2 を使用
    let maskedColor = color1 * color2;
    
    // オリジナルとマスク済みをブレンド
    let finalColor = mix(color1, maskedColor, uniforms.blendFactor);
    
    return vec4f(finalColor.rgb, 1.0);
  }
\`;

// シェーダーモジュール
const shaderModule = device.createShaderModule({
  code: shaderCode
});

// バインドグループレイアウト
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
    { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }
  ]
});

// バインドグループ
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    { binding: 0, resource: sampler },
    { binding: 1, resource: texture1.createView() },
    { binding: 2, resource: texture2.createView() },
    { binding: 3, resource: { buffer: uniformBuffer } }
  ]
});

// パイプライン
const pipeline = device.createRenderPipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  }),
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
    buffers: [{
      arrayStride: 16,
      attributes: [
        { format: 'float32x2', offset: 0, shaderLocation: 0 },
        { format: 'float32x2', offset: 8, shaderLocation: 1 }
      ]
    }]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{ format: format }]
  },
  primitive: {
    topology: 'triangle-list'
  }
});

// アニメーション
let time = 0;
function frame() {
  time += 0.01;
  
  // ブレンドファクターをアニメーション
  const blendFactor = Math.sin(time) * 0.5 + 0.5;
  device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([blendFactor, 0, 0, 0]));
  
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
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint16');
  pass.drawIndexed(6);
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
					title: 'トリプルブレンド',
					description: '3つのテクスチャを使って、より複雑なブレンドを実現しましょう。',
					hint: '3つ目のテクスチャをブレンド係数として使用できます。'
				},
				{
					title: 'ノーマルマッピング',
					description: '法線マップを使って、凹凸のあるような見た目を作りましょう。',
					hint: '法線マップのRGB値を法線ベクトルに変換します。'
				}
			]
		}
	]
};