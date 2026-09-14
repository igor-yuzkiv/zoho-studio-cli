import { describe, expect, test } from 'bun:test'

import { decodeHtmlEntities, htmlToMarkdown } from '@/zoho-projects/entities/task'

describe('htmlToMarkdown', () => {
    test('returns an empty string for empty or blank HTML', () => {
        expect(htmlToMarkdown('')).toBe('')
        expect(htmlToMarkdown('  \n ')).toBe('')
    })

    test('turns <br> into a hard line break', () => {
        expect(htmlToMarkdown('<div>first<br />second</div>')).toBe('first  \nsecond')
    })

    test('turns &nbsp; into a space and decodes double-encoded entities', () => {
        expect(htmlToMarkdown('<div>a&nbsp;b &amp;amp; c &quot;d&quot;</div>')).toBe('a b & c "d"')
    })

    test('renders bold, code and fenced blocks', () => {
        expect(htmlToMarkdown('<p><b>bold</b> <strong>strong</strong> <code>x = 1</code></p>')).toBe(
            '**bold** **strong** `x = 1`'
        )
        expect(htmlToMarkdown('<pre>line 1\nline 2</pre>')).toBe('```\nline 1\nline 2\n```')
    })

    test('renders images and links, mentions included', () => {
        expect(htmlToMarkdown('<img src="https://files.test/shot.png" />')).toBe('![](https://files.test/shot.png)')
        expect(htmlToMarkdown('<a href="https://docs.test/spec">the spec</a>')).toBe(
            '[the spec](https://docs.test/spec)'
        )
        expect(htmlToMarkdown('<a data-mention="1" href="https://people.test/7">@Sam</a>')).toBe(
            '[@Sam](https://people.test/7)'
        )
    })

    test('wraps a bare URL in angle brackets and leaves linked ones alone', () => {
        expect(htmlToMarkdown('<div>See https://docs.test/a. Also (https://docs.test/b)</div>')).toBe(
            'See <https://docs.test/a>. Also (https://docs.test/b)'
        )
        expect(htmlToMarkdown('<a href="https://x.test/a">https://x.test/a</a>')).toBe(
            '[https://x.test/a](https://x.test/a)'
        )
    })

    test('turns a Zoho user mention into @Name', () => {
        expect(htmlToMarkdown('<div>zp[@zpuser#100000000000000001#Sam Lee]zp please check</div>')).toBe(
            '@Sam Lee please check'
        )
    })

    test('demotes headings by two levels so they sit under the file sections', () => {
        expect(htmlToMarkdown('<h1>Top</h1><h2>Scope</h2><h4>Deep</h4><h6>Deepest</h6>')).toBe(
            '### Top\n\n#### Scope\n\n###### Deep\n\n###### Deepest'
        )
    })

    test('renders lists with a dash and a single space, dropping the breaks Zoho puts inside items', () => {
        expect(htmlToMarkdown('<ul><li>one</li><li>two</li></ul>')).toBe('- one\n- two')
        expect(htmlToMarkdown('<ul><li>one<br /><br /></li><li>two<br /></li><li><br /></li></ul>')).toBe(
            '- one\n\n- two'
        )
    })

    test('turns nested divs without formatting into paragraphs without extra blank lines', () => {
        const html =
            '<div style="font-size:12pt">first<br /></div><div><br /></div><div><span>second</span><br /></div>'

        expect(htmlToMarkdown(html)).toBe('first\n\nsecond')
    })
})

describe('decodeHtmlEntities', () => {
    test('decodes named, numeric and double-encoded entities in names', () => {
        expect(decodeHtmlEntities('Bugs &amp;amp; Fixes &#39;v2&#x27; &lt;beta&gt;')).toBe("Bugs & Fixes 'v2' <beta>")
    })

    test('leaves text without entities as it is', () => {
        expect(decodeHtmlEntities('Plain & simple')).toBe('Plain & simple')
    })
})
