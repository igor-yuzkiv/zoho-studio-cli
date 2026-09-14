import TurndownService from 'turndown'

import { decodeHtmlEntities } from '@/zoho-projects/md'

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
    replacement: (_content, node) => `![](${node.getAttribute('src') ?? ''})`,
})

turndown.addRule('link', {
    filter: (node) => node.nodeName === 'A' && Boolean(node.getAttribute('href')),
    replacement: (content, node) => `[${content}](${node.getAttribute('href')})`,
})

turndown.addRule('preformatted', {
    filter: 'pre',
    replacement: (_content, node) => `\n\n\`\`\`\n${node.textContent ?? ''}\n\`\`\`\n\n`,
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
const bareUrlPattern = /(?<![<(`])\b(https?:\/\/[^\s<>()[\]`'"]+?)(?=[.,;:]?(?:$|[\s)`'"]))/gm

export function htmlToMarkdown(html: string): string {
    if (!html.trim()) {
        return ''
    }

    const markdown = turndown.turndown(html.replace(zohoMentionPattern, '@$1'))

    return withoutFencedBlocks(decodeHtmlEntities(markdown), (prose) =>
        prose
            .replace(/\u00a0/g, ' ')
            .replace(bareUrlPattern, '<$1>')
            .replace(/^(\s*)- {3}/gm, '$1- ')
            .replace(/^[ \t]+$/gm, '')
            .replace(/(\S)[ \t]+$/gm, (_line, last: string, offset: number, whole: string) =>
                whole.slice(offset + 1).match(/^[ \t]+/)![0].length >= 2 ? `${last}  ` : last
            )
            .replace(/( {2}\n)+(?=\s*(?:\n|$))/g, '\n')
            .replace(/^\s*-\s*$\n?/gm, '')
    )
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

/** Fenced code is left exactly as turndown emitted it; the prose rules run on the text between fences. */
function withoutFencedBlocks(markdown: string, transformProse: (prose: string) => string): string {
    return markdown
        .split(/(```[\s\S]*?```)/)
        .map((part, index) => (index % 2 === 1 ? part : transformProse(part)))
        .join('')
}
