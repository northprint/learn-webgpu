import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// TypeScriptとPostCSSのプリプロセッサを有効化
	preprocess: vitePreprocess(),

	kit: {
		// Cloudflare Workersにデプロイ
		adapter: adapter({
			// Cloudflare Workers向けの設定
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		})
	}
};

export default config;