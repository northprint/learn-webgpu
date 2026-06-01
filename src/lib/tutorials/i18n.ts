/**
 * Tutorial content i18n overlays.
 *
 * 設計方針:
 *  - 既存の `chapters/<id>.ts` は **既定ロケール (ja)** のソース・オブ・トゥルース。
 *  - 各言語の翻訳は **同じ形だが部分的な「オーバーレイ」** として `chapters/<id>.<locale>.ts` から提供する。
 *  - `applyChapterOverlay()` でランタイムにマージし、翻訳がないキーは ja にフォールバック。
 *  - 新しい言語 `xx` を追加するときは、各章に対して `<id>.xx.ts` を1ファイル足すだけ。
 *
 * オーバーレイの型 = TutorialChapter の翻訳可能フィールドのみを deep-partial にしたもの。
 * コード (`code`, `initialCode`, `solution`)・id・defaultValues は **オーバーレイ対象外** (言語非依存)。
 */

import type { TutorialChapter, TutorialExample, TutorialStep } from '$lib/webgpu/types';
import { defaultLocale, type Locale } from '$lib/i18n/locales';

export type TutorialStepOverlay = Partial<Pick<TutorialStep, 'title' | 'content' | 'hint' | 'task'>>;

export interface TutorialExampleOverlay {
	title?: string;
	description?: string;
	steps?: TutorialStepOverlay[]; // 同じ index で対応
	challenges?: Array<{ title?: string; description?: string; hint?: string }>;
}

export interface TutorialChapterOverlay {
	title?: string;
	description?: string;
	examples?: Record<string, TutorialExampleOverlay>; // example.id -> overlay
}

/**
 * Lazy registry of overlays per locale, per chapter id.
 * Vite の glob import で全 `<id>.<locale>.ts` を静的に集めるため、build 時にロケール追加検知ができる。
 */
const overlayModules = import.meta.glob<{ overlay: TutorialChapterOverlay }>(
	'./chapters/*.*.ts',
	{ eager: true }
);

const overlayIndex: Map<string, Map<Locale, TutorialChapterOverlay>> = (() => {
	const map = new Map<string, Map<Locale, TutorialChapterOverlay>>();
	for (const path in overlayModules) {
		// path 例: './chapters/getting-started.en.ts'
		const match = path.match(/\.\/chapters\/(.+)\.([a-zA-Z-]+)\.ts$/);
		if (!match) continue;
		const [, chapterId, locale] = match;
		const mod = overlayModules[path];
		const overlay = mod.overlay;
		if (!overlay) continue;
		if (!map.has(chapterId)) map.set(chapterId, new Map());
		map.get(chapterId)!.set(locale as Locale, overlay);
	}
	return map;
})();

function pickStep(base: TutorialStep, overlay: TutorialStepOverlay | undefined): TutorialStep {
	if (!overlay) return base;
	return {
		...base,
		title: overlay.title ?? base.title,
		content: overlay.content ?? base.content,
		hint: overlay.hint ?? base.hint,
		task: overlay.task ?? base.task
	};
}

function pickExample(base: TutorialExample, overlay: TutorialExampleOverlay | undefined): TutorialExample {
	if (!overlay) return base;
	return {
		...base,
		title: overlay.title ?? base.title,
		description: overlay.description ?? base.description,
		steps: base.steps?.map((step, i) => pickStep(step, overlay.steps?.[i])),
		challenges: base.challenges?.map((ch, i) => {
			const co = overlay.challenges?.[i];
			if (!co) return ch;
			return {
				...ch,
				title: co.title ?? ch.title,
				description: co.description ?? ch.description,
				hint: co.hint ?? ch.hint
			};
		})
	};
}

/**
 * 章データをロケール対応に変換する。
 * - 該当ロケールのオーバーレイが無いキーは ja のまま (フォールバック)
 * - locale が defaultLocale (ja) ならそのまま返す
 */
export function applyChapterOverlay(chapter: TutorialChapter, locale: Locale): TutorialChapter {
	if (locale === defaultLocale) return chapter;
	const overlay = overlayIndex.get(chapter.id)?.get(locale);
	if (!overlay) return chapter;
	return {
		...chapter,
		title: overlay.title ?? chapter.title,
		description: overlay.description ?? chapter.description,
		examples: chapter.examples.map((ex) => pickExample(ex, overlay.examples?.[ex.id]))
	};
}
