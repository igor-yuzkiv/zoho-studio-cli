export type CodeLanguage = 'deluge' | 'javascript' | 'json' | 'text'

type TokenRule = { className: string; pattern: RegExp }

const keywordsByLanguage: Record<'deluge' | 'javascript', string[]> = {
    deluge: [
        'if',
        'else',
        'for',
        'each',
        'in',
        'return',
        'void',
        'string',
        'int',
        'bool',
        'map',
        'list',
        'true',
        'false',
        'null',
        'try',
        'catch',
        'while',
        'break',
        'continue',
        'info',
        'invokeurl',
        'type',
        'url',
        'parameters',
        'headers',
        'connection',
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'Map',
        'List',
        'Collection',
        'decimal',
        'date',
        'datetime',
        'and',
        'or',
        'not',
    ],
    javascript: [
        'const',
        'let',
        'var',
        'function',
        'return',
        'if',
        'else',
        'for',
        'while',
        'of',
        'in',
        'new',
        'class',
        'extends',
        'import',
        'export',
        'from',
        'async',
        'await',
        'try',
        'catch',
        'finally',
        'throw',
        'true',
        'false',
        'null',
        'undefined',
        'this',
        'typeof',
        'switch',
        'case',
        'break',
        'continue',
        'default',
    ],
}

function rulesFor(language: CodeLanguage): TokenRule[] {
    if (language === 'text') {
        return []
    }

    if (language === 'json') {
        return [
            { className: 'text-code-function', pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/y },
            { className: 'text-code-string', pattern: /"(?:[^"\\]|\\.)*"/y },
            { className: 'text-code-number', pattern: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y },
            { className: 'text-code-keyword', pattern: /\b(?:true|false|null)\b/y },
        ]
    }

    const keywords = keywordsByLanguage[language].join('|')

    return [
        { className: 'text-code-comment italic', pattern: /\/\/[^\n]*/y },
        { className: 'text-code-comment italic', pattern: /\/\*[\s\S]*?(?:\*\/|$)/y },
        { className: 'text-code-string', pattern: /"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\.)*`?/y },
        { className: 'text-code-number', pattern: /\b\d+(?:\.\d+)?\b/y },
        { className: 'text-code-keyword', pattern: new RegExp(`\\b(?:${keywords})\\b`, 'y') },
        { className: 'text-code-function', pattern: /\b[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*(?=\s*\()/y },
    ]
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * A small sticky-regex tokenizer: good enough to make Deluge, JavaScript and JSON readable, with
 * no grammar to maintain. Returns one HTML string per source line, already escaped.
 */
export function highlightLines(source: string, language: CodeLanguage): string[] {
    const rules = rulesFor(language)
    let html = ''
    let position = 0
    let plainStart = 0

    while (position < source.length) {
        let matched = false

        for (const rule of rules) {
            rule.pattern.lastIndex = position
            const match = rule.pattern.exec(source)

            if (match && match[0].length > 0) {
                html += escapeHtml(source.slice(plainStart, position))
                // A multi-line token is closed and reopened per line, so each line stays valid HTML.
                html += match[0]
                    .split('\n')
                    .map((part) => `<span class="${rule.className}">${escapeHtml(part)}</span>`)
                    .join('\n')
                position += match[0].length
                plainStart = position
                matched = true
                break
            }
        }

        if (!matched) {
            position++
        }
    }

    html += escapeHtml(source.slice(plainStart))

    return html.split('\n')
}
