import type { TutorialChapter } from '$lib/webgpu/types';

export const lightingChapter: TutorialChapter = {
	id: 'lighting',
	title: '応用編: ライティングとシェーディング',
	description: '3Dグラフィックスにおける光の表現と陰影技術を学びます',
	examples: [
		{
			id: 'phong-lighting',
			title: 'Phongライティングモデル',
			description: '基本的なライティングモデルの実装を学ぶ',
			steps: [
				{
					title: 'ライティングの基本概念',
					content: `3Dグラフィックスにおける光の表現は、物体の立体感を生み出す重要な要素です。

**Phongライティングモデルの3要素：**
- **アンビエント（環境光）**: 間接光を簡易的に表現
- **ディフューズ（拡散反射）**: 表面の粗さによる光の拡散
- **スペキュラー（鏡面反射）**: 滑らかな表面での光の反射

**必要な情報：**
- 頂点/フラグメントの法線ベクトル
- ライトの位置と方向
- 視点（カメラ）の位置
- マテリアルの特性`,
					task: 'まずはアンビエント光のみで3D立方体を描画しましょう。'
				},
				{
					title: 'ディフューズライティング',
					content: `ディフューズ（拡散反射）は、光源と表面の角度に基づいて明るさが変化します。

**Lambert の余弦則：**
\`\`\`
diffuse = max(dot(normal, lightDir), 0.0) * lightColor * materialColor
\`\`\`

**重要なポイント：**
- 法線と光の方向の内積で明るさを計算
- 負の値は0にクランプ（裏面は光らない）
- 光源の色と物体の色を乗算`,
					task: 'アンビエント光にディフューズライティングを追加しましょう。',
					hint: 'dot(normal, lightDir)を計算し、結果を0以上にクランプします。'
				},
				{
					title: 'スペキュラーライティング',
					content: `スペキュラー（鏡面反射）は、視点の位置に依存する光沢を表現します。

**Phongの反射モデル：**
\`\`\`
reflectDir = reflect(-lightDir, normal)
specular = pow(max(dot(viewDir, reflectDir), 0.0), shininess)
\`\`\`

**パラメータ：**
- shininess: 光沢の鋭さ（値が大きいほど鋭い反射）
- 視線方向と反射方向の一致度で強度を決定`,
					task: '完全なPhongライティングモデルを実装しましょう。'
				}
			],
			initialCode: {
				javascript: `// Phongライティングモデルの実装
async function phongLighting() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // 立方体の頂点データ（位置と法線）
  const vertices = new Float32Array([
    // 前面
    -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
     0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
     0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
    -0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
    // 背面
    -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
    -0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
     0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
     0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
    // 上面
    -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
    -0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
     0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
     0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
    // 下面
    -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
     0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
     0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
    -0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
    // 右面
     0.5, -0.5, -0.5,  1.0,  0.0,  0.0,
     0.5,  0.5, -0.5,  1.0,  0.0,  0.0,
     0.5,  0.5,  0.5,  1.0,  0.0,  0.0,
     0.5, -0.5,  0.5,  1.0,  0.0,  0.0,
    // 左面
    -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,
    -0.5, -0.5,  0.5, -1.0,  0.0,  0.0,
    -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,
    -0.5,  0.5, -0.5, -1.0,  0.0,  0.0
  ]);
  
  const indices = new Uint16Array([
    0,  1,  2,    0,  2,  3,   // 前面
    4,  5,  6,    4,  6,  7,   // 背面
    8,  9, 10,    8, 10, 11,   // 上面
    12, 13, 14,  12, 14, 15,   // 下面
    16, 17, 18,  16, 18, 19,   // 右面
    20, 21, 22,  20, 22, 23    // 左面
  ]);
  
  // バッファの作成
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);
  
  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);
  
  // シェーダーモジュール
  const shaderModule = device.createShaderModule({
    code: \`
      struct Uniforms {
        modelMatrix: mat4x4f,
        viewMatrix: mat4x4f,
        projectionMatrix: mat4x4f,
        lightPosition: vec3f,
        viewPosition: vec3f,
        time: f32,
      };
      
      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) worldPos: vec3f,
        @location(1) normal: vec3f,
      };
      
      @group(0) @binding(0) var<uniform> uniforms: Uniforms;
      
      @vertex
      fn vs_main(
        @location(0) position: vec3f,
        @location(1) normal: vec3f
      ) -> VertexOutput {
        var output: VertexOutput;
        
        let worldPos = (uniforms.modelMatrix * vec4f(position, 1.0)).xyz;
        output.worldPos = worldPos;
        output.normal = normalize((uniforms.modelMatrix * vec4f(normal, 0.0)).xyz);
        output.position = uniforms.projectionMatrix * uniforms.viewMatrix * vec4f(worldPos, 1.0);
        
        return output;
      }
      
      @fragment
      fn fs_main(input: VertexOutput) -> @location(0) vec4f {
        // アンビエント光
        let ambientStrength = 0.2;
        let ambientColor = vec3f(1.0) * ambientStrength;
        
        // ディフューズライティング
        let lightDir = normalize(uniforms.lightPosition - input.worldPos);
        let diff = max(dot(input.normal, lightDir), 0.0);
        let diffuseColor = vec3f(1.0) * diff;
        
        // スペキュラーライティング
        let viewDir = normalize(uniforms.viewPosition - input.worldPos);
        let reflectDir = reflect(-lightDir, input.normal);
        let spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        let specularColor = vec3f(1.0) * spec * 0.5;
        
        // 最終的な色を合成
        let objectColor = vec3f(0.7, 0.3, 0.3);
        let lightColor = vec3f(1.0);
        
        let finalColor = (ambientColor + diffuseColor + specularColor) * objectColor * lightColor;
        
        return vec4f(finalColor, 1.0);
      }
    \`
  });
  
  // TODO: ユニフォームバッファとバインドグループを作成
  
  
  // TODO: パイプラインを作成
  
  
  // 行列計算のヘルパー関数
  function createProjectionMatrix(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, 2 * far * near * nf,
      0, 0, -1, 0
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
  
  function createRotationMatrix(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    return new Float32Array([
      c, 0, s, 0,
      0, 1, 0, 0,
      -s, 0, c, 0,
      0, 0, 0, 1
    ]);
  }
  
  // ベクトル演算のヘルパー
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
  let time = 0;
  
  function frame() {
    time += 0.01;
    
    // TODO: ユニフォームデータを更新
    
    
    // TODO: レンダリングコマンドを実行
    
    
    requestAnimationFrame(frame);
  }
  
  frame();
}

phongLighting().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// Phongライティングモデルの実装
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// 立方体の頂点データ（位置と法線）
const vertices = new Float32Array([
  // 前面 (z = 0.5)
  -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
   0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
   0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
  -0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
  // 背面 (z = -0.5)
  -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
  -0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
   0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
   0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
  // 上面 (y = 0.5)
  -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
  -0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
   0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
   0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
  // 下面 (y = -0.5)
  -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
   0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
   0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
  -0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
  // 右面 (x = 0.5)
   0.5, -0.5, -0.5,  1.0,  0.0,  0.0,
   0.5,  0.5, -0.5,  1.0,  0.0,  0.0,
   0.5,  0.5,  0.5,  1.0,  0.0,  0.0,
   0.5, -0.5,  0.5,  1.0,  0.0,  0.0,
  // 左面 (x = -0.5)
  -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,
  -0.5, -0.5,  0.5, -1.0,  0.0,  0.0,
  -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,
  -0.5,  0.5, -0.5, -1.0,  0.0,  0.0
]);

const indices = new Uint16Array([
  0,  1,  2,    0,  2,  3,   // 前面
  4,  5,  6,    4,  6,  7,   // 背面
  8,  9, 10,    8, 10, 11,   // 上面
  12, 13, 14,  12, 14, 15,   // 下面
  16, 17, 18,  16, 18, 19,   // 右面
  20, 21, 22,  20, 22, 23    // 左面
]);

// バッファの作成
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);

const indexBuffer = device.createBuffer({
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
});
device.queue.writeBuffer(indexBuffer, 0, indices);

// ユニフォームバッファ（MVP行列、ライト情報など）
const uniformBufferSize = 256; // 十分なサイズ
const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

// シェーダーモジュール
const shaderModule = device.createShaderModule({
  code: \`
    struct Uniforms {
      modelMatrix: mat4x4f,
      viewMatrix: mat4x4f,
      projectionMatrix: mat4x4f,
      lightPosition: vec3f,
      viewPosition: vec3f,
      time: f32,
    };
    
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) worldPos: vec3f,
      @location(1) normal: vec3f,
    };
    
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    
    @vertex
    fn vs_main(
      @location(0) position: vec3f,
      @location(1) normal: vec3f
    ) -> VertexOutput {
      var output: VertexOutput;
      
      let worldPos = (uniforms.modelMatrix * vec4f(position, 1.0)).xyz;
      output.worldPos = worldPos;
      output.normal = normalize((uniforms.modelMatrix * vec4f(normal, 0.0)).xyz);
      output.position = uniforms.projectionMatrix * uniforms.viewMatrix * vec4f(worldPos, 1.0);
      
      return output;
    }
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      // アンビエント光
      let ambientStrength = 0.2;
      let ambientColor = vec3f(1.0) * ambientStrength;
      
      // ディフューズライティング
      let lightDir = normalize(uniforms.lightPosition - input.worldPos);
      let diff = max(dot(input.normal, lightDir), 0.0);
      let diffuseColor = vec3f(1.0) * diff;
      
      // スペキュラーライティング
      let viewDir = normalize(uniforms.viewPosition - input.worldPos);
      let reflectDir = reflect(-lightDir, input.normal);
      let spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
      let specularColor = vec3f(1.0) * spec * 0.5;
      
      // 最終的な色を合成
      let objectColor = vec3f(0.7, 0.3, 0.3);
      let lightColor = vec3f(1.0);
      
      let finalColor = (ambientColor + diffuseColor + specularColor) * objectColor * lightColor;
      
      return vec4f(finalColor, 1.0);
    }
  \`
});

// バインドグループレイアウト
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' }
    }
  ]
});

// バインドグループ
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer
      }
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
    buffers: [{
      arrayStride: 24, // 6 floats × 4 bytes
      attributes: [
        {
          format: 'float32x3',
          offset: 0,
          shaderLocation: 0
        },
        {
          format: 'float32x3',
          offset: 12,
          shaderLocation: 1
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
    topology: 'triangle-list',
    cullMode: 'back'
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus'
  }
});

// デプステクスチャの作成
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT
});

// 行列計算のヘルパー関数
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

function createRotationMatrix(angleY) {
  const c = Math.cos(angleY);
  const s = Math.sin(angleY);
  
  return new Float32Array([
    c, 0, s, 0,
    0, 1, 0, 0,
    -s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

// ベクトル演算のヘルパー
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
let time = 0;

function frame() {
  time += 0.01;
  
  // カメラとライトの設定
  const viewPosition = [3, 2, 5];
  const lightPosition = [2, 4, 3];
  
  // 行列の作成
  const aspect = canvas.width / canvas.height;
  const projectionMatrix = createProjectionMatrix(Math.PI / 4, aspect, 0.1, 100);
  const viewMatrix = createViewMatrix(viewPosition, [0, 0, 0], [0, 1, 0]);
  const modelMatrix = createRotationMatrix(time);
  
  // ユニフォームデータの更新
  const uniformData = new Float32Array([
    ...modelMatrix,
    ...viewMatrix,
    ...projectionMatrix,
    ...lightPosition, 0, // padding
    ...viewPosition, 0, // padding
    time, 0, 0, 0 // padding
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  
  // レンダリング
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
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
  pass.setIndexBuffer(indexBuffer, 'uint16');
  pass.drawIndexed(indices.length);
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
					title: 'マテリアルプロパティ',
					description: '異なるマテリアル（金属、プラスチック、ゴム）を表現してみましょう。',
					hint: 'アンビエント、ディフューズ、スペキュラーの係数を調整します。'
				},
				{
					title: 'カラーライト',
					description: 'RGB各色のライトを配置して、色の混ざり方を観察しましょう。',
					hint: 'ライトの色をvec3f(1,0,0)のように設定します。'
				},
				{
					title: 'Blinn-Phongモデル',
					description: 'より効率的なBlinn-Phongライティングモデルを実装してみましょう。',
					hint: 'ハーフベクトルを使用して計算を簡略化します。'
				}
			]
		},
		{
			id: 'advanced-lighting',
			title: '高度なライティング技術',
			description: '複数ライトと異なるライトタイプの実装',
			steps: [
				{
					title: '複数ライトの処理',
					content: `実際のシーンでは複数の光源が存在します。

**複数ライトの実装方法：**
- 配列でライトデータを管理
- 各ライトの寄与を加算
- パフォーマンスとクオリティのバランス

**考慮事項：**
- 最大ライト数の制限
- 距離による減衰
- ライトの有効/無効切り替え`,
					task: '3つの異なる色のポイントライトを実装しましょう。'
				},
				{
					title: 'ライトタイプの実装',
					content: `異なるライトタイプにはそれぞれ特性があります。

**方向性ライト（Directional Light）：**
- 太陽光のような平行光線
- 位置ではなく方向のみ
- 減衰なし

**ポイントライト（Point Light）：**
- 電球のような点光源
- 全方向に光を放射
- 距離による減衰

**スポットライト（Spot Light）：**
- 懐中電灯のような円錐状の光
- 方向と角度を持つ
- 距離と角度による減衰`,
					task: 'ポイントライトとスポットライトを追加しましょう。',
					hint: 'スポットライトにはdot(lightDir, spotDir)で角度を計算します。'
				},
				{
					title: '法線マッピングの基礎',
					content: `法線マップを使用して、ジオメトリを増やさずに表面の詳細を表現します。

**法線マップの仕組み：**
- テクスチャに法線情報を格納
- タンジェント空間での変換
- ピクセル単位での法線の変更

**実装のポイント：**
- タンジェントとバイタンジェントの計算
- 法線マップのサンプリング
- ワールド空間への変換`,
					task: 'シンプルな法線マッピングを実装してみましょう。'
				}
			],
			initialCode: {
				javascript: `// 高度なライティング技術
async function advancedLighting() {
  const canvas = document.querySelector('canvas');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  context.configure({ device, format: canvasFormat });
  
  // 平面の頂点データ（タンジェント空間用）
  const vertices = new Float32Array([
    // position(3), normal(3), uv(2), tangent(3)
    -1, 0, -1,  0, 1, 0,  0, 0,  1, 0, 0,
     1, 0, -1,  0, 1, 0,  1, 0,  1, 0, 0,
     1, 0,  1,  0, 1, 0,  1, 1,  1, 0, 0,
    -1, 0,  1,  0, 1, 0,  0, 1,  1, 0, 0,
  ]);
  
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  
  // 球体の頂点データ（複数ライトデモ用）
  function createSphere(radius, segments) {
    const vertices = [];
    const indices = [];
    
    for (let lat = 0; lat <= segments; lat++) {
      const theta = lat * Math.PI / segments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      for (let lon = 0; lon <= segments; lon++) {
        const phi = lon * 2 * Math.PI / segments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        const x = radius * sinTheta * cosPhi;
        const y = radius * cosTheta;
        const z = radius * sinTheta * sinPhi;
        
        // 位置
        vertices.push(x, y, z);
        // 法線（球体の場合は位置と同じ方向）
        vertices.push(x / radius, y / radius, z / radius);
      }
    }
    
    // インデックスの生成
    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const current = lat * (segments + 1) + lon;
        const next = current + segments + 1;
        
        indices.push(current, next, current + 1);
        indices.push(current + 1, next, next + 1);
      }
    }
    
    return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
  }
  
  // TODO: 複数ライトのためのユニフォーム構造を定義
  
  
  // TODO: シェーダーを作成（複数ライト対応）
  
  
  // TODO: レンダリングループを実装
  
}

advancedLighting().catch(console.error);`,
				vertexShader: '',
				fragmentShader: ''
			},
			code: {
				javascript: `// 高度なライティング技術の実装
// チュートリアル環境では device, context, canvas, format が既に利用可能です

// 球体の頂点データを生成
function createSphere(radius, segments) {
  const vertices = [];
  const indices = [];
  
  for (let lat = 0; lat <= segments; lat++) {
    const theta = lat * Math.PI / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    
    for (let lon = 0; lon <= segments; lon++) {
      const phi = lon * 2 * Math.PI / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      
      const x = radius * sinTheta * cosPhi;
      const y = radius * cosTheta;
      const z = radius * sinTheta * sinPhi;
      
      // 位置
      vertices.push(x, y, z);
      // 法線（球体の場合は位置と同じ方向）
      vertices.push(x / radius, y / radius, z / radius);
    }
  }
  
  // インデックスの生成
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const current = lat * (segments + 1) + lon;
      const next = current + segments + 1;
      
      indices.push(current, next, current + 1);
      indices.push(current + 1, next, next + 1);
    }
  }
  
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}

