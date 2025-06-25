import type { PlaygroundSample } from './index';

export const animated: PlaygroundSample = {
	id: 'animated',
	name: '回転する三角形',
	javascript: `// アニメーション付き回転三角形
async function main() {
  const canvas = document.querySelector('canvas');
  
  // すでに初期化されたWebGPUコンテキストを使用
  let device, context, canvasFormat;
  if (window.webgpuDevice && window.webgpuContext && window.webgpuFormat) {
    device = window.webgpuDevice;
    context = window.webgpuContext;
    canvasFormat = window.webgpuFormat;
  } else {
    // フォールバック：通常の初期化
    const adapter = await navigator.gpu.requestAdapter();
    device = await adapter.requestDevice();
    context = canvas.getContext('webgpu');
    canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: canvasFormat });
  }
  
  console.log('Canvas size:', canvas.width, 'x', canvas.height);
  
  // ユニフォームバッファの作成
  const uniformBuffer = device.createBuffer({
    size: 32, // struct Uniforms { time: f32, padding: vec3f } = 4 + 12 = 16バイト、16バイトアラインメントで32バイト
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  
  const shaderModule = device.createShaderModule({
    code: \`
      struct Uniforms {
        time: f32,
        padding: vec3f,
      };
      
      @group(0) @binding(0) var<uniform> uniforms: Uniforms;
      
      @vertex
      fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        var pos = array<vec2f, 3>(
          vec2f( 0.0,  0.5),
          vec2f(-0.5, -0.5),
          vec2f( 0.5, -0.5)
        );
        
        let angle = uniforms.time;
        let c = cos(angle);
        let s = sin(angle);
        
        let rotationMatrix = mat2x2f(
          vec2f(c, -s),
          vec2f(s, c)
        );
        
        let rotatedPos = rotationMatrix * pos[vertexIndex];
        return vec4f(rotatedPos, 0.0, 1.0);
      }
      
      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(0.3, 0.7, 1.0, 1.0);
      }
    \`
  });
  
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
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
    vertex: { module: shaderModule, entryPoint: 'vs_main' },
    fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });
  
  let startTime = Date.now();
  
  function render() {
    const time = (Date.now() - startTime) / 1000;
    
    // ユニフォームバッファの更新
    const uniformData = new Float32Array([time, 0, 0, 0]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
    
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });
    
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3);
    pass.end();
    
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }
  
  render();
  console.log('回転アニメーションを開始しました！');
}

main().catch(console.error);`
};