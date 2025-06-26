/// <reference types="@sveltejs/kit" />
/// <reference types="@webgpu/types" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				ASSETS: {
					fetch: typeof fetch;
				};
			};
			context?: {
				waitUntil: (promise: Promise<unknown>) => void;
			};
			caches?: Cache;
			cf?: {
				[key: string]: unknown;
			};
		}
	}
}

export {};