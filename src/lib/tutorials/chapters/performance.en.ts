import type { TutorialChapterOverlay } from '../i18n';

export const overlay: TutorialChapterOverlay = {
	title: 'Expert: Performance optimization',
	description: 'Learn techniques to make WebGPU applications fast.',
	examples: {
		'instancing': {
			title: 'Instancing',
			description: 'Render many objects efficiently.',
			steps: [
				{
					title: 'What is instancing?',
					content: `Instancing lets you draw the same mesh many times in one go.

**Problems with the naive approach:**
- One draw command per object.
- Huge CPU overhead.
- Underuses GPU parallelism.

**Benefits of instancing:**
- A single draw command produces many objects.
- Efficient use of GPU memory.
- Each instance can have its own data.`,
					task: 'Implement basic instanced rendering.'
				},
				{
					title: 'Per-instance data',
					content: `You can pass per-instance data into the shaders.

**Common per-instance data:**
- Position / transform matrix.
- Color.
- Scale.
- Rotation.

**Buffer settings:**
Use stepMode: 'instance' so data advances per instance rather than per vertex.`,
					task: 'Give each instance a different position and color.',
					hint: 'Use @builtin(instance_index) to get the instance ID.'
				},
				{
					title: 'LOD (Level of Detail)',
					content: `Adjust detail by distance to boost performance.

**LOD techniques:**
- Swap meshes based on distance.
- Reduce vertex count.
- Simplify shaders.

**Automatic LOD:**
Use GPU queries to measure render time and adjust dynamically.`,
					task: 'Change each instance\'s level of detail based on distance.'
				}
			]
		},
		'optimization-techniques': {
			title: 'Optimization techniques',
			description: 'Manage huge numbers of instances efficiently.',
			steps: [
				{
					title: 'Batched rendering',
					content: `Render multiple mesh types efficiently.

**Techniques:**
- Combine different meshes into one buffer.
- Pick a mesh type per instance.
- Select the right mesh inside the vertex shader.

**Benefits:**
- Fewer draw calls.
- Better GPU utilization.`,
					task: 'Render three mesh types efficiently.'
				},
				{
					title: 'Color variation',
					content: `Give large instance counts visual variety.

**How:**
- Derive color from the instance ID.
- Apply gradients or patterns.
- Vary color dynamically.

**Effect:**
- Visually more interesting output.
- Easier to tell individual instances apart.`,
					task: 'Vary each instance\'s color based on its position.',
					hint: 'You can compute the color from the instance position.'
				},
				{
					title: 'Animation',
					content: `Animate huge instance counts dynamically.

**Techniques:**
- Update positions inside the GPU.
- Wave-like motion.
- Rotation animations.

**Performance tips:**
- Do the math in the shader.
- Minimize CPU→GPU transfers.`,
					task: 'Add a wave-like animation to the instances.'
				}
			]
		}
	}
};
