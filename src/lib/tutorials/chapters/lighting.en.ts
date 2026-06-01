import type { TutorialChapterOverlay } from '../i18n';

export const overlay: TutorialChapterOverlay = {
	title: 'Advanced: Lighting and shading',
	description: 'Learn how to represent light and shading in 3D graphics.',
	examples: {
		'phong-lighting': {
			title: 'The Phong lighting model',
			description: 'Implement a fundamental lighting model.',
			steps: [
				{
					title: 'Lighting fundamentals',
					content: `Lighting is what gives 3D objects their sense of volume.

**The three Phong components:**
- **Ambient** — a cheap approximation of indirect light.
- **Diffuse** — how rough surfaces scatter light.
- **Specular** — highlights on smooth surfaces.

**What you need:**
- Per-vertex/fragment normals.
- Light position and direction.
- Camera position.
- Material properties.`,
					task: 'Render a 3D cube with only ambient light first.'
				},
				{
					title: 'Diffuse lighting',
					content: `Diffuse light varies with the angle between the light and the surface.

**Lambert's cosine law:**
\`\`\`
diffuse = max(dot(normal, lightDir), 0.0) * lightColor * materialColor
\`\`\`

**Important points:**
- Use the dot product of the normal and the light direction.
- Clamp negatives to 0 (back faces aren't lit).
- Multiply by light and material color.`,
					task: 'Add diffuse lighting on top of the ambient term.',
					hint: 'Compute dot(normal, lightDir) and clamp to >= 0.'
				},
				{
					title: 'Specular lighting',
					content: `Specular adds view-dependent highlights to smooth surfaces.

**Phong reflection model:**
\`\`\`
reflectDir = reflect(-lightDir, normal)
specular = pow(max(dot(viewDir, reflectDir), 0.0), shininess)
\`\`\`

**Parameters:**
- shininess — sharpness of the highlight (higher = tighter).
- Intensity follows how well the view direction matches the reflection.`,
					task: 'Implement the full Phong lighting model.'
				}
			],
			challenges: [
				{
					title: 'Material properties',
					description: 'Express different materials (metal, plastic, rubber).',
					hint: 'Tune the ambient/diffuse/specular coefficients.'
				},
				{
					title: 'Colored lights',
					description: 'Place RGB lights and observe how their colors mix.',
					hint: 'Set the light color to vec3f(1,0,0), etc.'
				},
				{
					title: 'Blinn–Phong',
					description: 'Implement the more efficient Blinn–Phong lighting model.',
					hint: 'Use the half vector to simplify the math.'
				}
			]
		},
		'advanced-lighting': {
			title: 'Advanced lighting techniques',
			description: 'Multiple lights and different light types.',
			steps: [
				{
					title: 'Handling multiple lights',
					content: `Real scenes have many light sources.

**How to handle multiple lights:**
- Store light data in arrays.
- Sum each light's contribution.
- Balance quality and performance.

**Things to consider:**
- A maximum-light cap.
- Distance attenuation.
- Per-light enable/disable.`,
					task: 'Implement three point lights with different colors.'
				},
				{
					title: 'Light types',
					content: `Different light types have different characteristics.

**Directional light:**
- Parallel rays, like sunlight.
- Only a direction, no position.
- No attenuation.

**Point light:**
- Like a light bulb.
- Radiates in all directions.
- Distance attenuation.

**Spot light:**
- Like a flashlight, a cone of light.
- Has both a direction and an angle.
- Attenuates with distance and angle.`,
					task: 'Add a point light and a spot light.',
					hint: 'For spot lights, use dot(lightDir, spotDir) to compute the angle.'
				},
				{
					title: 'Normal mapping basics',
					content: `Normal maps fake surface detail without adding geometry.

**How they work:**
- Normals are stored in a texture.
- Transform from tangent space to world space.
- Per-pixel normal perturbation.

**Implementation notes:**
- Compute tangents and bitangents.
- Sample the normal map.
- Convert to world space.`,
					task: 'Implement a simple normal mapping pass.'
				}
			],
			challenges: [
				{
					title: 'Spot light',
					description: 'Implement a cone-shaped spot light.',
					hint: 'Combine direction and angle to compute attenuation.'
				},
				{
					title: 'Shadow mapping',
					description: 'Take on basic shadow mapping.',
					hint: 'Create a depth map from the light\'s point of view.'
				}
			]
		}
	}
};
