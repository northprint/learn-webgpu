import type { PlaygroundSample } from './index';

export const fractal: PlaygroundSample = {
	id: 'fractal',
	name: 'マンデルブロ集合',
	javascript: `// マンデルブロ集合フラクタル
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
        let uv = (fragCoord.xy - resolution * 0.5) / min(resolution.x, resolution.y);
        
        // マンデルブロ集合の計算
        let c = vec2f(uv.x * 2.5 - 0.5, uv.y * 2.5);
        var z = vec2f(0.0, 0.0);
        var i = 0u;
        let maxIter = 100u;
        
        for (var iter = 0u; iter < maxIter; iter++) {
          let zz = z.x * z.x - z.y * z.y + c.x;
          z.y = 2.0 * z.x * z.y + c.y;
          z.x = zz;
          
          if (dot(z, z) > 4.0) {
            i = iter;
            break;
          }
        }
        
        let col = f32(i) / f32(maxIter);
        let color = vec3f(
          col * 8.0 - 1.5,
          col * 8.0 - 2.0,
          col * 8.0 - 0.5
        );
        
        return vec4f(saturate(color), 1.0);
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
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
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
  console.log('マンデルブロ集合を描画しました！');
}

main().catch(console.error);`
};