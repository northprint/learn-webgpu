import type { TutorialChapterOverlay } from '../i18n';

export const overlay: TutorialChapterOverlay = {
	title: 'Advanced: Textures and sampling',
	description: 'Learn how to handle image data and apply texture mapping.',
	examples: {
		'basic-texture': {
			title: 'Basic texture mapping',
			description: 'Apply an image to a polygon.',
			steps: [
				{
					title: 'Texture basics',
					content: `A texture is image data living on the GPU.

**Texture uses:**
- Displaying images.
- Normal maps.
- Depth maps.
- Render targets.

**Key concepts:**
- **UV coordinates** — positions in texture space (0.0–1.0).
- **Sampler** — defines how the texture is read.
- **Mipmaps** — textures at multiple resolutions.`,
					task: 'Create a texture and load image data into it.'
				},
				{
					title: 'Configuring a sampler',
					content: `A sampler controls how textures are read.

**Filtering:**
- **nearest** — nearest-neighbor (good for pixel art).
- **linear** — linear interpolation (good for smooth images).

**Addressing modes:**
- **clamp-to-edge** — clamp at the edge.
- **repeat** — tile.
- **mirror-repeat** — tile mirrored.`,
					task: 'Experiment with different sampler settings.',
					hint: 'Push the UV coordinates above 1.0 to see addressing mode differences.'
				},
				{
					title: 'Texture coordinates',
					content: `UV coordinates locate a point within a texture.

**Coordinate system:**
- U (horizontal): 0.0 (left) — 1.0 (right).
- V (vertical): 0.0 (top) — 1.0 (bottom).

**Note:** WebGPU's Y axis points down (opposite of OpenGL).`,
					task: 'Adjust the UV coordinates to display only a portion of the texture.'
				}
			],
			challenges: [
				{
					title: 'Gradient texture',
					description: 'Generate a rainbow gradient texture.',
					hint: 'Convert HSV to RGB.'
				},
				{
					title: 'Texture animation',
					description: 'Scroll the texture by animating the UV coordinates over time.',
					hint: 'Pass time through a uniform buffer.'
				}
			]
		},
		'multiple-textures': {
			title: 'Compositing multiple textures',
			description: 'Blend textures together for richer visuals.',
			steps: [
				{
					title: 'Using multiple textures',
					content: `Combining multiple textures lets you express more complex looks.

**Common combinations:**
- Diffuse map + normal map.
- Color texture + mask texture.
- Base texture + decal texture.

**Note:** there is a limit to how many bindings you can use (typically 16+).`,
					task: 'Prepare two textures.'
				},
				{
					title: 'Blending textures',
					content: `There are several ways to blend textures in the shader.

**Blend modes:**
- **Additive**: color1 + color2
- **Multiply**: color1 * color2
- **Lerp**: mix(color1, color2, factor)
- **Screen**: 1 - (1 - color1) * (1 - color2)`,
					task: 'Implement different blend modes.',
					hint: 'mix() makes interpolation simple.'
				}
			],
			challenges: [
				{
					title: 'Triple blend',
					description: 'Combine three textures for a more complex blend.',
					hint: 'Use the third texture as a blend factor.'
				},
				{
					title: 'Normal mapping',
					description: 'Use a normal map to fake surface detail.',
					hint: 'Convert the normal map RGB values to a normal vector.'
				}
			]
		}
	}
};
