<script lang="ts">
	import { progress, completionRate } from '$lib/stores/progress';
	
	let showResetConfirm = false;
	
	function handleReset() {
		progress.reset();
		showResetConfirm = false;
		alert('進捗がリセットされました');
	}
</script>

<svelte:head>
	<title>設定 - Learn WebGPU</title>
</svelte:head>

<div class="container mx-auto px-6 py-8 max-w-4xl">
	<h1 class="text-3xl font-bold mb-8">設定</h1>
	
	<!-- 進捗管理セクション -->
	<section class="card mb-8">
		<h2 class="text-xl font-semibold mb-4">学習進捗の管理</h2>
		
		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium">現在の進捗</span>
				<span class="text-sm text-gray-600 dark:text-gray-400">
					{$completionRate.completed} / {$completionRate.total} 完了 ({$completionRate.percentage}%)
				</span>
			</div>
			<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
				<div 
					class="bg-gpu-blue h-2 rounded-full transition-all duration-300"
					style="width: {$completionRate.percentage}%"
				></div>
			</div>
		</div>
		
		<div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
			<p class="text-sm text-yellow-800 dark:text-yellow-200">
				進捗データはブラウザのローカルストレージに保存されています。
				ブラウザのデータを削除すると、進捗も失われます。
			</p>
		</div>
		
		{#if !showResetConfirm}
			<button 
				onclick={() => showResetConfirm = true}
				class="btn bg-red-500 text-white hover:bg-red-600"
			>
				進捗をリセット
			</button>
		{:else}
			<div class="flex items-center gap-4">
				<p class="text-sm text-red-600 dark:text-red-400">
					本当に進捗をリセットしますか？この操作は取り消せません。
				</p>
				<button 
					onclick={handleReset}
					class="btn bg-red-500 text-white hover:bg-red-600"
				>
					リセットする
				</button>
				<button 
					onclick={() => showResetConfirm = false}
					class="btn bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
				>
					キャンセル
				</button>
			</div>
		{/if}
	</section>
	
	<!-- データ保存に関する情報 -->
	<section class="card">
		<h2 class="text-xl font-semibold mb-4">データの保存について</h2>
		<div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
			<p>このアプリケーションは以下のデータをローカルストレージに保存しています：</p>
			<ul class="list-disc list-inside ml-4 space-y-1">
				<li>完了したチュートリアルの情報</li>
				<li>各チュートリアルのステップ完了状況</li>
				<li>最後に訪問したページ</li>
				<li>ダークモードの設定</li>
			</ul>
			<p class="mt-4">
				すべてのデータはあなたのブラウザ内にのみ保存され、サーバーには送信されません。
			</p>
		</div>
	</section>
</div>