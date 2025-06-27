import { get } from 'svelte/store';
import { locale } from 'svelte-i18n';
import type { TutorialChapter, TutorialExample } from '$lib/webgpu/types';

/**
 * Get tutorial translations for the current locale
 */
export async function getTutorialTranslations(chapterId: string): Promise<any> {
  const currentLocale = get(locale) || 'ja';
  
  try {
    // 動的インポートで翻訳ファイルを読み込み
    const translations = await import(`./locales/${currentLocale}/tutorials/${chapterId}.json`);
    return translations.default;
  } catch (error) {
    console.warn(`Translation not found for ${chapterId} in ${currentLocale}, falling back to Japanese`);
    try {
      const fallback = await import(`./locales/ja/tutorials/${chapterId}.json`);
      return fallback.default;
    } catch (fallbackError) {
      console.error(`No translations found for ${chapterId}`);
      return null;
    }
  }
}

/**
 * Build tutorial chapter with translations
 */
export async function buildTranslatedChapter(
  chapterId: string,
  buildExamples: (translations: any) => TutorialExample[]
): Promise<TutorialChapter | null> {
  const translations = await getTutorialTranslations(chapterId);
  
  if (!translations) {
    return null;
  }

  return {
    id: chapterId,
    title: translations.title,
    description: translations.description,
    examples: buildExamples(translations)
  };
}

/**
 * Get initial code with translated comments
 */
export function getTranslatedInitialCode(
  translations: any,
  exampleId: string,
  template: (comments: any) => string
): { javascript: string; vertexShader: string; fragmentShader: string } {
  const example = translations.examples[exampleId];
  if (!example || !example.initialCode || !example.initialCode.comments) {
    return { javascript: '', vertexShader: '', fragmentShader: '' };
  }

  const code = template(example.initialCode.comments);
  
  return {
    javascript: code,
    vertexShader: '',
    fragmentShader: ''
  };
}

/**
 * Get solution code with translated comments
 */
export function getTranslatedSolutionCode(
  translations: any,
  exampleId: string,
  template: (comments: any) => string
): { javascript: string; vertexShader: string; fragmentShader: string } {
  const example = translations.examples[exampleId];
  if (!example || !example.solution || !example.solution.comments) {
    return { javascript: '', vertexShader: '', fragmentShader: '' };
  }

  const code = template(example.solution.comments);
  
  return {
    javascript: code,
    vertexShader: '',
    fragmentShader: ''
  };
}