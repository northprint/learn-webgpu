import type { PlaygroundSample } from './index';

export const particles: PlaygroundSample = {
	id: 'particles',
	name: 'パーティクルシステム',
	javascript: `// パーティクルシステム - 三角形を使用
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
  
  const NUM_PARTICLES = 100;
  
  // パーティクルごとのデータ
  const particleData = new Float32Array(NUM_PARTICLES * 4); // x, y, vx, vy
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const offset = i * 4;
    particleData[offset + 0] = (Math.random() - 0.5) * 2; // x
    particleData[offset + 1] = (Math.random() - 0.5) * 2; // y
    particleData[offset + 2] = (Math.random() - 0.5) * 0.02; // vx
    particleData[offset + 3] = (Math.random() - 0.5) * 0.02; // vy
  }
  
  const particleBuffer = device.createBuffer({
    size: particleData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(particleBuffer, 0, particleData);
  
  const shaderModule = device.createShaderModule({
    code: \`
      struct Particle {
        @location(0) pos: vec2f,
        @location(1) vel: vec2f,
      };
      
      @vertex
      fn vs_main(
        particle: Particle,
        @builtin(vertex_index) vertexIndex: u32,
        @builtin(instance_index) instanceIndex: u32
      ) -> @builtin(position) vec4f {
        // 小さな三角形を各パーティクル位置に描画
        var offset = array<vec2f, 3>(
          vec2f(0.0, 0.02),
          vec2f(-0.015, -0.01),
          vec2f(0.015, -0.01)
        );
        return vec4f(particle.pos + offset[vertexIndex], 0.0, 1.0);
      }
      
      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.7, 0.3, 0.8);
      }
    \`
  });
  
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: [{
        arrayStride: 16,
        stepMode: 'instance',
        attributes: [
          { format: 'float32x2', offset: 0, shaderLocation: 0 },
          { format: 'float32x2', offset: 8, shaderLocation: 1 }
        ]
      }]
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{
        format: canvasFormat,
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one',
            operation: 'add'
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one',
            operation: 'add'
          }
        }
      }]
    },
    primitive: { topology: 'triangle-list' }
  });
  
  function updateParticles() {
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const offset = i * 4;
      
      // 位置を更新
      particleData[offset + 0] += particleData[offset + 2];
      particleData[offset + 1] += particleData[offset + 3];
      
      // 重力
      particleData[offset + 3] -= 0.0001;
      
      // 画面端で跳ね返る
      if (Math.abs(particleData[offset + 0]) > 1.0) {
        particleData[offset + 2] *= -0.8;
        particleData[offset + 0] = Math.sign(particleData[offset + 0]) * 1.0;
      }
      if (particleData[offset + 1] < -1.0) {
        particleData[offset + 3] *= -0.8;
        particleData[offset + 1] = -1.0;
        // 摩擦
        particleData[offset + 2] *= 0.9;
      }
    }
    
    device.queue.writeBuffer(particleBuffer, 0, particleData);
  }
  
  function frame() {
    updateParticles();
    
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.1, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });
    
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, particleBuffer);
    pass.draw(3, NUM_PARTICLES);
    pass.end();
    
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }
  
  requestAnimationFrame(frame);
  console.log('パーティクルシステム開始！');
}

main().catch(console.error);`
};