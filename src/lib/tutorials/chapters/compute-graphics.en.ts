import type { TutorialChapterOverlay } from '../i18n';

export const overlay: TutorialChapterOverlay = {
	title: 'Advanced: Compute shaders and graphics',
	description: 'Combine GPGPU and graphics pipelines.',
	examples: {
		'particle-system': {
			title: 'Particle system',
			description: 'Update particles with a compute shader.',
			steps: [
				{
					title: 'Compute shader basics',
					content: `Compute shaders are for general-purpose computation, not just drawing.

**Characteristics:**
- Optimized for parallel work.
- Great for large data sets.
- Independent of the graphics pipeline.

**Workgroups:**
- Group multiple threads together.
- Shared memory within a group.
- Can have a 3D size.`,
					task: 'Update particle positions in a compute shader.'
				},
				{
					title: 'Storage buffers',
					content: `Storage buffers are large, read/write buffers.

**Characteristics:**
- Large (at least 128 MB).
- Both readable and writable.
- Can hold arrays of structs.

**Uses:**
- Particle data.
- Physics simulation.
- Image-processing intermediates.`,
					task: 'Store particle data in a storage buffer.',
					hint: 'Use the read_write access mode.'
				},
				{
					title: 'Bridging to graphics',
					content: `The same buffer can be shared between compute and graphics.

**Pipeline:**
1. Update data with a compute shader.
2. Use the same buffer as a vertex buffer.
3. Draw with the graphics pipeline.

**Note:** set the buffer usage flags appropriately.`,
					task: 'Draw the updated particles.'
				}
			],
			challenges: [
				{
					title: 'Attraction simulation',
					description: 'Make particles get attracted to the mouse position.',
					hint: 'Pass the mouse position as a uniform and compute attraction.'
				},
				{
					title: 'Particle trails',
					description: 'Add an effect that leaves trails behind particles.',
					hint: 'Avoid clearing the framebuffer fully — just darken it slightly.'
				}
			]
		},
		'image-processing': {
			title: 'Image-processing filters',
			description: 'Fast image processing with compute shaders.',
			steps: [
				{
					title: 'Image-processing basics',
					content: `Compute shaders are ideal for image processing.

**Why:**
- Per-pixel parallelism.
- Even complex filters run fast.
- Multi-pass processing is easy.

**Common filters:**
- Blur (Gaussian).
- Edge detection (Sobel).
- Color grading.`,
					task: 'Allow a texture to be used as storage.'
				},
				{
					title: 'Convolution filters',
					content: `Convolution filters consider surrounding pixels.

**Example 3×3 kernel:**
\`\`\`
[1 2 1]
[2 4 2] × 1/16  (Gaussian blur)
[1 2 1]
\`\`\`

**Implementation notes:**
- Handle edges carefully.
- Optimize with workgroups.`,
					task: 'Implement a Gaussian blur.',
					hint: 'Read neighboring pixels with textureLoad().'
				}
			],
			challenges: [
				{
					title: 'Custom filter',
					description: 'Implement an original filter (e.g. an oil-painting effect).',
					hint: 'Tally up surrounding pixel colors and pick the most common one.'
				},
				{
					title: 'Realtime video processing',
					description: 'Apply your filter to webcam video.',
					hint: 'Use getUserMedia for the video and update the texture each frame.'
				}
			]
		}
	}
};
