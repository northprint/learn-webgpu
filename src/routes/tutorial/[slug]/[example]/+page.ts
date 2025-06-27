import type { PageLoad } from './$types';
import { getTutorialChapter, getTutorialExample, getNextExample } from '$lib/tutorials';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const { slug: chapterId, example: exampleId } = params;
	
	// チャプターと例題を取得
	const chapter = await getTutorialChapter(chapterId);
	if (!chapter) {
		throw error(404, 'Chapter not found');
	}
	
	const example = await getTutorialExample(chapterId, exampleId);
	if (!example) {
		throw error(404, 'Example not found');
	}
	
	// 次の例題を取得
	const nextExample = await getNextExample(chapterId, exampleId);
	let nextChapter = null;
	let nextExampleInfo = null;
	
	if (nextExample) {
		nextChapter = await getTutorialChapter(nextExample.chapterId);
		if (nextChapter) {
			nextExampleInfo = await getTutorialExample(nextExample.chapterId, nextExample.exampleId);
		}
	}
	
	return {
		chapterId,
		exampleId,
		chapter,
		example,
		nextExample,
		nextChapter,
		nextExampleInfo
	};
};