import type { TutorialChapterOverlay } from '../i18n';

export const overlay: TutorialChapterOverlay = {
	title: 'Basics: WebGPU concepts and setup',
	description: 'Understand the core WebGPU concepts and prepare your environment.',
	examples: {
		'webgpu-init': {
			title: 'Initializing WebGPU',
			description: 'Learn how to obtain a WebGPU adapter and device.',
			steps: [
				{
					title: 'WebGPU concepts',
					content: `WebGPU is a new API that brings high-performance graphics and compute to the web.

**Key concepts:**
- **Adapter** — represents access to a physical GPU.
- **Device** — your interface for talking to that GPU.
- **Queue** — handles command submission to the GPU.

Let's start by checking whether WebGPU is available.`,
					task: 'Run the code until the console shows "WebGPU initialized successfully!"'
				},
				{
					title: 'Getting an adapter',
					content: `Use \`navigator.gpu.requestAdapter()\` to get a GPU adapter.

You can optionally pass:
- \`powerPreference\`: 'low-power' or 'high-performance'
- \`forceFallbackAdapter\`: force a software implementation`,
					task: 'Modify the code to request an adapter in high-performance mode.',
					hint: 'Pass { powerPreference: "high-performance" } to requestAdapter().'
				},
				{
					title: 'Creating a device',
					content: `Create a device from the adapter using \`requestDevice()\`.

The device is what you actually use for GPU work:
- Creating buffers
- Creating textures
- Compiling shaders
- Building render pipelines`,
					task: 'Confirm the device was created and inspect its capabilities.'
				}
			]
		},
		'canvas-setup': {
			title: 'Canvas setup',
			description: 'Prepare a canvas to render with WebGPU.',
			steps: [
				{
					title: 'Getting the canvas context',
					content: `To draw with WebGPU you first need the canvas's WebGPU context.

**Steps:**
1. Get the canvas element.
2. Call \`getContext('webgpu')\` on it.
3. Configure it with a device and format.`,
					task: 'Get the WebGPU context from the canvas.'
				},
				{
					title: 'Configuring the swap chain',
					content: `The swap chain manages the textures presented to the screen.

**Configuration:**
- \`device\`: the GPU device to use.
- \`format\`: the texture format (commonly 'bgra8unorm').
- \`usage\`: how the texture will be used.`,
					task: 'Configure the canvas context and clear it to a background color.',
					hint: 'Use context.configure().'
				},
				{
					title: 'Your first draw',
					content: `Use a command encoder to record draw commands.

**Basic flow:**
1. Create a command encoder.
2. Begin a render pass.
3. Record draw commands.
4. Submit the command buffer.`,
					task: 'Clear the background to blue.'
				}
			],
			challenges: [
				{
					title: 'Different background colors',
					description: 'Change the background to other colors (e.g. red, green, yellow).',
					hint: 'Edit the r, g, b components of clearValue.'
				},
				{
					title: 'Animated background',
					description: 'Animate the background color over time.',
					hint: 'Use requestAnimationFrame() and update the color each frame.'
				}
			]
		}
	}
};
