import type { TutorialChapterOverlay } from '../i18n';

export const overlay: TutorialChapterOverlay = {
	title: 'Basics: Buffers and uniforms',
	description: 'Learn how to manage GPU memory and pass data into shaders.',
	examples: {
		'vertex-buffers': {
			title: 'Using vertex buffers',
			description: 'Store vertex data in GPU memory.',
			steps: [
				{
					title: 'Buffer basics',
					content: `A buffer is a region of GPU memory.

**Buffer usages:**
- **VERTEX** — vertex data.
- **INDEX** — index data.
- **UNIFORM** — uniform data.
- **STORAGE** — general-purpose storage.

**Creation steps:**
1. Create a buffer (specify size and usage).
2. Write data into it.
3. Use it in your pipeline.`,
					task: 'Create a vertex buffer and store the triangle vertices in it.'
				},
				{
					title: 'Defining the vertex layout',
					content: `The vertex layout describes how data is arranged in the buffer.

**Layout fields:**
- **arrayStride** — bytes per vertex.
- **attributes** — per-attribute info:
  - format: data type (e.g. float32x3).
  - offset: offset within the buffer.
  - shaderLocation: location in the shader.

**Important:** account for memory alignment when laying out data.`,
					task: 'Define a vertex layout that includes position and color.',
					hint: 'float32x3 is 12 bytes; float32x4 is 16 bytes.'
				},
				{
					title: 'Index buffers',
					content: `An index buffer lets you reuse vertices.

**Benefits:**
- Less memory.
- Better GPU vertex-cache utilization.

**Example: a quad**
- Vertex buffer only: 6 vertices (two triangles).
- With an index buffer: 4 vertices + 6 indices.`,
					task: 'Use an index buffer to draw a quad efficiently.'
				}
			],
			challenges: [
				{
					title: 'Draw a cube',
					description: 'Draw a cube using 8 vertices and 36 indices.',
					hint: 'Each face is made of two triangles.'
				},
				{
					title: 'Add another vertex attribute',
					description: 'Add UV coordinates and render a checkerboard pattern.',
					hint: 'Add a new attribute to the vertex layout.'
				}
			]
		},
		'uniforms': {
			title: 'Using uniforms',
			description: 'Manage data shared across an entire draw call.',
			steps: [
				{
					title: 'What is a uniform?',
					content: `A uniform is data shared by all vertices and fragments.

**Typical uses:**
- Transformation matrices (MVP).
- Time.
- Screen size.
- Light positions.

**Characteristics:**
- Read-only during a draw.
- Same value across every shader invocation.`,
					task: 'Create a uniform buffer.'
				},
				{
					title: 'Bind groups',
					content: `A bind group binds resources (buffers, textures) to a shader.

**Structure:**
- Layout — describes resource types and locations.
- Entries — actual resource bindings.

**Important:** the bind group must match the pipeline's layout.`,
					task: 'Bind the uniform buffer through a bind group.',
					hint: 'Use @group(0) @binding(0) in the shader.'
				},
				{
					title: 'Dynamic updates',
					content: `Updating uniforms each frame lets you animate.

**Update flow:**
1. Compute the new value.
2. Update GPU memory with writeBuffer().
3. Redraw.

**Note:** frequent updates can affect performance — update at the right moments.`,
					task: 'Create a triangle that rotates over time.'
				}
			],
			challenges: [
				{
					title: 'Follow the mouse',
					description: 'Make a shape follow the mouse cursor.',
					hint: 'Pass the mouse coordinates as a uniform.'
				},
				{
					title: 'Multiple uniforms',
					description: 'Use multiple transformation matrices to render shapes that move differently.',
					hint: 'Use multiple bindings.'
				}
			]
		}
	}
};
