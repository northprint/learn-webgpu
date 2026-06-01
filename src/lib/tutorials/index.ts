import type { TutorialChapter } from '$lib/webgpu/types';
import { gettingStartedChapter } from './chapters/getting-started';
import { firstTriangleChapter } from './chapters/first-triangle';
import { buffersAndUniformsChapter } from './chapters/buffers-and-uniforms';
import { texturesChapter } from './chapters/textures';
import { lightingChapter } from './chapters/lighting';
import { computeGraphicsChapter } from './chapters/compute-graphics';
import { performanceChapter } from './chapters/performance';
import { applyChapterOverlay } from './i18n';
import { defaultLocale, type Locale } from '$lib/i18n/locales';
import { getLocale } from '$lib/paraglide/runtime';

/**
 * Source-of-truth chapter list (default-locale data, i.e. Japanese).
 */
const baseChapters: TutorialChapter[] = [
	gettingStartedChapter,
	firstTriangleChapter,
	buffersAndUniformsChapter,
	texturesChapter,
	lightingChapter,
	computeGraphicsChapter,
	performanceChapter
];

function currentLocale(): Locale {
	try {
		return getLocale() as Locale;
	} catch {
		return defaultLocale;
	}
}

/**
 * Locale-aware list of tutorial chapters.
 * Note: this is a getter-style export — consumers should call `tutorialChapters` as a value;
 * for backwards compatibility we expose a Proxy-like accessor.
 */
export const tutorialChapters: TutorialChapter[] = new Proxy(baseChapters, {
	get(target, prop, receiver) {
		// Iteration (`for...of`, `.map`, `.length`, indexed access) should see the localized copy.
		const locale = currentLocale();
		const localized = locale === defaultLocale
			? target
			: target.map((c) => applyChapterOverlay(c, locale));
		return Reflect.get(localized, prop, receiver);
	}
}) as TutorialChapter[];

export function getTutorialChapter(id: string, locale: Locale = currentLocale()): TutorialChapter | undefined {
	const chapter = baseChapters.find((c) => c.id === id);
	if (!chapter) return undefined;
	return applyChapterOverlay(chapter, locale);
}

export function getTutorialExample(chapterId: string, exampleId: string, locale: Locale = currentLocale()) {
	const chapter = getTutorialChapter(chapterId, locale);
	if (!chapter) return undefined;
	return chapter.examples.find((example) => example.id === exampleId);
}

export function getAllTutorialSlugs(): string[] {
	const slugs: string[] = [];
	baseChapters.forEach((chapter) => {
		chapter.examples.forEach((example) => {
			slugs.push(`${chapter.id}/${example.id}`);
		});
	});
	return slugs;
}

export function getNextExample(chapterId: string, exampleId: string): { chapterId: string; exampleId: string } | null {
	const chapterIndex = baseChapters.findIndex((c) => c.id === chapterId);
	if (chapterIndex === -1) return null;

	const chapter = baseChapters[chapterIndex];
	const exampleIndex = chapter.examples.findIndex((e) => e.id === exampleId);
	if (exampleIndex === -1) return null;

	if (exampleIndex < chapter.examples.length - 1) {
		return {
			chapterId: chapter.id,
			exampleId: chapter.examples[exampleIndex + 1].id
		};
	}

	if (chapterIndex < baseChapters.length - 1) {
		const nextChapter = baseChapters[chapterIndex + 1];
		if (nextChapter.examples.length > 0) {
			return {
				chapterId: nextChapter.id,
				exampleId: nextChapter.examples[0].id
			};
		}
	}

	return null;
}
