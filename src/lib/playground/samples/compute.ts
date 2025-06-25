import type { PlaygroundSample } from './index';

export const compute: PlaygroundSample = {
	id: 'compute',
	name: 'ライフゲーム（コンピュートシェーダー）',
	javascript: `// Conway's Game of Life using compute shaders
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
  
  const GRID_SIZE = 128;
  const WORKGROUP_SIZE = 8;
  
  // グリッドデータ用のバッファを2つ作成（ダブルバッファリング）
  const cellStateBuffers = [0, 1].map(() =>
    device.createBuffer({
      size: GRID_SIZE * GRID_SIZE * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
  );
  
  // 初期状態をランダムに設定
  const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
  for (let i = 0; i < cellStateArray.length; i++) {
    cellStateArray[i] = Math.random() > 0.7 ? 1 : 0;
  }
  device.queue.writeBuffer(cellStateBuffers[0], 0, cellStateArray);
  
  // コンピュートシェーダー
  const computeShaderCode = \`
    @group(0) @binding(0) var<storage, read> cellStateIn: array<u32>;
    @group(0) @binding(1) var<storage, read_write> cellStateOut: array<u32>;
    
    fn cellIndex(x: u32, y: u32) -> u32 {
      return (y % GRID_SIZEu) * GRID_SIZEu + (x % GRID_SIZEu);
    }
    
    fn cellActive(x: u32, y: u32) -> u32 {
      return cellStateIn[cellIndex(x, y)];
    }
    
    @compute @workgroup_size(WORKGROUP_SIZE, WORKGROUP_SIZE)
    fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
      let activeNeighbors = 
        cellActive(cell.x - 1, cell.y - 1) +
        cellActive(cell.x, cell.y - 1) +
        cellActive(cell.x + 1, cell.y - 1) +
        cellActive(cell.x - 1, cell.y) +
        cellActive(cell.x + 1, cell.y) +
        cellActive(cell.x - 1, cell.y + 1) +
        cellActive(cell.x, cell.y + 1) +
        cellActive(cell.x + 1, cell.y + 1);
      
      let i = cellIndex(cell.x, cell.y);
      
      // Conway's Game of Life rules
      if (cellStateIn[i] == 1u) {
        if (activeNeighbors < 2u || activeNeighbors > 3u) {
          cellStateOut[i] = 0u;
        } else {
          cellStateOut[i] = 1u;
        }
      } else {
        if (activeNeighbors == 3u) {
          cellStateOut[i] = 1u;
        } else {
          cellStateOut[i] = 0u;
        }
      }
    }
  \`.replace(/GRID_SIZE/g, GRID_SIZE.toString()).replace(/WORKGROUP_SIZE/g, WORKGROUP_SIZE.toString());
  
  const computeShaderModule = device.createShaderModule({ code: computeShaderCode });
  
  // レンダリング用シェーダー
  const renderShaderCode = \`
    @group(0) @binding(0) var<storage, read> cellState: array<u32>;
    
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) cell: vec2f,
    };
    
    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
      var pos = array<vec2f, 6>(
        vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1),
        vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1)
      );
      
      let i = f32(instanceIndex);
      let cell = vec2f(i % GRID_SIZEf, floor(i / GRID_SIZEf));
      let cellOffset = (cell / GRID_SIZEf) * 2 - 1;
      let gridSize = 2.0 / GRID_SIZEf;
      
      var output: VertexOutput;
      output.position = vec4f(pos[vertexIndex] * gridSize * 0.9 + cellOffset + gridSize / 2, 0, 1);
      output.cell = cell;
      return output;
    }
    
    @fragment
    fn fs_main(input: VertexOutput) -> @location(0) vec4f {
      let i = u32(input.cell.y) * GRID_SIZEu + u32(input.cell.x);
      let state = f32(cellState[i]);
      return vec4f(state, state * 0.5, state * 0.2, 1);
    }
  \`.replace(/GRID_SIZE/g, GRID_SIZE.toString());
  
  const renderShaderModule = device.createShaderModule({ code: renderShaderCode });
  
  // バインドグループレイアウト
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }
    ]
  });
  
  // バインドグループ（2つ作成）
  const bindGroups = [0, 1].map((i) =>
    device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: cellStateBuffers[i] } },
        { binding: 1, resource: { buffer: cellStateBuffers[1 - i] } }
      ]
    })
  );
  
  // パイプライン
  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    compute: { module: computeShaderModule, entryPoint: 'computeMain' }
  });
  
  const renderPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: { module: renderShaderModule, entryPoint: 'vs_main' },
    fragment: { module: renderShaderModule, entryPoint: 'fs_main', targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });
  
  let step = 0;
  function render() {
    const encoder = device.createCommandEncoder();
    
    // コンピュートパス（シミュレーション更新）
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);
    computePass.dispatchWorkgroups(
      Math.ceil(GRID_SIZE / WORKGROUP_SIZE),
      Math.ceil(GRID_SIZE / WORKGROUP_SIZE)
    );
    computePass.end();
    
    step++;
    
    // レンダーパス
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0.1, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });
    
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, bindGroups[step % 2]);
    renderPass.draw(6, GRID_SIZE * GRID_SIZE);
    renderPass.end();
    
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }
  
  requestAnimationFrame(render);
  console.log('ライフゲームを開始しました！');
}

main().catch(console.error);`
};