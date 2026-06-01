import type { TutorialChapterOverlay } from '../i18n';

export const overlay: TutorialChapterOverlay = {
	title: 'Basics: Your first triangle',
	description: 'Learn the basic steps to draw a triangle with WebGPU.',
	examples: {
		'basic-triangle': {
			title: 'Drawing a basic triangle',
			description: 'Render using a vertex shader and a fragment shader.',
			steps: [
				{
					title: 'Shader basics',
					content: `WebGPU uses shaders to run drawing logic on the GPU.

**Main shader types:**
- **Vertex shader** — computes the position of each vertex.
- **Fragment shader** — computes the color of each pixel.

**WGSL (WebGPU Shading Language)**
A shading language designed for WebGPU with a Rust-like syntax.`,
					task: 'Define the triangle vertex positions in the vertex shader.'
				},
				{
					title: 'The render pipeline',
					content: `A render pipeline bundles up the settings for a draw call.

**Pipeline settings:**
- Shader modules
- Vertex buffer layout
- Primitive topology (triangle, line, …)
- Color format

**Key idea:**
A pipeline is immutable once created.`,
					task: 'Create a render pipeline and wire your shaders into it.'
				},
				{
					title: 'Render commands',
					content: `WebGPU records GPU instructions through a command encoder.

**Rendering flow:**
1. Create a command encoder.
2. Begin a render pass.
3. Set the pipeline.
4. Issue draw commands.
5. End the render pass.
6. Submit the command buffer.`,
					task: 'Run the draw command and display the triangle.',
					hint: 'Pass the vertex count to draw().'
				}
			],
			challenges: [
				{
					title: 'Colorful triangle',
					description: 'Set a different color on each vertex to create a gradient triangle.',
					hint: 'Pass color data from the vertex shader and use the interpolated value in the fragment shader.'
				},
				{
					title: 'Multiple triangles',
					description: 'Draw three triangles at different positions on the screen.',
					hint: 'Expand the vertex data and increase the vertex count in draw().'
				}
			]
		},
		'colored-triangle': {
			title: 'A colorful triangle',
			description: 'Understand per-vertex color and interpolation.',
			steps: [
				{
					title: 'Adding vertex attributes',
					content: `Vertices can carry more than just position.

**Attribute examples:**
- position
- color
- uv (texture coordinates)
- normal

**Passing data between shaders:**
Use \`@location\` to forward data from the vertex shader to the fragment shader.`,
					task: 'Add a color attribute to the vertex shader.'
				},
				{
					title: 'How interpolation works',
					content: `The GPU automatically interpolates values between vertices.

**Interpolation modes:**
- **perspective** — perspective-correct interpolation (default).
- **linear** — linear interpolation.
- **flat** — no interpolation (uses the first vertex's value).

This is what gives vertex colors smooth gradients.`,
					task: 'Set a different color on each vertex and observe the interpolation.'
				}
			],
			challenges: [
				{
					title: 'HSV color',
					description: 'Use HSV color space to create a rainbow gradient.',
					hint: 'Implement an HSV→RGB conversion in the fragment shader.'
				},
				{
					title: 'Animation',
					description: 'Animate the colors over time.',
					hint: 'Pass the elapsed time through a uniform buffer.'
				}
			]
		}
	}
};
