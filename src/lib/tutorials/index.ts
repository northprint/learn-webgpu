import type { TutorialChapter } from '$lib/webgpu/types';
import { getGettingStartedChapter } from './chapters/getting-started';
import { firstTriangleChapter } from './chapters/first-triangle';
import { buffersAndUniformsChapter } from './chapters/buffers-and-uniforms';
import { texturesChapter } from './chapters/textures';
import { lightingChapter } from './chapters/lighting';
import { computeGraphicsChapter } from './chapters/compute-graphics';
import { performanceChapter } from './chapters/performance';

// チャプターIDのリスト
const chapterIds = [
	'getting-started',
	'first-triangle',
	'buffers-and-uniforms',
	'textures',
	'lighting',
	'compute-graphics',
	'performance'
];

// 各チャプターのローダー関数
const chapterLoaders: Record<string, () => Promise<TutorialChapter | null>> = {
	'getting-started': getGettingStartedChapter,
	'first-triangle': async () => firstTriangleChapter,
	'buffers-and-uniforms': async () => buffersAndUniformsChapter,
	'textures': async () => texturesChapter,
	'lighting': async () => lightingChapter,
	'compute-graphics': async () => computeGraphicsChapter,
	'performance': async () => performanceChapter
};

// キャッシュ
let cachedChapters: TutorialChapter[] | null = null;

/**
 * Get all tutorial chapters (with dynamic loading)
 */
export async function getTutorialChapters(): Promise<TutorialChapter[]> {
	if (cachedChapters) return cachedChapters;
	
	const chapters: TutorialChapter[] = [];
	
	for (const chapterId of chapterIds) {
		const loader = chapterLoaders[chapterId];
		if (loader) {
			const chapter = await loader();
			if (chapter) {
				chapters.push(chapter);
			}
		}
	}
	
	cachedChapters = chapters;
	return chapters;
}

/**
 * Tutorial chapters definition (後方互換性のため)
 */
export const tutorialChapters: TutorialChapter[] = [
	{ id: 'getting-started', title: 'Loading...', description: 'Loading...', examples: [] },
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
export async function getTutorialChapter(id: string): Promise<TutorialChapter | undefined> {
	const loader = chapterLoaders[id];
	if (!loader) {
		// 後方互換性のためのフォールバック
		return tutorialChapters.find(chapter => chapter.id === id);
	}
	
	const chapter = await loader();
	return chapter || undefined;
}

/**
 * Get tutorial example by chapter ID and example ID
 */
export async function getTutorialExample(chapterId: string, exampleId: string) {
	const chapter = await getTutorialChapter(chapterId);
	if (!chapter) return undefined;
	
	return chapter.examples.find(example => example.id === exampleId);
}

/**
 * Get all tutorial chapters slugs for routing
 */
export async function getAllTutorialSlugs(): Promise<string[]> {
	const chapters = await getTutorialChapters();
	const slugs: string[] = [];
	
	chapters.forEach(chapter => {
		chapter.examples.forEach(example => {
			slugs.push(`${chapter.id}/${example.id}`);
		});
	});
	
	return slugs;
}

/**
 * Get next example in the tutorial sequence
 */
export async function getNextExample(chapterId: string, exampleId: string): Promise<{ chapterId: string; exampleId: string } | null> {
	const chapters = await getTutorialChapters();
	const chapterIndex = chapters.findIndex(chapter => chapter.id === chapterId);
	if (chapterIndex === -1) return null;
	
	const chapter = chapters[chapterIndex];
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
	if (chapterIndex < chapters.length - 1) {
		const nextChapter = chapters[chapterIndex + 1];
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