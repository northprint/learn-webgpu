import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// TypeScriptとPostCSSのプリプロセッサを有効化
	preprocess: vitePreprocess(),

	kit: {
		// Vercelにデプロイ
		adapter: adapter({
			// エッジ関数を使用する場合はtrueに設定
			runtime: 'nodejs20.x'
		})
	}
};

export default config;