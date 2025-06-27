<script lang="ts">
  import { currentLocale, changeLocale, localeOptions } from '$lib/stores/locale';
  import { _ } from 'svelte-i18n';
  import type { Locale } from '$lib/i18n';

  let isOpen = false;

  function handleLocaleChange(locale: Locale) {
    changeLocale(locale);
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  // クリック外で閉じる
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-selector')) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="language-selector relative">
  <button
    on:click={toggleDropdown}
    class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    aria-label="Language selector"
    aria-expanded={isOpen}
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
    <span>{$_(`language.${$currentLocale}`)}</span>
    <svg class="w-4 h-4 ml-1 transition-transform {isOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div class="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
      <ul class="py-1">
        {#each localeOptions as option}
          <li>
            <button
              on:click={() => handleLocaleChange(option.value)}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 {$currentLocale === option.value ? 'bg-gray-100 dark:bg-gray-700' : ''}"
              role="menuitem"
            >
              <span class="flex items-center justify-between">
                <span>{option.label}</span>
                {#if $currentLocale === option.value}
                  <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .language-selector {
    position: relative;
  }

  /* ドロップダウンアニメーション */
  div[class*="absolute"] {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>