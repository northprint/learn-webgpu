import { writable, derived, get } from 'svelte/store';
import { PROGRESS_STORAGE_KEY } from '$lib/config';
import { tutorialChapters } from '$lib/tutorials/index';

export interface ProgressData {
	completedExamples: Set<string>;
	completedSteps: Record<string, Set<number>>; // key: "chapterId/exampleId", value: Set of completed step indices
	lastVisited: string | null;
}

// ローカルストレージのキー
const STORAGE_KEY = PROGRESS_STORAGE_KEY;

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
		// 破損したデータや非対応環境では初期値にフォールバック
		console.warn('[progress] Failed to load progress from localStorage:', e);
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
		
		// ステップの完了状態を取得（コピーを返す）
		getCompletedSteps(chapterId: string, exampleId: string): Set<number> {
			const key = `${chapterId}/${exampleId}`;
			const data = get<ProgressData>({ subscribe });
			return new Set(data.completedSteps[key] ?? []);
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
				// 容量超過やプライベートブラウジング等では保存をスキップ
				console.warn('[progress] Failed to save progress to localStorage:', e);
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
		// チュートリアルの総数を動的に計算
		// getTotalExamplesはモジュールの最下部で定義
		const totalExamples = getTotalExamples();
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

// チュートリアルの総数を取得（tutorialChaptersから動的に算出）
function getTotalExamples(): number {
	return tutorialChapters.reduce((total, chapter) => total + chapter.examples.length, 0);
}