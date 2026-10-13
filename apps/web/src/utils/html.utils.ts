const allowedTags = new Set([
    'p',
    'br',
    'div',
    'span',
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'a',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
])

/** Tags whose text is code or markup rather than content, so it is dropped along with the tag. */
const droppedTags = new Set(['script', 'style', 'template', 'iframe', 'object', 'noscript'])

/**
 * Zoho descriptions and comments are HTML written by anyone on the project. The page can start
 * pulls, so that HTML is rebuilt from a short list of formatting tags, with only safe link targets.
 */
export function sanitizeHtml(html: string): string {
    const parsed = new DOMParser().parseFromString(html, 'text/html')

    return Array.from(parsed.body.childNodes).map(rebuildNode).join('')
}

function rebuildNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
        return escapeText(node.textContent ?? '')
    }

    if (!(node instanceof Element)) {
        return ''
    }

    const tag = node.tagName.toLowerCase()

    if (droppedTags.has(tag)) {
        return ''
    }

    const children = Array.from(node.childNodes).map(rebuildNode).join('')

    if (!allowedTags.has(tag)) {
        return children
    }

    if (tag === 'br' || tag === 'hr') {
        return `<${tag}>`
    }

    if (tag === 'a') {
        const href = node.getAttribute('href') ?? ''

        return /^https?:\/\//i.test(href)
            ? `<a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">${children}</a>`
            : children
    }

    return `<${tag}>${children}</${tag}>`
}

function escapeText(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
