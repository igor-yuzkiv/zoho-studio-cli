export interface ZohoPersonLike {
    name?: string
    full_name?: string
    email?: string
    is_client_user?: boolean
}

export function toPersonEntry(person: ZohoPersonLike): { name: string | null; email: string | null } {
    return { name: person.name ?? person.full_name ?? null, email: person.email ?? null }
}

/** `### <YYYY-MM-DD HH:MM UTC> — <author>[ (client)]` followed by the body in a markdown fence. */
export function renderCommentBlock(time: string | undefined, author: ZohoPersonLike | undefined, body: string): string {
    const authorName = author?.full_name ?? author?.name ?? 'Unknown'
    const heading = `### ${formatCommentTime(time)} — ${authorName}${author?.is_client_user ? ' (client)' : ''}`

    return `${heading}\n\n\`\`\`markdown\n${body}\n\`\`\``
}

export function formatCommentTime(time: string | undefined): string {
    const date = time ? new Date(time) : null

    if (!date || Number.isNaN(date.getTime())) {
        return 'unknown time'
    }

    return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`
}

/** Newest first, by `created_time`. */
export function sortCommentsNewestFirst<Comment extends { created_time?: string }>(comments: Comment[]): Comment[] {
    return [...comments].sort((left, right) =>
        String(right.created_time ?? '').localeCompare(String(left.created_time ?? ''))
    )
}
