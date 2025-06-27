import type { TutorialChapter, TutorialExample } from '$lib/webgpu/types';
import { buildTranslatedChapter, getTranslatedInitialCode, getTranslatedSolutionCode } from '$lib/i18n/tutorial-helper';

// チャプターを動的に生成する関数
export async function getGettingStartedChapter(): Promise<TutorialChapter | null> {
  return buildTranslatedChapter('getting-started', (translations) => {
    const examples: TutorialExample[] = [];
    
    // WebGPU Init Example
    const webgpuInit = translations.examples.webgpuInit;
    if (webgpuInit) {
      examples.push({
			id: 'webgpu-init',
			title: webgpuInit.title,
			description: webgpuInit.description,
			steps: [
				{
					title: webgpuInit.steps.step1.title,
					content: webgpuInit.steps.step1.content,
					task: webgpuInit.steps.step1.task
				},
				{
					title: webgpuInit.steps.step2.title,
					content: webgpuInit.steps.step2.content,
					task: webgpuInit.steps.step2.task,
					hint: webgpuInit.steps.step2.hint
				},
				{
					title: webgpuInit.steps.step3.title,
					content: webgpuInit.steps.step3.content,
					task: webgpuInit.steps.step3.task
				}
			],
			initialCode: getTranslatedInitialCode(translations, 'webgpuInit', (comments) => 
`// ${comments.start}
async function initWebGPU() {
  // ${comments.checkSupport}
  // ${comments.checkSupportHint}
  
  
  // ${comments.getAdapter}
  // ${comments.getAdapterHint}
  
  
  // ${comments.getDevice}
  // ${comments.getDeviceHint}
  
  
  console.log('${comments.completeInit}');
  
  // ${comments.returnValues}
}

// ${comments.execute}
initWebGPU().catch(console.error);`
			),
			code: getTranslatedSolutionCode(translations, 'webgpuInit', (comments) => 
`// ${comments.title}
async function initWebGPU() {
  // ${comments.checkSupport}
  if (!navigator.gpu) {
    throw new Error('${comments.notSupported}');
  }
  
  // ${comments.getAdapter}
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('${comments.noAdapter}');
  }
  
  // ${comments.getDevice}
  const device = await adapter.requestDevice();
  
  console.log('${comments.success}');
  console.log('${comments.adapterInfo}', adapter);
  console.log('${comments.deviceInfo}', device);
  
  return { adapter, device };
}

// ${comments.execute}
initWebGPU().catch(console.error);`
			)
		});
		}
		
		// Canvas Setup Example
		const canvasSetup = translations.examples.canvasSetup;
		if (canvasSetup) {
			examples.push({
				id: 'canvas-setup',
				title: canvasSetup.title,
				description: canvasSetup.description,
				steps: [
					{
						title: canvasSetup.steps.step1.title,
						content: canvasSetup.steps.step1.content,
						task: canvasSetup.steps.step1.task
					},
					{
						title: canvasSetup.steps.step2.title,
						content: canvasSetup.steps.step2.content,
						task: canvasSetup.steps.step2.task,
						hint: canvasSetup.steps.step2.hint
					},
					{
						title: canvasSetup.steps.step3.title,
						content: canvasSetup.steps.step3.content,
						task: canvasSetup.steps.step3.task
					}
				],
				initialCode: getTranslatedInitialCode(translations, 'canvasSetup', (comments) => 
`// ${comments.title}
async function setupCanvas() {
  // ${comments.initWebGPU}
  const { adapter, device } = await initWebGPU();
  
  // ${comments.getCanvas}
  // ${comments.getCanvasHint}
  
  
  // ${comments.getContext}
  // ${comments.getContextHint}
  
  
  // ${comments.getFormat}
  // ${comments.getFormatHint}
  
  
  // ${comments.configure}
  // ${comments.configureHint}
  
  
  console.log('${comments.completeSetup}');
}

// ${comments.previousExample}
async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('${webgpuInit.solution.comments.notSupported}');
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('${webgpuInit.solution.comments.noAdapter}');
  }
  const device = await adapter.requestDevice();
  return { adapter, device };
}

// ${comments.execute}
setupCanvas().catch(console.error);`
				),
				code: getTranslatedSolutionCode(translations, 'canvasSetup', (comments) => 
`// ${comments.title}
async function setupCanvas() {
  // ${comments.initWebGPU}
  const { adapter, device } = await initWebGPU();
  
  // ${comments.getCanvas}
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    throw new Error('${comments.noCanvas}');
  }
  
  // ${comments.getContext}
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new Error('${comments.noContext}');
  }
  
  // ${comments.getFormat}
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  
  // ${comments.configure}
  context.configure({
    device: device,
    format: canvasFormat,
  });
  
  // ${comments.clearBackground}
  const encoder = device.createCommandEncoder();
  
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.0, g: 0.2, b: 0.4, a: 1.0 }, // ${comments.blueColor}
      loadOp: 'clear',
      storeOp: 'store',
    }]
  });
  
  pass.end();
  device.queue.submit([encoder.finish()]);
  
  console.log('${comments.complete}');
}

// ${comments.previousExample}
async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('${webgpuInit.solution.comments.notSupported}');
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('${webgpuInit.solution.comments.noAdapter}');
  }
  const device = await adapter.requestDevice();
  return { adapter, device };
}

// ${comments.execute}
setupCanvas().catch(console.error);`
				),
				challenges: canvasSetup.challenges?.map((challenge: any) => ({
					title: challenge.title,
					description: challenge.description,
					hint: challenge.hint
				}))
			});
		}
		
		return examples;
	});
}

// 後方互換性のためのデフォルトエクスポート
export const gettingStartedChapter: TutorialChapter = {
	id: 'getting-started',
	title: 'Loading...',
	description: 'Loading...',
	examples: []
};