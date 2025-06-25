import type { TutorialChapter } from '$lib/webgpu/types';
import { gettingStartedChapter } from './chapters/getting-started';
import { firstTriangleChapter } from './chapters/first-triangle';
import { buffersAndUniformsChapter } from './chapters/buffers-and-uniforms';
import { texturesChapter } from './chapters/textures';
import { lightingChapter } from './chapters/lighting';
import { computeGraphicsChapter } from './chapters/compute-graphics';
import { performanceChapter } from './chapters/performance';

/**
 * Tutorial chapters definition
 */
export const tutorialChapters: TutorialChapter[] = [
	gettingStartedChapter,
	firstTriangleChapter,
	buffersAndUniformsChapter,
	texturesChapter,
	lightingChapter,
	computeGraphicsChapter,
	performanceChapter
];

/**
 * Get tutorial chapter by ID
 */
export function getTutorialChapter(id: string): TutorialChapter | undefined {
	return tutorialChapters.find(chapter => chapter.id === id);
}

/**
 * Get tutorial example by chapter ID and example ID
 */
export function getTutorialExample(chapterId: string, exampleId: string) {
	const chapter = getTutorialChapter(chapterId);
	if (!chapter) return undefined;
	
	return chapter.examples.find(example => example.id === exampleId);
}

/**
 * Get all tutorial chapters slugs for routing
 */
export function getAllTutorialSlugs(): string[] {
	const slugs: string[] = [];
	
	tutorialChapters.forEach(chapter => {
		chapter.examples.forEach(example => {
			slugs.push(`${chapter.id}/${example.id}`);
		});
	});
	
	return slugs;
}

/**
 * Get next example in the tutorial sequence
 */
export function getNextExample(chapterId: string, exampleId: string): { chapterId: string; exampleId: string } | null {
	const chapterIndex = tutorialChapters.findIndex(chapter => chapter.id === chapterId);
	if (chapterIndex === -1) return null;
	
	const chapter = tutorialChapters[chapterIndex];
	const exampleIndex = chapter.examples.findIndex(example => example.id === exampleId);
	if (exampleIndex === -1) return null;
	
	// 同じチャプター内に次の例題がある場合
	if (exampleIndex < chapter.examples.length - 1) {
		return {
			chapterId: chapter.id,
			exampleId: chapter.examples[exampleIndex + 1].id
		};
	}
	
	// 次のチャプターがある場合
	if (chapterIndex < tutorialChapters.length - 1) {
		const nextChapter = tutorialChapters[chapterIndex + 1];
		if (nextChapter.examples.length > 0) {
			return {
				chapterId: nextChapter.id,
				exampleId: nextChapter.examples[0].id
			};
		}
	}
	
	// 最後の例題の場合
	return null;
}