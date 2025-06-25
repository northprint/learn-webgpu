<script lang="ts">
	import type { ConsoleMessage } from '$lib/webgpu/types';
	
	interface Props {
		messages: ConsoleMessage[];
		onClear?: () => void;
		height?: string;
		class?: string;
	}
	
	let { messages = [], onClear, height = '200px', class: className = '' }: Props = $props();
	
	let consoleElement: HTMLDivElement;
	
	// 新しいメッセージが追加されたら自動スクロール
	$effect(() => {
		if (consoleElement && messages.length > 0) {
			consoleElement.scrollTop = consoleElement.scrollHeight;
		}
	});
	
	function getMessageClass(type: ConsoleMessage['type']) {
		switch (type) {
			case 'error':
				return 'text-red-600 dark:text-red-400';
			case 'warn':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'info':
				return 'text-blue-600 dark:text-blue-400';
			default:
				return 'text-gray-800 dark:text-gray-200';
		}
	}
	
	function getMessageIcon(type: ConsoleMessage['type']) {
		switch (type) {
			case 'error':
				return '❌';
			case 'warn':
				return '⚠️';
			case 'info':
				return 'ℹ️';
			default:
				return '▶';
		}
	}
	
	function formatTime(date: Date) {
		return date.toLocaleTimeString('ja-JP', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3
		});
	}
</script>

<div class="console-output {className}" style="height: {height}">
	<div class="console-header">
		<span class="text-sm font-medium">コンソール</span>
		{#if onClear && messages.length > 0}
			<button
				onclick={onClear}
				class="clear-button"
				aria-label="コンソールをクリア"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</button>
		{/if}
	</div>
	
	<div class="console-content" bind:this={consoleElement}>
		{#if messages.length === 0}
			<div class="empty-message">
				コンソール出力がここに表示されます
			</div>
		{:else}
			{#each messages as message}
				<div class="console-message">
					<span class="message-time">{formatTime(message.timestamp)}</span>
					<span class="message-icon">{getMessageIcon(message.type)}</span>
					<span class="message-text {getMessageClass(message.type)}">
						{message.message}
					</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.console-output {
		@apply border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-[var(--color-code-bg)];
		display: flex;
		flex-direction: column;
	}
	
	.console-header {
		@apply px-4 py-2 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between;
		background: var(--color-bg);
	}
	
	.clear-button {
		@apply p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors;
	}
	
	.console-content {
		@apply flex-1 overflow-y-auto p-2 font-mono text-sm;
	}
	
	.empty-message {
		@apply text-center py-8 text-gray-500 dark:text-gray-500;
	}
	
	.console-message {
		@apply py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded flex items-start gap-2;
		word-break: break-word;
	}
	
	.message-time {
		@apply text-xs text-gray-500 dark:text-gray-600 flex-shrink-0;
	}
	
	.message-icon {
		@apply flex-shrink-0;
		font-size: 0.75rem;
	}
	
	.message-text {
		@apply flex-1;
		white-space: pre-wrap;
	}
</style>