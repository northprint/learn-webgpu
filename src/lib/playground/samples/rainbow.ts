import type { PlaygroundSample } from './index';

export const rainbow: PlaygroundSample = {
	id: 'rainbow',
	name: 'レインボー三角形',
	javascript: `// 頂点カラーを使用したレインボー三角形
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
      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec3f,
      };
      
      @vertex
      fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
        var pos = array<vec2f, 3>(
          vec2f( 0.0,  0.7),
          vec2f(-0.7, -0.7),
          vec2f( 0.7, -0.7)
        );
        
        var colors = array<vec3f, 3>(
          vec3f(1.0, 0.0, 0.0), // 赤
          vec3f(0.0, 1.0, 0.0), // 緑
          vec3f(0.0, 0.0, 1.0)  // 青
        );
        
        var output: VertexOutput;
        output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
        output.color = colors[vertexIndex];
        return output;
      }
      
      @fragment
      fn fs_main(input: VertexOutput) -> @location(0) vec4f {
        return vec4f(input.color, 1.0);
      }
    \`
  });
  
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shaderModule, entryPoint: 'vs_main' },
    fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });
  
  function render() {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });
    
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();
    
    device.queue.submit([encoder.finish()]);
  }
  
  render();
  console.log('レインボー三角形を描画しました！');
}

main().catch(console.error);`
};