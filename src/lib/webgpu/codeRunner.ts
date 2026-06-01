/**
 * チュートリアル詳細ページと Playground で共有する、
 * ユーザーコードのサンドボックス実行ヘルパー群。
 *
 * 各ページが組み立てる実行環境（canvas/navigator の Proxy など）は
 * 用途ごとに異なるため共通化していない。ここでは両者で重複していた
 * 「console 引数の整形」「AsyncFunction の構築と実行」「構文チェック」
 * のみを切り出している。
 */

/** consoleMessages ストアが満たすインターフェース（log/error/warn/info）。 */
export interface ConsoleSink {
	log(message: string): void;
	error(message: string): void;
	warn(message: string): void;
	info(message: string): void;
}

/**
 * ユーザーコードの console 引数を表示用の文字列へ整形する。
 * - Error: `Name: message`
 * - オブジェクト: 整形済み JSON（循環参照時は String() にフォールバック）
 * - その他: String()
 */
export function formatConsoleArg(arg: unknown): string {
	if (arg instanceof Error) {
		return `${arg.name}: ${arg.message}`;
	}
	if (typeof arg === 'object' && arg !== null) {
		try {
			return JSON.stringify(arg, null, 2);
		} catch {
			return String(arg);
		}
	}
	return String(arg);
}

/**
 * ConsoleSink を、ユーザーコードへ渡す console 互換オブジェクトへ変換する。
 * 各メソッドは可変長引数を formatConsoleArg で整形し、空白区切りで結合する。
 */
export function createConsoleBridge(sink: ConsoleSink) {
	const format = (args: unknown[]) => args.map(formatConsoleArg).join(' ');
	return {
		log: (...args: unknown[]) => sink.log(format(args)),
		error: (...args: unknown[]) => sink.error(format(args)),
		warn: (...args: unknown[]) => sink.warn(format(args)),
		info: (...args: unknown[]) => sink.info(format(args))
	};
}

/** AsyncFunction コンストラクタ（グローバルには公開されていないため prototype 経由で取得）。 */
export const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
	...args: string[]
) => (...callArgs: unknown[]) => Promise<unknown>;

/**
 * ユーザーコードの構文を実行前にチェックする。
 * 構文エラー時は行番号付きの分かりやすいエラーを投げる。
 */
export function checkSyntax(code: string): void {
	try {
		new Function(code);
	} catch (syntaxError) {
		const error = syntaxError as Error;
		const match = error.message.match(/^(.+) \((\d+):(\d+)\)$/);
		if (match) {
			const [, message, line] = match;
			throw new Error(`シンタックスエラー (行 ${line}): ${message}`);
		}
		throw new Error(`シンタックスエラー: ${error.message}`);
	}
}

/**
 * 実行環境オブジェクトのキーをスコープ変数として注入し、ユーザーコードを非同期実行する。
 * env はそのまま `this` としても渡されるため、コードからは `this` 経由でも参照できる。
 *
 * @param options.improveStack true の場合、例外のスタックトレースから
 *   内部フレーム（AsyncFunction / eval）を取り除く。
 */
export async function executeUserCode(
	code: string,
	env: Record<string, unknown>,
	options: { improveStack?: boolean } = {}
): Promise<void> {
	const body = options.improveStack
		? `
			const executionContext = this;
			try {
				${code}
			} catch (error) {
				// エラースタックトレースの改善
				if (error instanceof Error) {
					const stack = error.stack || '';
					const lines = stack.split('\\n');
					const relevantLines = lines.filter(line =>
						!line.includes('AsyncFunction') &&
						!line.includes('at eval')
					);
					error.stack = relevantLines.join('\\n');
				}
				throw error;
			}
		`
		: code;

	const executeCode = new AsyncFunction(...Object.keys(env), body);
	await executeCode.call(env, ...Object.values(env));
}
