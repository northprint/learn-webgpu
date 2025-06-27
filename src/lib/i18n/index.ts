import { register, init, getLocaleFromNavigator, addMessages } from 'svelte-i18n';

// 日本語の翻訳ファイルをインポート
import jaCommon from './locales/ja/common.json';
import jaTutorial from './locales/ja/tutorial.json';
import jaPlayground from './locales/ja/playground.json';
import jaErrors from './locales/ja/errors.json';
import jaHome from './locales/ja/home.json';
import jaTutorialSteps from './locales/ja/tutorial-steps.json';
import jaTutorialDetail from './locales/ja/tutorial-detail.json';
import jaReference from './locales/ja/reference.json';

// 英語の翻訳ファイルをインポート
import enCommon from './locales/en/common.json';
import enTutorial from './locales/en/tutorial.json';
import enPlayground from './locales/en/playground.json';
import enErrors from './locales/en/errors.json';
import enHome from './locales/en/home.json';
import enTutorialSteps from './locales/en/tutorial-steps.json';
import enTutorialDetail from './locales/en/tutorial-detail.json';
import enReference from './locales/en/reference.json';

// 中国語の翻訳ファイルをインポート
import zhCommon from './locales/zh/common.json';
import zhTutorial from './locales/zh/tutorial.json';
import zhPlayground from './locales/zh/playground.json';
import zhErrors from './locales/zh/errors.json';
import zhHome from './locales/zh/home.json';
import zhTutorialSteps from './locales/zh/tutorial-steps.json';
import zhTutorialDetail from './locales/zh/tutorial-detail.json';
import zhReference from './locales/zh/reference.json';

// サポートする言語
export const supportedLocales = ['ja', 'en', 'zh'] as const;
export type Locale = (typeof supportedLocales)[number];

// デフォルト言語
export const defaultLocale: Locale = 'ja';

// 翻訳メッセージを追加
addMessages('ja', {
  ...jaCommon,
  ...jaTutorial,
  ...jaPlayground,
  ...jaErrors,
  ...jaHome,
  tutorialSteps: jaTutorialSteps,
  tutorialDetail: jaTutorialDetail,
  reference: jaReference
});

addMessages('en', {
  ...enCommon,
  ...enTutorial,
  ...enPlayground,
  ...enErrors,
  ...enHome,
  tutorialSteps: enTutorialSteps,
  tutorialDetail: enTutorialDetail,
  reference: enReference
});

addMessages('zh', {
  ...zhCommon,
  ...zhTutorial,
  ...zhPlayground,
  ...zhErrors,
  ...zhHome,
  tutorialSteps: zhTutorialSteps,
  tutorialDetail: zhTutorialDetail,
  reference: zhReference
});

// ブラウザから言語を取得
export function getInitialLocale(): Locale {
  // LocalStorageから保存された言語設定を取得
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('locale');
    if (saved && supportedLocales.includes(saved as Locale)) {
      return saved as Locale;
    }
  }

  // ブラウザの言語設定から取得
  const browserLocale = getLocaleFromNavigator();
  if (browserLocale) {
    // 言語コードの最初の2文字を取得（例: 'ja-JP' -> 'ja'）
    const lang = browserLocale.substring(0, 2) as Locale;
    if (supportedLocales.includes(lang)) {
      return lang;
    }
  }

  return defaultLocale;
}

// i18nを初期化
export function initI18n() {
  init({
    fallbackLocale: 'en',
    initialLocale: getInitialLocale(),
  });
}

// 言語を変更して保存
export function setLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}