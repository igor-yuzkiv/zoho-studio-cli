import TurndownService from 'turndown'

type ElementNode = { nodeName: string; textContent: string | null; getAttribute(name: string): string | null }

const namedEntities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
}

/** Zoho double-encodes names on the way in (`&amp;amp;`), so decoding repeats until nothing changes. */
export function decodeHtmlEntities(text: string): string {
    const decoded = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
        if (code.startsWith('#x') || code.startsWith('#X')) {
            return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
        }

        if (code.startsWith('#')) {
            return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
        }

        return namedEntities[code.toLowerCase()] ?? entity
    })

    return decoded === text ? decoded : decodeHtmlEntities(decoded)
}

const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
})

turndown.addRule('lineBreak', {
    filter: 'br',
    replacement: () => '  \n',
})

turndown.addRule('image', {
    filter: 'img',
    replacement: (_content, node) => `![](${(node as ElementNode).getAttribute('src') ?? ''})`,
})

turndown.addRule('link', {
    filter: (node) => node.nodeName === 'A' && Boolean(node.getAttribute('href')),
    replacement: (content, node) => `[${content}](${(node as ElementNode).getAttribute('href')})`,
})

turndown.addRule('preformatted', {
    filter: 'pre',
    replacement: (_content, node) => `\n\n\`\`\`\n${(node as ElementNode).textContent ?? ''}\n\`\`\`\n\n`,
})

/** Rendered task files own `#` and `##`, so a heading typed into a description moves two levels down. */
turndown.addRule('demotedHeading', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: (content, node) => {
        const level = Math.min(6, Number(node.nodeName.charAt(1)) + 2)

        return `\n\n${'#'.repeat(level)} ${content}\n\n`
    },
})

const zohoMentionPattern = /zp\[@zpuser#[^#\]]*#([^\]]*)\]zp/g
const bareUrlPattern = /(?<![<(])\b(https?:\/\/[^\s<>()[\]]+?)(?=[.,;:]?(?:$|[\s)]))/gm

/** Converts the HTML Zoho Projects stores in task descriptions and comments to markdown. */
export function htmlToMarkdown(html: string): string {
    if (!html.trim()) {
        return ''
    }

    const markdown = turndown.turndown(html.replace(zohoMentionPattern, '@$1'))

    return decodeHtmlEntities(markdown)
        .replace(/\u00a0/g, ' ')
        .replace(bareUrlPattern, '<$1>')
        .replace(/^(\s*)- {3}/gm, '$1- ')
        .replace(/^[ \t]+$/gm, '')
        .replace(/(\S)[ \t]{2,}$/gm, '$1  ')
        .replace(/(\S)[ \t]$/gm, '$1')
        .replace(/( {2}\n)+(?=\s*(?:\n|$))/g, '\n')
        .replace(/^\s*-\s*$\n?/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
