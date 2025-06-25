import type { TutorialChapter } from '$lib/webgpu/types';

// 定数定義
const MESH_TYPES_CONST = 3;
const INSTANCES_PER_TYPE_CONST = 1000;
const TOTAL_INSTANCES_CONST = MESH_TYPES_CONST * INSTANCES_PER_TYPE_CONST;

export const performanceChapter: TutorialChapter = {
	id: 'performance',
	title: '上級編: パフォーマンス最適化',
	description: 'WebGPUアプリケーションの高速化テクニックを学びます',
	examples: [
		{
			id: 'instancing',
			title: 'インスタンシング',
			description: '大量のオブジェクトを効率的に描画',
			steps: [
				{
					title: 'インスタンシングとは',
					content: `インスタンシングは、同じメッシュを大量に描画する技術です。

**従来の方法の問題点：**
- 各オブジェクトごとに描画コマンド
- CPUオーバーヘッドが大きい
- GPUの並列性を活かせない

**インスタンシングのメリット：**
- 1つの描画コマンドで大量描画
- GPUメモリの効率的な使用
- 各インスタンスごとに異なるデータ`,
					task: 'インスタンス描画の基本を実装しましょう。'
				},
				{
					title: 'インスタンスデータ',
					content: `各インスタンスに固有のデータを渡すことができます。

**一般的なインスタンスデータ：**
- 位置（変換行列）
- 色
- スケール
- 回転

**バッファの設定：**
stepMode: 'instance' を使用して、インスタンスごとにデータを進めます。`,
					task: 'インスタンスごとに異なる位置と色を設定しましょう。',
					hint: '@builtin(instance_index)でインスタンスIDを取得できます。'
				},
				{
					title: 'LOD（Level of Detail）',
					content: `距離に応じて詳細度を変更することで、パフォーマンスを向上させます。

**LODの実装方法：**
- 距離に基づくメッシュの切り替え
- 頂点数の削減
- シェーダーの簡略化

**自動LOD：**
GPUクエリを使用して、レンダリング時間を測定し、動的に調整します。`,
					task: '距離に応じてインスタンスの詳細度を変更しましょう。'
				}
			],
			initialCode: {
				javascript: `// インスタンシング
async function instancing() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // キューブの頂点データ
  const cubeVertices = new Float32Array([
    // TODO: キューブの頂点を定義
  ]);
  
  const numInstances = 1000;
  
  // インスタンスデータ（位置と色）
  const instanceData = new Float32Array(numInstances * 7); // x,y,z,r,g,b,scale
  for (let i = 0; i < numInstances; i++) {
    // TODO: ランダムな位置と色を生成
    
  }
  
  // TODO: 頂点バッファとインスタンスバッファを作成
  
  
  const shaderCode = \`
    struct VertexInput {
      @location(0) position: vec3f,
      @location(1) instancePosition: vec3f,
      @location(2) instanceColor: vec3f,
      @location(3) instanceScale: f32,
    };
    
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) color: vec3f,
    };
    
    // TODO: インスタンシング用のシェーダー
  \`;
  
  // TODO: レンダリングループ
  
}

instancing().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// インスタンシング - シンプルな三角形実装
// チュートリアル環境では device, context, canvas, format が既に利用可能です

(async function() {
// シンプルな三角形の頂点データ
const triangleVertices = new Float32Array([
  // 位置
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0,
   0.0,  0.5, 0.0,
]);

const numInstances = 1000;

// インスタンスデータ（位置と色）
const instanceData = new Float32Array(numInstances * 6);
const gridSize = Math.ceil(Math.sqrt(numInstances));

for (let i = 0; i < numInstances; i++) {
  const offset = i * 6;
  
  // グリッド配置
  const x = (i % gridSize) - gridSize / 2;
  const y = Math.floor(i / gridSize) - gridSize / 2;
  
  // 位置
  instanceData[offset + 0] = x * 2;
  instanceData[offset + 1] = y * 2;
  instanceData[offset + 2] = 0;
  
  // 色（グラデーション）
  instanceData[offset + 3] = i / numInstances;
  instanceData[offset + 4] = 1.0 - i / numInstances;
  instanceData[offset + 5] = 0.5;
}

// バッファ作成
const vertexBuffer = device.createBuffer({
  size: triangleVertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const instanceBuffer = device.createBuffer({
  size: instanceData.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, triangleVertices);
device.queue.writeBuffer(instanceBuffer, 0, instanceData);

// ユニフォームバッファ
const uniformBuffer = device.createBuffer({
  size: 64,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const shaderCode = \`
  struct Uniforms {
    aspectRatio: f32,
    time: f32,
  };
  
  @group(0) @binding(0) var<uniform> uniforms: Uniforms;
  
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
  };
  
  @vertex
  fn vs_main(
    @location(0) position: vec3f,
    @location(1) instancePosition: vec3f,
    @location(2) instanceColor: vec3f,
    @builtin(instance_index) instanceIndex: u32
  ) -> VertexOutput {
    var output: VertexOutput;
    
    // アニメーション
    let angle = uniforms.time + f32(instanceIndex) * 0.01;
    let scale = 0.5 + sin(angle) * 0.2;
    
    // 回転
    let c = cos(angle);
    let s = sin(angle);
    let rotatedPos = vec2f(
      position.x * c - position.y * s,
      position.x * s + position.y * c
    );
    
    // 最終位置
    let finalPos = vec2f(
      rotatedPos.x * scale + instancePosition.x,
      rotatedPos.y * scale + instancePosition.y
    );
    
    output.position = vec4f(
      finalPos.x / 15.0 / uniforms.aspectRatio,
      finalPos.y / 15.0,
      instancePosition.z,
      1.0
    );
    
    output.color = instanceColor;
    return output;
  }
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    return vec4f(input.color, 1.0);
  }
\`;

// シェーダーモジュール
const shaderModule = device.createShaderModule({ code: shaderCode });

// バインドグループレイアウト
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: { type: 'uniform' }
    }
  ]
});

const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: { buffer: uniformBuffer }
    }
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
    buffers: [
      {
        // 頂点バッファ
        arrayStride: 12,
        attributes: [{
          format: 'float32x3',
          offset: 0,
          shaderLocation: 0
        }]
      },
      {
        // インスタンスバッファ
        arrayStride: 24,
        stepMode: 'instance',
        attributes: [
          {
            format: 'float32x3',
            offset: 0,
            shaderLocation: 1
          },
          {
            format: 'float32x3',
            offset: 12,
            shaderLocation: 2
          }
        ]
      }
    ]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{ format }]
  },
  primitive: {
    topology: 'triangle-list'
  }
});

// アニメーションループ
let startTime = Date.now();

function frame() {
  const time = (Date.now() - startTime) / 1000;
  const aspectRatio = canvas.width / canvas.height;
  
  // ユニフォームデータを更新
  const uniformData = new Float32Array([aspectRatio, time, 0, 0]);
  device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  
  // 描画
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
      loadOp: 'clear',
      storeOp: 'store'
    }]
  });
  
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setVertexBuffer(1, instanceBuffer);
  pass.draw(3, numInstances);
  pass.end();
  
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(frame);
}

console.log(\`Rendering \${numInstances} triangle instances\`);
frame();

})().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			}
		},
		{
			id: 'optimization-techniques',
			title: '最適化テクニック',
			description: '大量のインスタンスを効率的に管理',
			steps: [
				{
					title: 'バッチレンダリング',
					content: `複数のメッシュタイプを効率的に描画します。

**テクニック：**
- 異なるメッシュを1つのバッファに結合
- インスタンスごとにメッシュタイプを指定
- 頂点シェーダーで適切なメッシュを選択

**メリット：**
- 描画コールの削減
- GPUの効率的な使用`,
					task: '3種類のメッシュを効率的に描画しましょう。'
				},
				{
					title: 'カラーバリエーション',
					content: `大量のインスタンスに視覚的な多様性を持たせます。

**実装方法：**
- インスタンスIDに基づく色の生成
- グラデーションやパターンの適用
- 動的な色の変更

**効果：**
- 視覚的に興味深い表示
- 個々のインスタンスの識別が容易`,
					task: '位置に基づいてインスタンスの色を変化させましょう。',
					hint: 'インスタンスの位置から色を計算できます。'
				},
				{
					title: 'アニメーション',
					content: `大量のインスタンスを動的にアニメーションさせます。

**テクニック：**
- GPU内での位置更新
- 波のような動き
- 回転アニメーション

**パフォーマンスのコツ：**
- シェーダー内での計算
- CPUからのデータ転送を最小限に`,
					task: 'インスタンスに波のようなアニメーションを追加しましょう。'
				}
			],
			initialCode: {
				javascript: `// 最適化テクニック - 3000個のカラフルなインスタンス
async function optimizationTechniques() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // 3000個のインスタンス（1000個ずつ3種類）
  const TOTAL_INSTANCES = 3000;
  const instanceData = new Float32Array(TOTAL_INSTANCES * 8); // position(3) + color(3) + scale(1) + meshType(1)
  
  // TODO: インスタンスデータを生成（グリッド配置）
  
  
  // TODO: 3種類のメッシュを定義（立方体、球、円錐）
  
  
  const shaderCode = \`
    // TODO: カラフルなシェーダー
  \`;
  
  // TODO: アニメーションループ
  
}

optimizationTechniques().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// 最適化テクニック - シンプル版
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// メイン関数
(async function() {
console.log('Starting optimization techniques demo...');
// メッシュの種類
const MESH_TYPES = 3;
const INSTANCES_PER_TYPE = 1000;
const TOTAL_INSTANCES = MESH_TYPES * INSTANCES_PER_TYPE;

// シンプルな三角形メッシュ（全タイプで同じ形状）
const vertices = new Float32Array([
  -0.5, -0.5, 0,
   0.5, -0.5, 0,
   0.0,  0.5, 0
]);

// インスタンスデータ
const instanceData = new Float32Array(TOTAL_INSTANCES * 8); // position(3) + color(3) + scale(1) + meshType(1)

// グリッド配置
const gridSize = Math.ceil(Math.sqrt(TOTAL_INSTANCES));
for (let i = 0; i < TOTAL_INSTANCES; i++) {
  const offset = i * 8;
  const meshType = Math.floor(i / INSTANCES_PER_TYPE);
  
  // グリッド位置
  const x = (i % gridSize - gridSize / 2) / gridSize * 2;
  const y = (Math.floor(i / gridSize) - gridSize / 2) / gridSize * 2;
  
  instanceData[offset + 0] = x * 10;
  instanceData[offset + 1] = 0;
  instanceData[offset + 2] = y * 10;
  
  // メッシュタイプごとの色
  if (meshType === 0) {
    instanceData[offset + 3] = 1; // 赤
    instanceData[offset + 4] = 0.2;
    instanceData[offset + 5] = 0.2;
  } else if (meshType === 1) {
    instanceData[offset + 3] = 0.2;
    instanceData[offset + 4] = 1; // 緑
    instanceData[offset + 5] = 0.2;
  } else {
    instanceData[offset + 3] = 0.2;
    instanceData[offset + 4] = 0.2;
    instanceData[offset + 5] = 1; // 青
  }
  
  instanceData[offset + 6] = 0.3; // スケール
  instanceData[offset + 7] = meshType; // メッシュタイプ
}

// バッファ作成
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const instanceBuffer = device.createBuffer({
  size: instanceData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const uniformBuffer = device.createBuffer({
  size: 256,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);
device.queue.writeBuffer(instanceBuffer, 0, instanceData);

// レンダリングシェーダー
const shaderCode = \`
  struct Instance {
    position: vec3f,
    color: vec3f,
    scale: f32,
    meshType: f32,
  };
  
  struct Uniforms {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
    time: f32,
  };
  
  @group(0) @binding(0) var<storage, read> instances: array<Instance>;
  @group(0) @binding(1) var<uniform> uniforms: Uniforms;
  
  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
  };
  
  @vertex
  fn vs_main(
    @location(0) vertexPosition: vec3f,
    @builtin(instance_index) instanceIndex: u32
  ) -> VertexOutput {
    var output: VertexOutput;
    
    let instance = instances[instanceIndex];
    
    // 波のアニメーション
    let wave = sin(uniforms.time * 2.0 + instance.position.x * 0.5 + instance.position.z * 0.5) * 0.5;
    
    // メッシュタイプごとに異なる形状変換
    var transformedVertex = vertexPosition;
    if (instance.meshType == 1.0) {
      // 回転
      let angle = uniforms.time + f32(instanceIndex) * 0.01;
      let c = cos(angle);
      let s = sin(angle);
      transformedVertex = vec3f(
        vertexPosition.x * c - vertexPosition.y * s,
        vertexPosition.x * s + vertexPosition.y * c,
        vertexPosition.z
      );
    } else if (instance.meshType == 2.0) {
      // パルス
      let pulse = 1.0 + sin(uniforms.time * 3.0 + f32(instanceIndex) * 0.1) * 0.2;
      transformedVertex = vertexPosition * pulse;
    }
    
    let worldPos = transformedVertex * instance.scale + instance.position + vec3f(0, wave, 0);
    output.position = uniforms.projectionMatrix * uniforms.viewMatrix * vec4f(worldPos, 1.0);
    
    // 位置ベースの色変化
    let colorVariation = vec3f(
      sin(instance.position.x * 0.3) * 0.2,
      cos(instance.position.z * 0.3) * 0.2,
      sin(uniforms.time + f32(instanceIndex) * 0.01) * 0.2
    );
    output.color = instance.color + colorVariation;
    
    return output;
  }
  
  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    return vec4f(input.color, 1.0);
  }
\`;

// シェーダーモジュール
const shaderModule = device.createShaderModule({ code: shaderCode });

// バインドグループレイアウト
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }
  ]
});

const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    { binding: 0, resource: { buffer: instanceBuffer } },
    { binding: 1, resource: { buffer: uniformBuffer } }
  ]
});

// パイプライン
const pipeline = device.createRenderPipeline({
  layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
    buffers: [{
      arrayStride: 12,
      attributes: [{
        format: 'float32x3',
        offset: 0,
        shaderLocation: 0
      }]
    }]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{ format }]
  },
  primitive: { topology: 'triangle-list' },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus'
  }
});

// 深度テクスチャ
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT
});

// 行列生成関数
function createProjectionMatrix(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ]);
}

function createViewMatrix(eye, center, up) {
  const f = normalize(subtract(center, eye));
  const s = normalize(cross(f, up));
  const u = cross(s, f);
  
  return new Float32Array([
    s[0], u[0], -f[0], 0,
    s[1], u[1], -f[1], 0,
    s[2], u[2], -f[2], 0,
    -dot(s, eye), -dot(u, eye), dot(f, eye), 1
  ]);
}

// ベクトル演算
function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// アニメーションループ
let startTime = Date.now();

function frame() {
  const time = (Date.now() - startTime) / 1000;
  
  // カメラアニメーション
  const cameraRadius = 20;
  const cameraAngle = time * 0.1;
  const cameraHeight = 15;
  
  const viewMatrix = createViewMatrix(
    [Math.cos(cameraAngle) * cameraRadius, cameraHeight, Math.sin(cameraAngle) * cameraRadius],
    [0, 0, 0],
    [0, 1, 0]
  );
  
  const projectionMatrix = createProjectionMatrix(
    Math.PI / 4,
    canvas.width / canvas.height,
    0.1,
    1000
  );
  
  // ユニフォームデータを更新
  const uniformData = new Float32Array([
    ...viewMatrix,
    ...projectionMatrix,
    time, 0, 0, 0
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  
  // 描画
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
      loadOp: 'clear',
      storeOp: 'store'
    }],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store'
    }
  });
  
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(3, TOTAL_INSTANCES);
  pass.end();
  
  device.queue.submit([encoder.finish()]);
  
  requestAnimationFrame(frame);
}

// 開始
console.log(\`Rendering \${TOTAL_INSTANCES} instances\`);
frame();

})().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			}
		}
	]
};