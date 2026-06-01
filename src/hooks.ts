import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

/**
 * Strip the locale prefix from incoming URLs so SvelteKit's router resolves
 * the same route regardless of language. Localization is applied by the
 * paraglide handle hook on the response side.
 */
export const reroute: Reroute = (request) => {
	return deLocalizeUrl(request.url).pathname;
};
