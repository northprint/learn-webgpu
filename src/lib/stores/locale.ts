import { writable, derived } from 'svelte/store';
import { locale as i18nLocale } from 'svelte-i18n';
import type { Locale } from '$lib/i18n';
import { setLocale as saveLocale } from '$lib/i18n';

// 現在の言語を管理するストア
export const currentLocale = writable<Locale>('ja');

// 言語切替関数
export function changeLocale(newLocale: Locale) {
  currentLocale.set(newLocale);
  i18nLocale.set(newLocale);
  saveLocale(newLocale);
  
  // URLを更新（オプション：将来的に実装）
  // if (typeof window !== 'undefined') {
  //   const url = new URL(window.location.href);
  //   if (newLocale === 'ja') {
  //     // デフォルト言語の場合はパスから言語を削除
  //     url.pathname = url.pathname.replace(/^\/en/, '');
  //   } else {
  //     // 英語の場合はパスに言語を追加
  //     if (!url.pathname.startsWith('/en')) {
  //       url.pathname = `/en${url.pathname}`;
  //     }
  //   }
  //   window.history.replaceState({}, '', url);
  // }
}

// 現在の言語に基づくURLパスを生成
export const localeRoute = derived(currentLocale, ($currentLocale) => 
  $currentLocale === 'ja' ? '' : `/${$currentLocale}`
);

// 言語セレクター用のオプション
export const localeOptions = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' }
] as const;