export interface PlaygroundSample {
	id: string;
	name: string;
	javascript: string;
	vertexShader?: string;
	fragmentShader?: string;
}

import { triangle } from './triangle';
import { rainbow } from './rainbow';
import { animated } from './animated';
import { particles } from './particles';
import { fractal } from './fractal';
import { wave } from './wave';
import { cube3d } from './cube3d';
import { compute } from './compute';
import { texture } from './texture';
import { lighting } from './lighting';
import { postprocess } from './postprocess';
import { customShader } from './customShader';

export const samples: Record<string, PlaygroundSample> = {
	triangle,
	rainbow,
	animated,
	particles,
	fractal,
	wave,
	'3dcube': cube3d,
	compute,
	texture,
	lighting,
	postprocess,
	'custom-shader': customShader,
};