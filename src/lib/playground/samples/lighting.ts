import type { PlaygroundSample } from './index';

export const lighting: PlaygroundSample = {
	id: 'lighting',
	name: 'フォンライティング',
	javascript: `// フォンライティングの例
async function main() {
  const canvas = document.querySelector('canvas');
  
  // すでに初期化されたWebGPUコンテキストを使用
  let device, context, canvasFormat;
  if (window.webgpuDevice && window.webgpuContext && window.webgpuFormat) {
    device = window.webgpuDevice;
    context = window.webgpuContext;
    canvasFormat = window.webgpuFormat;
  } else {
    const adapter = await navigator.gpu.requestAdapter();
    device = await adapter.requestDevice();
    context = canvas.getContext('webgpu');
    canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: canvasFormat });
  }
  
  // 球体のメッシュデータを生成
  const { vertices, indices } = createSphere(1.0, 32, 16);
  
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();
  
  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint16Array(indexBuffer.getMappedRange()).set(indices);
  indexBuffer.unmap();
  
  // ユニフォームバッファ
  const uniformBuffer = device.createBuffer({
    size: 256, // 十分なサイズを確保
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  
  const shaderModule = device.createShaderModule({
    code: \`
      struct Uniforms {
        mvpMatrix: mat4x4f,
        modelMatrix: mat4x4f,
        normalMatrix: mat4x4f,
        lightPosition: vec3f,
        _pad1: f32,
        viewPosition: vec3f,
        _pad2: f32,
      };
      
      @group(0) @binding(0) var<uniform> uniforms: Uniforms;
      
      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) worldPos: vec3f,
        @location(1) normal: vec3f,
      };
      
      @vertex
      fn vs_main(
        @location(0) position: vec3f,
        @location(1) normal: vec3f
      ) -> VertexOutput {
        var output: VertexOutput;
        output.position = uniforms.mvpMatrix * vec4f(position, 1.0);
        output.worldPos = (uniforms.modelMatrix * vec4f(position, 1.0)).xyz;
        output.normal = normalize((uniforms.normalMatrix * vec4f(normal, 0.0)).xyz);
        return output;
      }
      
      @fragment
      fn fs_main(input: VertexOutput) -> @location(0) vec4f {
        let normal = normalize(input.normal);
        let lightDir = normalize(uniforms.lightPosition - input.worldPos);
        let viewDir = normalize(uniforms.viewPosition - input.worldPos);
        let halfDir = normalize(lightDir + viewDir);
        
        // マテリアルプロパティ
        let ambient = vec3f(0.1, 0.1, 0.15);
        let diffuseColor = vec3f(0.6, 0.7, 0.8);
        let specularColor = vec3f(1.0, 1.0, 1.0);
        let shininess = 32.0;
        
        // ライティング計算
        let diffuse = max(dot(normal, lightDir), 0.0) * diffuseColor;
        let specular = pow(max(dot(normal, halfDir), 0.0), shininess) * specularColor;
        
        let color = ambient + diffuse + specular;
        return vec4f(color, 1.0);
      }
    \`
  });
  
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' }
    }]
  });
  
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer }
    }]
  });
  
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
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
      targets: [{ format: canvasFormat }]
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
  
  // キャンバスサイズを明示的に設定
  const canvasWidth = 600;
  const canvasHeight = 450;
  
  const depthTexture = device.createTexture({
    size: [canvasWidth, canvasHeight],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });
  
  let rotation = 0;
  
  function render() {
    rotation += 0.01;
    
    // 行列の計算
    const aspect = canvasWidth / canvasHeight;
    const projection = mat4Perspective(Math.PI / 4, aspect, 0.1, 100);
    const view = mat4LookAt([0, 0, 4], [0, 0, 0], [0, 1, 0]);
    const model = mat4RotateY(rotation);
    const mvpMatrix = mat4Multiply(projection, mat4Multiply(view, model));
    const normalMatrix = mat4Transpose(mat4Inverse(model));
    
    // ユニフォームデータの更新
    const uniformData = new Float32Array(64);
    uniformData.set(mvpMatrix, 0);
    uniformData.set(model, 16);
    uniformData.set(normalMatrix, 32);
    uniformData.set([3, 3, 3], 48); // lightPosition
    uniformData.set([0, 0, 4], 52); // viewPosition
    
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
    
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
    pass.setIndexBuffer(indexBuffer, 'uint16');
    pass.drawIndexed(indices.length);
    pass.end();
    
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }
  
  render();
  console.log('フォンライティングを開始しました！');
}

// 球体メッシュを生成
function createSphere(radius, widthSegments, heightSegments) {
  const vertices = [];
  const indices = [];
  
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;
    
    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;
      
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      const nx = cosTheta * sinPhi;
      const ny = cosPhi;
      const nz = sinTheta * sinPhi;
      
      vertices.push(
        radius * nx, radius * ny, radius * nz,
        nx, ny, nz
      );
    }
  }
  
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = (widthSegments + 1) * y + x;
      const b = (widthSegments + 1) * (y + 1) + x;
      const c = (widthSegments + 1) * (y + 1) + (x + 1);
      const d = (widthSegments + 1) * y + (x + 1);
      
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
  
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices)
  };
}

// 行列計算関数（前のサンプルと同じ）
function mat4Perspective(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ]);
}

function mat4LookAt(eye, center, up) {
  const z = normalize(subtract(eye, center));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
  ]);
}

function mat4RotateY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, 0, s, 0,
    0, 1, 0, 0,
    -s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

function mat4Multiply(a, b) {
  const result = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + j] * b[i * 4 + k];
      }
      result[i * 4 + j] = sum;
    }
  }
  return result;
}

function mat4Transpose(m) {
  return new Float32Array([
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15]
  ]);
}

function mat4Inverse(m) {
  // 簡易的な逆行列（回転行列のみ対応）
  return mat4Transpose(m);
}

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

main().catch(console.error);`
};