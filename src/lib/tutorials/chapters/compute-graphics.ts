import type { TutorialChapter } from '$lib/webgpu/types';

// パーティクル数の定数
const NUM_PARTICLES = 5000;

export const computeGraphicsChapter: TutorialChapter = {
	id: 'compute-graphics',
	title: '応用編: コンピュートシェーダーと連携',
	description: 'GPGPUとグラフィックスの組み合わせを学びます',
	examples: [
		{
			id: 'particle-system',
			title: 'パーティクルシステム',
			description: 'コンピュートシェーダーでパーティクルを更新',
			steps: [
				{
					title: 'コンピュートシェーダーの基礎',
					content: `コンピュートシェーダーは、描画以外の汎用計算を行います。

**特徴：**
- 並列処理に最適化
- 大量のデータ処理が得意
- グラフィックスパイプラインとは独立

**ワークグループ：**
- 複数のスレッドをグループ化
- グループ内でメモリ共有可能
- 3次元のサイズを指定可能`,
					task: 'コンピュートシェーダーでパーティクルの位置を更新しましょう。'
				},
				{
					title: 'ストレージバッファ',
					content: `ストレージバッファは、読み書き可能な大容量バッファです。

**特徴：**
- 大きなサイズ（最低128MB）
- 読み書き両方可能
- 構造体の配列を格納可能

**用途：**
- パーティクルデータ
- 物理シミュレーション
- 画像処理の中間データ`,
					task: 'パーティクルデータをストレージバッファに格納しましょう。',
					hint: 'read_writeアクセスモードを使用します。'
				},
				{
					title: 'グラフィックスとの連携',
					content: `同じバッファをコンピュートとグラフィックスで共有できます。

**パイプライン：**
1. コンピュートシェーダーでデータ更新
2. 同じバッファを頂点バッファとして使用
3. グラフィックスパイプラインで描画

**注意点：**
バッファの用途フラグを適切に設定する必要があります。`,
					task: '更新されたパーティクルを描画しましょう。'
				}
			],
			initialCode: {
				javascript: `// パーティクルシステム
async function particleSystem() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  const numParticles = 1000;
  
  // パーティクルデータの初期化
  const particleData = new Float32Array(numParticles * 4); // x, y, vx, vy
  for (let i = 0; i < numParticles; i++) {
    // TODO: ランダムな初期位置と速度を設定
    
  }
  
  // TODO: ストレージバッファを作成
  
  
  // コンピュートシェーダー
  const computeShaderCode = \`
    struct Particle {
      position: vec2f,
      velocity: vec2f,
    };
    
    @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
    
    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3u) {
      // TODO: パーティクルの位置を更新
      
    }
  \`;
  
  // レンダリングシェーダー
  const renderShaderCode = \`
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) color: vec4f,
    };
    
    @vertex
    fn vs_main(@location(0) position: vec2f) -> VertexOutput {
      var output: VertexOutput;
      // TODO: パーティクルを点として描画
      output.position = vec4f(position, 0.0, 1.0);
      output.color = vec4f(1.0, 1.0, 1.0, 1.0);
      return output;
    }
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      return input.color;
    }
  \`;
  
  // TODO: パイプラインの作成とアニメーションループ
  
}

particleSystem().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// パーティクルシステム
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// メイン関数
(async function() {
const numParticles = 5000;

// パーティクルデータの初期化
const particleData = new Float32Array(numParticles * 4); // x, y, vx, vy
for (let i = 0; i < numParticles; i++) {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.002 + 0.001;
  
  particleData[i * 4 + 0] = 0;  // x position
  particleData[i * 4 + 1] = 0;  // y position
  particleData[i * 4 + 2] = Math.cos(angle) * speed;  // x velocity
  particleData[i * 4 + 3] = Math.sin(angle) * speed;  // y velocity
}

// ストレージバッファを作成（コンピュートと頂点の両方で使用）
const particleBuffer = device.createBuffer({
  size: particleData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(particleBuffer, 0, particleData);

// ユニフォームバッファ（デルタタイムなど）
const uniformBuffer = device.createBuffer({
  size: 16,  // vec4
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// コンピュートシェーダー
const computeShaderCode = \`
  struct Particle {
    position: vec2f,
    velocity: vec2f,
  };
  
  struct Uniforms {
    deltaTime: f32,
    time: f32,
  };
  
  @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
  @group(0) @binding(1) var<uniform> uniforms: Uniforms;
  
  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    let index = id.x;
    if (index >= \` + numParticles + \`u) {
      return;
    }
    
    var particle = particles[index];
    
    // 重力の影響（より弱く）
    particle.velocity.y -= 0.00002 * uniforms.deltaTime;
    
    // 位置を更新（より遅く）
    particle.position += particle.velocity * uniforms.deltaTime * 0.2;
    
    // 画面端で跳ね返る
    if (abs(particle.position.x) > 1.0) {
      particle.velocity.x *= -0.8;
      particle.position.x = clamp(particle.position.x, -1.0, 1.0);
    }
    if (abs(particle.position.y) > 1.0) {
      particle.velocity.y *= -0.8;
      particle.position.y = clamp(particle.position.y, -1.0, 1.0);
    }
    
    // 下端で少し跳ねる
    if (particle.position.y < -0.9) {
      particle.velocity.y = abs(particle.velocity.y) * 0.8;
    }
    
    particles[index] = particle;
  }
\`;

// レンダリングシェーダー
const renderShaderCode = \`
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
  };
  
  @vertex
  fn vs_main(
    @location(0) position: vec2f,
    @location(1) velocity: vec2f,
    @builtin(vertex_index) vertexIndex: u32
  ) -> VertexOutput {
    var output: VertexOutput;
    
    // 小さな四角形として描画（６頂点で二つの三角形）
    let size = 0.003;
    var offset = vec2f(0.0, 0.0);
    
    if (vertexIndex == 0u || vertexIndex == 3u) { offset = vec2f(-size, -size); }
    else if (vertexIndex == 1u) { offset = vec2f(size, -size); }
    else if (vertexIndex == 2u || vertexIndex == 4u) { offset = vec2f(size, size); }
    else { offset = vec2f(-size, size); }
    
    output.position = vec4f(position + offset, 0.0, 1.0);
    
    // 速度に基づいて色を変える
    let speed = length(velocity) * 100.0;
    output.color = vec4f(
      1.0 - speed,
      0.5 + speed * 0.5,
      speed,
      1.0
    );
    
    return output;
  }
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    // 単純にカラーを返す（パーティクルは既に小さな点なので）
    return input.color;
  }
\`;

// シェーダーモジュール
console.log('Creating compute shader module...');
device.pushErrorScope('validation');
const computeShaderModule = device.createShaderModule({
  code: computeShaderCode,
  label: 'compute shader'
});
device.popErrorScope().then(error => {
  if (error) console.error('Compute shader error:', error.message);
});

console.log('Creating render shader module...');
device.pushErrorScope('validation');
const renderShaderModule = device.createShaderModule({
  code: renderShaderCode,
  label: 'render shader'
});
device.popErrorScope().then(error => {
  if (error) console.error('Render shader error:', error.message);
});

// バインドグループレイアウト（コンピュート用）
const computeBindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
  ]
});

// バインドグループ
const computeBindGroup = device.createBindGroup({
  layout: computeBindGroupLayout,
  entries: [
    { binding: 0, resource: { buffer: particleBuffer } },
    { binding: 1, resource: { buffer: uniformBuffer } }
  ]
});

// コンピュートパイプライン
const computePipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [computeBindGroupLayout]
  }),
  compute: {
    module: computeShaderModule,
    entryPoint: 'main'
  }
});

// レンダーパイプライン
console.log('Creating render pipeline...');
let renderPipeline;
try {
  renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: renderShaderModule,
      entryPoint: 'vs_main',
      buffers: [{
        arrayStride: 16,  // 4 floats
        stepMode: 'instance',
        attributes: [
          { format: 'float32x2', offset: 0, shaderLocation: 0 },  // position
          { format: 'float32x2', offset: 8, shaderLocation: 1 }   // velocity
        ]
      }]
    },
    fragment: {
      module: renderShaderModule,
      entryPoint: 'fs_main',
      targets: [{ 
        format: format,
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add'
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add'
          }
        }
      }]
    },
    primitive: {
      topology: 'triangle-list'
    }
  });
  console.log('Render pipeline created successfully');
} catch (error) {
  console.error('Failed to create render pipeline:', error);
  throw error;
}

// アニメーションループ
let lastTime = Date.now();
console.log('Starting particle animation with', numParticles, 'particles');

async function frame() {
  const now = Date.now();
  const deltaTime = Math.min(now - lastTime, 100);  // 最大100ms
  lastTime = now;
  
  // ユニフォームを更新
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    new Float32Array([deltaTime, now / 1000, 0, 0])
  );
  
  const encoder = device.createCommandEncoder();
  
  // コンピュートパス
  const computePass = encoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeBindGroup);
  computePass.dispatchWorkgroups(Math.ceil(numParticles / 64));
  computePass.end();
  
  // レンダーパス
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
      loadOp: 'clear',
      storeOp: 'store'
    }]
  });
  
  renderPass.setPipeline(renderPipeline);
  renderPass.setVertexBuffer(0, particleBuffer);
  renderPass.draw(6, numParticles);  // 6頂点（二つの三角形）をnumParticles回インスタンス描画
  renderPass.end();
  
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(frame);
}

frame();
})().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: '引力シミュレーション',
					description: 'マウスの位置に向かってパーティクルが引き寄せられるようにしましょう。',
					hint: 'マウス座標をユニフォームとして渡し、引力を計算します。'
				},
				{
					title: 'パーティクルの軌跡',
					description: 'パーティクルが通った軌跡を残すエフェクトを追加しましょう。',
					hint: 'フレームバッファをクリアせずに、少し暗くしていきます。'
				}
			]
		},
		{
			id: 'image-processing',
			title: '画像処理フィルター',
			description: 'コンピュートシェーダーで高速な画像処理',
			steps: [
				{
					title: '画像処理の基礎',
					content: `コンピュートシェーダーは、画像処理に最適です。

**メリット：**
- ピクセル単位の並列処理
- 複雑なフィルターも高速
- 複数パスの処理が簡単

**一般的なフィルター：**
- ぼかし（ガウシアンブラー）
- エッジ検出（Sobel）
- 色調補正`,
					task: 'テクスチャをストレージとして使用できるようにしましょう。'
				},
				{
					title: 'カーネルフィルター',
					content: `カーネル（畳み込み）フィルターは、周囲のピクセルを考慮します。

**3x3カーネルの例：**
\`\`\`
[1 2 1]
[2 4 2] × 1/16  （ガウシアンブラー）
[1 2 1]
\`\`\`

**実装のポイント：**
- 境界処理に注意
- ワークグループでの最適化`,
					task: 'ガウシアンブラーを実装してみましょう。',
					hint: 'textureLoad()で隣接ピクセルを読み取ります。'
				}
			],
			initialCode: {
				javascript: `// 画像処理フィルター
async function imageProcessing() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // TODO: 入力画像テクスチャを作成
  
  
  // TODO: 出力用テクスチャを作成（ストレージ）
  
  
  const computeShaderCode = \`
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    
    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3u) {
      let dimensions = textureDimensions(inputTexture);
      if (id.x >= dimensions.x || id.y >= dimensions.y) {
        return;
      }
      
      // TODO: フィルター処理を実装
      let color = textureLoad(inputTexture, id.xy, 0);
      
      textureStore(outputTexture, id.xy, color);
    }
  \`;
  
  // TODO: パイプラインの作成と実行
  
}

imageProcessing().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// 画像処理フィルター
// チュートリアル環境では device, context, canvas, format が既に利用可能です

const textureSize = 512;

// ノイズパターンを生成（入力画像として使用）
const inputData = new Uint8Array(textureSize * textureSize * 4);
for (let i = 0; i < inputData.length; i += 4) {
  const noise = Math.random();
  inputData[i + 0] = noise * 255;
  inputData[i + 1] = noise * 255;
  inputData[i + 2] = noise * 255;
  inputData[i + 3] = 255;
}

// 入力テクスチャ
const inputTexture = device.createTexture({
  size: [textureSize, textureSize],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});

device.queue.writeTexture(
  { texture: inputTexture },
  inputData,
  { bytesPerRow: textureSize * 4 },
  { width: textureSize, height: textureSize }
);

// 出力テクスチャ（ストレージ）
const outputTexture = device.createTexture({
  size: [textureSize, textureSize],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
});

// フィルター選択用ユニフォーム
const uniformBuffer = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// コンピュートシェーダー（複数のフィルター）
const computeShaderCode = \`
  struct Uniforms {
    filterType: u32,
    strength: f32,
  };
  
  @group(0) @binding(0) var inputTexture: texture_2d<f32>;
  @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
  @group(0) @binding(2) var<uniform> uniforms: Uniforms;
  
  // ガウシアンブラーカーネル
  fn gaussianBlur(id: vec2u) -> vec4f {
    var color = vec4f(0.0);
    let kernel = array<f32, 9>(
      1.0, 2.0, 1.0,
      2.0, 4.0, 2.0,
      1.0, 2.0, 1.0
    );
    let kernelSum = 16.0;
    
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let samplePos = vec2i(id) + vec2i(x, y);
        let kernelIndex = (y + 1) * 3 + (x + 1);
        color += textureLoad(inputTexture, samplePos, 0) * kernel[kernelIndex];
      }
    }
    
    return color / kernelSum;
  }
  
  // エッジ検出（Sobelフィルター）
  fn edgeDetection(id: vec2u) -> vec4f {
    let sobelX = array<f32, 9>(
      -1.0, 0.0, 1.0,
      -2.0, 0.0, 2.0,
      -1.0, 0.0, 1.0
    );
    
    let sobelY = array<f32, 9>(
      -1.0, -2.0, -1.0,
       0.0,  0.0,  0.0,
       1.0,  2.0,  1.0
    );
    
    var gx = vec4f(0.0);
    var gy = vec4f(0.0);
    
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let samplePos = vec2i(id) + vec2i(x, y);
        let color = textureLoad(inputTexture, samplePos, 0);
        let kernelIndex = (y + 1) * 3 + (x + 1);
        
        gx += color * sobelX[kernelIndex];
        gy += color * sobelY[kernelIndex];
      }
    }
    
    let edge = sqrt(gx * gx + gy * gy);
    return vec4f(edge.rgb * uniforms.strength, 1.0);
  }
  
  // シャープネス
  fn sharpen(id: vec2u) -> vec4f {
    let kernel = array<f32, 9>(
       0.0, -1.0,  0.0,
      -1.0,  5.0, -1.0,
       0.0, -1.0,  0.0
    );
    
    var color = vec4f(0.0);
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let samplePos = vec2i(id) + vec2i(x, y);
        let kernelIndex = (y + 1) * 3 + (x + 1);
        color += textureLoad(inputTexture, samplePos, 0) * kernel[kernelIndex];
      }
    }
    
    let original = textureLoad(inputTexture, id, 0);
    return mix(original, color, uniforms.strength);
  }
  
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    let dimensions = textureDimensions(inputTexture);
    if (id.x >= dimensions.x || id.y >= dimensions.y) {
      return;
    }
    
    var outputColor: vec4f;
    
    switch (uniforms.filterType) {
      case 0u: {
        // パススルー
        outputColor = textureLoad(inputTexture, id.xy, 0);
      }
      case 1u: {
        // ガウシアンブラー
        outputColor = gaussianBlur(id.xy);
      }
      case 2u: {
        // エッジ検出
        outputColor = edgeDetection(id.xy);
      }
      case 3u: {
        // シャープネス
        outputColor = sharpen(id.xy);
      }
      default: {
        outputColor = vec4f(1.0, 0.0, 1.0, 1.0); // エラー色
      }
    }
    
    textureStore(outputTexture, id.xy, outputColor);
  }
\`;

// レンダリングシェーダー（結果を表示）
const renderShaderCode = \`
  @group(0) @binding(0) var mySampler: sampler;
  @group(0) @binding(1) var myTexture: texture_2d<f32>;
  
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
  };
  
  @vertex
  fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;
    
    // フルスクリーン三角形
    let x = f32((vertexIndex << 1) & 2) * 2.0 - 1.0;
    let y = f32(vertexIndex & 2) * 2.0 - 1.0;
    
    output.position = vec4f(x, y, 0.0, 1.0);
    output.uv = vec2f((x + 1.0) * 0.5, (1.0 - y) * 0.5);
    
    return output;
  }
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    return textureSample(myTexture, mySampler, input.uv);
  }
\`;

// シェーダーモジュール
const computeShaderModule = device.createShaderModule({
  code: computeShaderCode
});

const renderShaderModule = device.createShaderModule({
  code: renderShaderCode
});

// バインドグループレイアウト
const computeBindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
  ]
});

const renderBindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } }
  ]
});

// サンプラー
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
});

// バインドグループ
const computeBindGroup = device.createBindGroup({
  layout: computeBindGroupLayout,
  entries: [
    { binding: 0, resource: inputTexture.createView() },
    { binding: 1, resource: outputTexture.createView() },
    { binding: 2, resource: { buffer: uniformBuffer } }
  ]
});

const renderBindGroup = device.createBindGroup({
  layout: renderBindGroupLayout,
  entries: [
    { binding: 0, resource: sampler },
    { binding: 1, resource: outputTexture.createView() }
  ]
});

// パイプライン
const computePipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [computeBindGroupLayout]
  }),
  compute: {
    module: computeShaderModule,
    entryPoint: 'main'
  }
});

const renderPipeline = device.createRenderPipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [renderBindGroupLayout]
  }),
  vertex: {
    module: renderShaderModule,
    entryPoint: 'vs_main'
  },
  fragment: {
    module: renderShaderModule,
    entryPoint: 'fs_main',
    targets: [{ format: format }]
  },
  primitive: {
    topology: 'triangle-list'
  }
});

// アニメーション（フィルターを切り替え）
let time = 0;
function frame() {
  time += 0.01;
  
  // フィルタータイプを周期的に変更
  const filterType = Math.floor((Math.sin(time) * 0.5 + 0.5) * 4);
  const strength = Math.sin(time * 2) * 0.5 + 0.5;
  
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    new Uint32Array([filterType, 0, 0, 0])  // filterType
  );
  device.queue.writeBuffer(
    uniformBuffer,
    4,
    new Float32Array([strength])  // strength
  );
  
  const encoder = device.createCommandEncoder();
  
  // コンピュートパス
  const computePass = encoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeBindGroup);
  computePass.dispatchWorkgroups(
    Math.ceil(textureSize / 8),
    Math.ceil(textureSize / 8)
  );
  computePass.end();
  
  // レンダーパス
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.0, g: 0.2, b: 0.4, a: 1.0 },
      loadOp: 'clear',
      storeOp: 'store'
    }]
  });
  
  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, renderBindGroup);
  renderPass.draw(3);  // フルスクリーン三角形
  renderPass.end();
  
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(frame);
}

frame();`,
				vertexShader: '',
				fragmentShader: ''
			},
			challenges: [
				{
					title: 'カスタムフィルター',
					description: '独自の画像処理フィルター（例：油絵風）を実装してみましょう。',
					hint: '周囲のピクセルの色を集計して、最も多い色を選択します。'
				},
				{
					title: 'リアルタイムビデオ処理',
					description: 'Webカメラの映像にフィルターを適用しましょう。',
					hint: 'getUserMediaでビデオを取得し、フレームごとにテクスチャを更新します。'
				}
			]
		}
	]
};