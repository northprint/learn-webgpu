import type { PlaygroundSample } from './index';

export const triangle: PlaygroundSample = {
	id: 'triangle',
	name: '基本的な三角形',
	javascript: `// 三角形のサンプル
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
  
  const shaderModule = device.createShaderModule({
    code: \`
      @vertex
      fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        var pos = array<vec2f, 3>(
          vec2f( 0.0,  0.5),
          vec2f(-0.5, -0.5),
          vec2f( 0.5, -0.5)
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
      
      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.2, 0.3, 1.0);
      }
    \`
  });
  
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shaderModule, entryPoint: 'vs_main' },
    fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });
  
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
  pass.draw(3);
  pass.end();
  
  device.queue.submit([encoder.finish()]);
  console.log('三角形を描画しました！');
}

main().catch(console.error);`
};