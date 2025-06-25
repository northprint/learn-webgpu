import type { PlaygroundSample } from './index';

export const texture: PlaygroundSample = {
	id: 'texture',
	name: 'テクスチャマッピング',
	javascript: `// テクスチャマッピングの例
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
  
  // 頂点データ（位置とUV座標）
  const vertices = new Float32Array([
    // position     // uv
    -0.8, -0.8,     0.0, 1.0,
     0.8, -0.8,     1.0, 1.0,
     0.8,  0.8,     1.0, 0.0,
    -0.8,  0.8,     0.0, 0.0,
  ]);
  
  const indices = new Uint16Array([
    0, 1, 2,
    0, 2, 3,
  ]);
  
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
  
  // チェッカーボードテクスチャを作成
  const textureSize = 256;
  const texture = device.createTexture({
    size: [textureSize, textureSize, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  
  // テクスチャデータを生成
  const textureData = new Uint8Array(textureSize * textureSize * 4);
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const i = (y * textureSize + x) * 4;
      const checker = ((Math.floor(x / 32) ^ Math.floor(y / 32)) & 1);
      const color = checker ? 255 : 64;
      textureData[i + 0] = color;     // R
      textureData[i + 1] = color * 0.7; // G
      textureData[i + 2] = color * 0.5; // B
      textureData[i + 3] = 255;        // A
    }
  }
  
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
  
  const shaderModule = device.createShaderModule({
    code: \`
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
      
      @group(0) @binding(0) var myTexture: texture_2d<f32>;
      @group(0) @binding(1) var mySampler: sampler;
      
      @fragment
      fn fs_main(input: VertexOutput) -> @location(0) vec4f {
        return textureSample(myTexture, mySampler, input.uv);
      }
    \`
  });
  
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'float' }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }
    ]
  });
  
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: texture.createView() },
      { binding: 1, resource: sampler }
    ]
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
      targets: [{ format: canvasFormat }]
    },
    primitive: {
      topology: 'triangle-list'
    }
  });
  
  function render() {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.2, g: 0.2, b: 0.3, a: 1.0 },
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
  }
  
  render();
  console.log('テクスチャマッピングを描画しました！');
}

main().catch(console.error);`
};