import type { PlaygroundSample } from './index';

export const wave: PlaygroundSample = {
	id: 'wave',
	name: '波のアニメーション',
	javascript: `// 波のアニメーション
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
  
  // ユニフォームバッファ
  const uniformBuffer = device.createBuffer({
    size: 32, // struct Uniforms { time: f32, padding: vec3f } = 16バイト、16バイトアラインメントで32バイト
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
        // フルスクリーンの三角形
        var pos = array<vec2f, 3>(
          vec2f(-1.0, -1.0),
          vec2f( 3.0, -1.0),
          vec2f(-1.0,  3.0)
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
      
      @fragment
      fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
        let resolution = vec2f(600.0, 450.0);
        let uv = fragCoord.xy / resolution;
        
        // 複数の波を重ね合わせる
        var wave = 0.0;
        wave += sin(uv.x * 10.0 + uniforms.time * 2.0) * 0.1;
        wave += sin(uv.x * 20.0 - uniforms.time * 3.0) * 0.05;
        wave += sin(uv.x * 30.0 + uniforms.time * 4.0) * 0.03;
        
        let centerY = 0.5 + wave;
        let thickness = 0.02;
        let d = abs(uv.y - centerY);
        
        // 波の色
        let waveColor = vec3f(0.2, 0.6, 1.0);
        let bgColor = vec3f(0.05, 0.05, 0.1);
        
        // アンチエイリアシング
        let edge = smoothstep(thickness, thickness + 0.01, d);
        var color = mix(waveColor, bgColor, edge);
        
        // グロー効果
        let glow = exp(-d * 30.0) * 0.5;
        color += waveColor * glow;
        
        return vec4f(color, 1.0);
      }
    \`
  });
  
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
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
        clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
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
  console.log('波のアニメーションを開始しました！');
}

main().catch(console.error);`
};