import type { PlaygroundSample } from './index';

export const postprocess: PlaygroundSample = {
	id: 'postprocess',
	name: 'グロー効果',
	javascript: `// シンプルなグロー効果のポストプロセス
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
  
  // レンダーターゲットの作成
  const renderTarget = device.createTexture({
    size: [canvas.width, canvas.height],
    format: canvasFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  });
  
  const blurTarget = device.createTexture({
    size: [canvas.width, canvas.height],
    format: canvasFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  });
  
  // サンプラー
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });
  
  // シーン描画用のシェーダー
  const sceneShaderModule = device.createShaderModule({
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
        let rotationMatrix = mat2x2f(vec2f(c, -s), vec2f(s, c));
        let rotatedPos = rotationMatrix * pos[vertexIndex] * 0.7;
        
        return vec4f(rotatedPos, 0.0, 1.0);
      }
      
      @fragment
      fn fs_main() -> @location(0) vec4f {
        // 明るい部分を作る
        return vec4f(1.0, 0.8, 0.3, 1.0);
      }
    \`
  });
  
  // ブラー用のシェーダー
  const blurShaderModule = device.createShaderModule({
    code: \`
      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var inputSampler: sampler;
      
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
        let texSize = vec2f(textureDimensions(inputTexture));
        let uv = fragCoord.xy / texSize;
        
        // 簡単なボックスブラー
        var color = vec4f(0.0);
        let blurSize = 4.0;
        var samples = 0.0;
        
        for (var x = -2; x <= 2; x++) {
          for (var y = -2; y <= 2; y++) {
            let offset = vec2f(f32(x), f32(y)) * blurSize / texSize;
            color += textureSample(inputTexture, inputSampler, uv + offset);
            samples += 1.0;
          }
        }
        
        return color / samples;
      }
    \`
  });
  
  // 合成用のシェーダー
  const compositeShaderModule = device.createShaderModule({
    code: \`
      @group(0) @binding(0) var sceneTexture: texture_2d<f32>;
      @group(0) @binding(1) var blurTexture: texture_2d<f32>;
      @group(0) @binding(2) var textureSampler: sampler;
      
      @vertex
      fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        var pos = array<vec2f, 3>(
          vec2f(-1.0, -1.0),
          vec2f( 3.0, -1.0),
          vec2f(-1.0,  3.0)
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
      
      @fragment
      fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
        let texSize = vec2f(textureDimensions(sceneTexture));
        let uv = fragCoord.xy / texSize;
        
        let scene = textureSample(sceneTexture, textureSampler, uv);
        let blur = textureSample(blurTexture, textureSampler, uv);
        
        // グロー効果を追加
        let glow = blur * 1.5;
        return scene + glow * 0.5;
      }
    \`
  });
  
  // ユニフォームバッファ
  const uniformBuffer = device.createBuffer({
    size: 32, // struct Uniforms { time: f32, padding: vec3f } = 16バイト、16バイトアラインメントで32バイト
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  
  // パイプラインの作成
  const scenePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: sceneShaderModule, entryPoint: 'vs_main' },
    fragment: { module: sceneShaderModule, entryPoint: 'fs_main', targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });
  
  const blurPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: blurShaderModule, entryPoint: 'vs_main' },
    fragment: { module: blurShaderModule, entryPoint: 'fs_main', targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });
  
  const compositePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: compositeShaderModule, entryPoint: 'vs_main' },
    fragment: { module: compositeShaderModule, entryPoint: 'fs_main', targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });
  
  // バインドグループ
  const sceneBindGroup = device.createBindGroup({
    layout: scenePipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer }
    }]
  });
  
  const blurBindGroup = device.createBindGroup({
    layout: blurPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: renderTarget.createView() },
      { binding: 1, resource: sampler }
    ]
  });
  
  const compositeBindGroup = device.createBindGroup({
    layout: compositePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: renderTarget.createView() },
      { binding: 1, resource: blurTarget.createView() },
      { binding: 2, resource: sampler }
    ]
  });
  
  let startTime = Date.now();
  
  function render() {
    const time = (Date.now() - startTime) / 1000;
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([time, 0, 0, 0]));
    
    const encoder = device.createCommandEncoder();
    
    // 1. シーンをレンダーターゲットに描画
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: renderTarget.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      pass.setPipeline(scenePipeline);
      pass.setBindGroup(0, sceneBindGroup);
      pass.draw(3);
      pass.end();
    }
    
    // 2. ブラー処理
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: blurTarget.createView(),
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      pass.setPipeline(blurPipeline);
      pass.setBindGroup(0, blurBindGroup);
      pass.draw(3);
      pass.end();
    }
    
    // 3. 最終合成
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      pass.setPipeline(compositePipeline);
      pass.setBindGroup(0, compositeBindGroup);
      pass.draw(3);
      pass.end();
    }
    
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }
  
  render();
  console.log('グロー効果を開始しました！');
}

main().catch(console.error);`
};