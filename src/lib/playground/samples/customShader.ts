import type { PlaygroundSample } from './index';

export const customShader: PlaygroundSample = {
	id: 'customShader',
	name: 'カスタムシェーダー',
	vertexShader: `@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 6>(
    // 第一の三角形
    vec2f(-0.5, -0.5),
    vec2f( 0.5, -0.5),
    vec2f( 0.0,  0.5),
    // 第二の三角形  
    vec2f(-0.3,  0.3),
    vec2f( 0.3,  0.3),
    vec2f( 0.0, -0.7)
  );
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}`,
	fragmentShader: `@fragment
fn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  // 座標に基づいたグラデーション
  let resolution = vec2f(600.0, 450.0); // キャンバスサイズに合わせる
  let uv = fragCoord.xy / resolution;
  
  // 時間ベースのアニメーション（実際のタイムスタンプの代わりに座標を使用）
  let time = uv.x + uv.y;
  
  // 虹色のグラデーション
  let r = sin(time * 6.28318 + 0.0) * 0.5 + 0.5;
  let g = sin(time * 6.28318 + 2.0944) * 0.5 + 0.5;
  let b = sin(time * 6.28318 + 4.18879) * 0.5 + 0.5;
  
  return vec4f(r, g, b, 1.0);
}`,
	javascript: `// カスタムシェーダーサンプル
// 頂点シェーダーとフラグメントシェーダーのタブを使用します
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
  
  // カスタムシェーダーコードを取得
  // プレイグラウンドの頂点シェーダーとフラグメントシェーダータブから取得されます
  const vertexShaderCode = window.vertexShaderCode || '@vertex\\nfn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {\\n  var pos = array<vec2f, 6>(\\n    // 第一の三角形\\n    vec2f(-0.5, -0.5),\\n    vec2f( 0.5, -0.5),\\n    vec2f( 0.0,  0.5),\\n    // 第二の三角形\\n    vec2f(-0.3,  0.3),\\n    vec2f( 0.3,  0.3),\\n    vec2f( 0.0, -0.7)\\n  );\\n  return vec4f(pos[vertexIndex], 0.0, 1.0);\\n}';
  
  const fragmentShaderCode = window.fragmentShaderCode || '@fragment\\nfn fs_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {\\n  // 座標に基づいたグラデーション\\n  let resolution = vec2f(600.0, 450.0); // キャンバスサイズに合わせる\\n  let uv = fragCoord.xy / resolution;\\n  \\n  // 時間ベースのアニメーション（実際のタイムスタンプの代わりに座標を使用）\\n  let time = uv.x + uv.y;\\n  \\n  // 虹色のグラデーション\\n  let r = sin(time * 6.28318 + 0.0) * 0.5 + 0.5;\\n  let g = sin(time * 6.28318 + 2.0944) * 0.5 + 0.5;\\n  let b = sin(time * 6.28318 + 4.18879) * 0.5 + 0.5;\\n  \\n  return vec4f(r, g, b, 1.0);\\n}';
  
  try {
    // シェーダーモジュールの作成
    const shaderModule = device.createShaderModule({
      code: vertexShaderCode + '\\n' + fragmentShaderCode
    });
    
    // パイプラインの作成
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main'
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
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store'
        }]
      });
      
      pass.setPipeline(pipeline);
      pass.draw(6); // 2つの三角形 = 6頂点
      pass.end();
      
      device.queue.submit([encoder.finish()]);
    }
    
    render();
    console.log('カスタムシェーダーを正常に実行しました！');
    console.log('頂点シェーダーとフラグメントシェーダータブでコードを編集してください。');
    
  } catch (error) {
    console.error('シェーダーのコンパイルエラー:', error);
    console.log('頂点シェーダーとフラグメントシェーダータブのコードを確認してください。');
  }
}

// シェーダーコードの更新を監視
if (window.shaderUpdateCallback) {
  window.shaderUpdateCallback(() => {
    console.log('シェーダーが更新されました。再実行してください。');
  });
}

main().catch(console.error);`
};