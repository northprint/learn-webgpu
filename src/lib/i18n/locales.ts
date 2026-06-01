/**
 * Locale registry — the single source of truth for supported languages.
 *
 * 新しい言語を追加するときは、ここにエントリを1行足すだけで:
 *   - 言語スイッチャー UI に自動で並ぶ
 *   - <html lang> / <html dir> が自動対応
 *   - hreflang 等の SEO メタも自動生成される
 *
 * このファイル以外に「ja」「en」のような言語コードをハードコードしない。
 */

import type { Locale as ParaglideLocale } from '$lib/paraglide/runtime';

export interface LocaleInfo {
	/** スイッチャーや言語選択UIに表示する自言語表記 */
	readonly label: string;
	/** テキスト方向 (RTL対応用) */
	readonly dir: 'ltr' | 'rtl';
	/** Intl 系 API に渡す BCP-47 タグ */
	readonly intlLocale: string;
}

export const locales = {
	ja: { label: '日本語', dir: 'ltr', intlLocale: 'ja-JP' },
	en: { label: 'English', dir: 'ltr', intlLocale: 'en-US' }
	// 例: 将来 Chinese を追加するときは下記を有効化するだけ:
	// 'zh-CN': { label: '简体中文', dir: 'ltr', intlLocale: 'zh-CN' },
	// 例: Arabic (RTL) を追加するときも 1行で完結:
	// ar: { label: 'العربية', dir: 'rtl', intlLocale: 'ar' }
} as const satisfies Record<ParaglideLocale, LocaleInfo>;

export type Locale = keyof typeof locales;

/** 列挙したい時はこれを使う (Object.keys のキャスト用) */
export const localeCodes = Object.keys(locales) as readonly Locale[];

/** Paraglide の baseLocale と同期させる (project.inlang/settings.json) */
export const defaultLocale: Locale = 'ja';

export function isLocale(value: string | undefined | null): value is Locale {
	return typeof value === 'string' && value in locales;
}

export function getLocaleInfo(code: Locale): LocaleInfo {
	return locales[code];
}
