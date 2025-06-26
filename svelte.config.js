import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// TypeScriptとPostCSSのプリプロセッサを有効化
	preprocess: vitePreprocess(),

	kit: {
		// Cloudflare PagesでSSRを有効にしてデプロイ
		adapter: adapter({
			// Pages用の設定
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		})
	}
};

export default config;