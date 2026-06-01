import type * as Monaco from 'monaco-editor';

/**
 * Register WGSL language support for Monaco Editor
 */
export function registerWGSL(monaco: typeof Monaco) {
	monaco.languages.register({ id: 'wgsl' });

	monaco.languages.setMonarchTokensProvider('wgsl', {
		keywords: [
			'fn', 'let', 'var', 'const', 'struct', 'if', 'else', 'for', 'while',
			'return', 'break', 'continue', 'discard', 'true', 'false'
		],

		typeKeywords: [
			'bool', 'i32', 'u32', 'f32', 'f16', 'vec2', 'vec3', 'vec4',
			'vec2f', 'vec3f', 'vec4f', 'vec2i', 'vec3i', 'vec4i',
			'mat2x2', 'mat3x3', 'mat4x4', 'array', 'texture_2d', 'sampler'
		],

		operators: [
			'=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
			'&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
			'<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
			'%=', '<<=', '>>=', '>>>='
		],

		symbols: /[=><!~?:&|+\-*\/\^%]+/,

		tokenizer: {
			root: [
				// 識別子とキーワード
				[/[a-zA-Z_]\w*/, {
					cases: {
						'@typeKeywords': 'type',
						'@keywords': 'keyword',
						'@default': 'identifier'
					}
				}],

				// デコレータ
				[/@[a-zA-Z_]\w*/, 'annotation'],

				// 数値
				[/\d*\.\d+([eE][\-+]?\d+)?[fh]?/, 'number.float'],
				[/0[xX][0-9a-fA-F]+[ul]?/, 'number.hex'],
				[/\d+[ul]?/, 'number'],

				// 文字列
				[/"([^"\\]|\\.)*$/, 'string.invalid'],
				[/"/, 'string', '@string'],

				// コメント
				[/\/\/.*$/, 'comment'],
				[/\/\*/, 'comment', '@comment'],

				// 記号
				[/[{}()\[\]]/, '@brackets'],
				[/[<>](?!@symbols)/, '@brackets'],
				[/@symbols/, {
					cases: {
						'@operators': 'operator',
						'@default': ''
					}
				}],

				// セミコロンとカンマ
				[/[;,.]/, 'delimiter'],
			],

			string: [
				[/[^\\"]+/, 'string'],
				[/\\./, 'string.escape.invalid'],
				[/"/, 'string', '@pop']
			],

			comment: [
				[/[^\/*]+/, 'comment'],
				[/\*\//, 'comment', '@pop'],
				[/[\/*]/, 'comment']
			],
		},
	});

	// 基本的な自動補完
	monaco.languages.registerCompletionItemProvider('wgsl', {
		provideCompletionItems: () => {
			const suggestions: any[] = [
				{ label: 'fn', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'fn ${1:name}(${2:params}) -> ${3:type} {\n\t$0\n}' },
				{ label: 'struct', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'struct ${1:Name} {\n\t${2:field}: ${3:type},\n}' },
				{ label: 'vec2f', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'vec2f' },
				{ label: 'vec3f', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'vec3f' },
				{ label: 'vec4f', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'vec4f' },
				{ label: '@vertex', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@vertex' },
				{ label: '@fragment', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@fragment' },
				{ label: '@builtin', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@builtin(${1:position})' },
				{ label: '@location', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@location(${1:0})' },
			];
			return { suggestions };
		}
	});
}
