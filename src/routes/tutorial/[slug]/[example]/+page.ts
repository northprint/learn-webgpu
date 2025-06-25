import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getTutorialExample } from '$lib/tutorials/index.js';

export const load: PageLoad = ({ params }) => {
	const { slug: chapterId, example: exampleId } = params;
	
	// チュートリアルの例を取得
	const example = getTutorialExample(chapterId, exampleId);
	
	if (!example) {
		error(404, 'チュートリアルが見つかりません');
	}
	
	return {
		chapterId,
		exampleId,
		example
	};
};