// 球体を作成
const sphere = createSphere(1.0, 32);

// バッファの作成
const vertexBuffer = device.createBuffer({
  size: sphere.vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});
device.queue.writeBuffer(vertexBuffer, 0, sphere.vertices);

const indexBuffer = device.createBuffer({
  size: sphere.indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
});
device.queue.writeBuffer(indexBuffer, 0, sphere.indices);

// ユニフォームバッファ（複数ライト対応）
const uniformBufferSize = 512; // より大きなサイズ
const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

// 複数ライト対応シェーダー
const shaderModule = device.createShaderModule({
  code: \`
    struct Uniforms {
      modelMatrix: mat4x4f,
      viewMatrix: mat4x4f,
      projectionMatrix: mat4x4f,
      viewPosition: vec3f,
      time: f32,
      // 3つのライト
      light1Position: vec3f,
      light1Color: vec3f,
      light2Position: vec3f,
      light2Color: vec3f,
      light3Position: vec3f,
      light3Color: vec3f,
    };
    
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) worldPos: vec3f,
      @location(1) normal: vec3f,
    };
    
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    
    @vertex
    fn vs_main(
      @location(0) position: vec3f,
      @location(1) normal: vec3f
    ) -> VertexOutput {
      var output: VertexOutput;
      
      let worldPos = (uniforms.modelMatrix * vec4f(position, 1.0)).xyz;
      output.worldPos = worldPos;
      output.normal = normalize((uniforms.modelMatrix * vec4f(normal, 0.0)).xyz);
      output.position = uniforms.projectionMatrix * uniforms.viewMatrix * vec4f(worldPos, 1.0);
      
      return output;
    }
    
    // ライティング計算関数
    fn calculateLight(
      lightPos: vec3f,
      lightColor: vec3f,
      worldPos: vec3f,
      normal: vec3f,
      viewDir: vec3f
    ) -> vec3f {
      let lightDir = normalize(lightPos - worldPos);
      let distance = length(lightPos - worldPos);
      
      // 距離による減衰
      let attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
      
      // ディフューズ
      let diff = max(dot(normal, lightDir), 0.0);
      
      // スペキュラー（Blinn-Phong）
      let halfwayDir = normalize(lightDir + viewDir);
      let spec = pow(max(dot(normal, halfwayDir), 0.0), 64.0);
      
      return (diff + spec * 0.5) * lightColor * attenuation;
    }
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      let normal = normalize(input.normal);
      let viewDir = normalize(uniforms.viewPosition - input.worldPos);
      
      // アンビエント光
      let ambient = vec3f(0.1);
      
      // 各ライトの計算
      var lighting = ambient;
      lighting += calculateLight(
        uniforms.light1Position, uniforms.light1Color,
        input.worldPos, normal, viewDir
      );
      lighting += calculateLight(
        uniforms.light2Position, uniforms.light2Color,
        input.worldPos, normal, viewDir
      );
      lighting += calculateLight(
        uniforms.light3Position, uniforms.light3Color,
        input.worldPos, normal, viewDir
      );
      
      // 白い球体
      let objectColor = vec3f(0.9);
      let finalColor = lighting * objectColor;
      
      return vec4f(finalColor, 1.0);
    }
  \`
});

// バインドグループレイアウト
const bindGroupLayout = device.createBindGroupLayout({
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    buffer: { type: 'uniform' }
  }]
});

// バインドグループ
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [{
    binding: 0,
    resource: { buffer: uniformBuffer }
  }]
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
      arrayStride: 24,
      attributes: [
        { format: 'float32x3', offset: 0, shaderLocation: 0 },
        { format: 'float32x3', offset: 12, shaderLocation: 1 }
      ]
    }]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{ format: format }]
  },
  primitive: {
    topology: 'triangle-list',
    cullMode: 'back'
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus'
  }
});

// 行列計算のヘルパー関数
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

function createIdentityMatrix() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
}

// ベクトル演算のヘルパー
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

// デプステクスチャの作成
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT
});

// アニメーションループ
let time = 0;

function frame() {
  time += 0.01;
  
  // カメラの設定
  const viewPosition = [0, 2, 5];
  
  // 3つのライトを円状に配置
  const light1Angle = time;
  const light2Angle = time + (2 * Math.PI / 3);
  const light3Angle = time + (4 * Math.PI / 3);
  
  const lightRadius = 3;
  const light1Position = [
    Math.cos(light1Angle) * lightRadius,
    1.5,
    Math.sin(light1Angle) * lightRadius
  ];
  const light2Position = [
    Math.cos(light2Angle) * lightRadius,
    1.5,
    Math.sin(light2Angle) * lightRadius
  ];
  const light3Position = [
    Math.cos(light3Angle) * lightRadius,
    1.5,
    Math.sin(light3Angle) * lightRadius
  ];
  
  // ライトの色
  const light1Color = [1.0, 0.2, 0.2]; // 赤
  const light2Color = [0.2, 1.0, 0.2]; // 緑
  const light3Color = [0.2, 0.2, 1.0]; // 青
  
  // 行列の作成
  const aspect = canvas.width / canvas.height;
  const projectionMatrix = createProjectionMatrix(
    Math.PI / 4,
    aspect,
    0.1,
    100
  );
  
  const viewMatrix = createViewMatrix(
    viewPosition,
    [0, 0, 0],
    [0, 1, 0]
  );
  const modelMatrix = createIdentityMatrix();
  
  // ユニフォームデータの更新
  const uniformData = new Float32Array([
    ...modelMatrix,
    ...viewMatrix,
    ...projectionMatrix,
    ...viewPosition, 0,
    time, 0, 0, 0,
    ...light1Position, 0,
    ...light1Color, 0,
    ...light2Position, 0,
    ...light2Color, 0,
    ...light3Position, 0,
    ...light3Color, 0
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  
  // レンダリング
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.05, g: 0.05, b: 0.05, a: 1 },
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
  pass.setIndexBuffer(indexBuffer, 'uint16');
  pass.drawIndexed(sphere.indices.length);
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
					title: 'スポットライト',
					description: '円錐状の光を放つスポットライトを実装してみましょう。',
					hint: '光の方向と角度を使って減衰を計算します。'
				},
				{
					title: 'シャドウマッピング',
					description: '基本的な影の実装に挑戦してみましょう。',
					hint: 'ライトから見たデプスマップを作成します。'
				}
			]
		}
	]
};