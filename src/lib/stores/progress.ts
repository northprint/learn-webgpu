import { writable, derived } from 'svelte/store';

export interface ProgressData {
	completedExamples: Set<string>;
	completedSteps: Record<string, Set<number>>; // key: "chapterId/exampleId", value: Set of completed step indices
	lastVisited: string | null;
}

// ローカルストレージのキー
const STORAGE_KEY = 'webgpu-tutorial-progress';

// 初期データの読み込み
function loadProgress(): ProgressData {
	if (typeof window === 'undefined') {
		return {
			completedExamples: new Set(),
			completedSteps: {},
			lastVisited: null
		};
	}
	
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const data = JSON.parse(saved);
			const completedSteps: Record<string, Set<number>> = {};
			
			// completedStepsがある場合、SetオブジェクトとしてJSONから復元
			if (data.completedSteps) {
				for (const [key, steps] of Object.entries(data.completedSteps)) {
					completedSteps[key] = new Set(steps as number[]);
				}
			}
			
			return {
				completedExamples: new Set(data.completedExamples || []),
				completedSteps,
				lastVisited: data.lastVisited || null
			};
		}
	} catch (e) {
	}
	
	return {
		completedExamples: new Set(),
		completedSteps: {},
		lastVisited: null
	};
}

// プログレスストアの作成
function createProgressStore() {
	const { subscribe, update } = writable<ProgressData>(loadProgress());
	
	return {
		subscribe,
		
		// 例題を完了としてマーク
		markCompleted(chapterId: string, exampleId: string) {
			update(data => {
				const key = `${chapterId}/${exampleId}`;
				data.completedExamples.add(key);
				this.save(data);
				return data;
			});
		},
		
		// ステップを完了としてマーク
		markStepCompleted(chapterId: string, exampleId: string, stepIndex: number) {
			update(data => {
				const key = `${chapterId}/${exampleId}`;
				if (!data.completedSteps[key]) {
					data.completedSteps[key] = new Set();
				}
				data.completedSteps[key].add(stepIndex);
				this.save(data);
				return data;
			});
		},
		
		// ステップの完了状態を取得
		getCompletedSteps(chapterId: string, exampleId: string): Set<number> {
			const key = `${chapterId}/${exampleId}`;
			let currentData: ProgressData | null = null;
			const unsubscribe = this.subscribe((data) => {
				currentData = data;
			});
			unsubscribe();
			return currentData?.completedSteps[key] || new Set();
		},
		
		// 例題の完了を取り消し
		markIncomplete(chapterId: string, exampleId: string) {
			update(data => {
				const key = `${chapterId}/${exampleId}`;
				data.completedExamples.delete(key);
				this.save(data);
				return data;
			});
		},
		
		// 最後に訪問したページを記録
		setLastVisited(path: string) {
			update(data => {
				data.lastVisited = path;
				this.save(data);
				return data;
			});
		},
		
		// 進捗をリセット
		reset() {
			update(() => {
				const newData = {
					completedExamples: new Set<string>(),
					completedSteps: {},
					lastVisited: null
				};
				this.save(newData);
				return newData;
			});
		},
		
		// ローカルストレージに保存
		save(data: ProgressData) {
			if (typeof window === 'undefined') return;
			
			try {
				// completedStepsをJSONシリアライズ可能な形式に変換
				const completedStepsArray: Record<string, number[]> = {};
				for (const [key, steps] of Object.entries(data.completedSteps)) {
					completedStepsArray[key] = Array.from(steps);
				}
				
				const toSave = {
					completedExamples: Array.from(data.completedExamples),
					completedSteps: completedStepsArray,
					lastVisited: data.lastVisited
				};
				localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
			} catch (e) {
			}
		}
	};
}

// ストアのエクスポート
export const progress = createProgressStore();

// 完了率を計算する派生ストア
export const completionRate = derived(
	progress,
	$progress => {
		// チュートリアルの総数を取得（動的にインポートを避けるため、ここでは固定値）
		// 実際の実装では、tutorialChaptersから動的に計算
		const totalExamples = 7; // 現在の例題数
		const completed = $progress.completedExamples.size;
		
		return {
			completed,
			total: totalExamples,
			percentage: totalExamples > 0 ? Math.round((completed / totalExamples) * 100) : 0
		};
	}
);

// 特定の例題が完了しているかチェック
export function isExampleCompleted(chapterId: string, exampleId: string, progressData: ProgressData): boolean {
	const key = `${chapterId}/${exampleId}`;
	return progressData.completedExamples.has(key);
}