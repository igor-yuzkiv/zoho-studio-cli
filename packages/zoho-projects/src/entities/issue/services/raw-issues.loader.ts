import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveArtifactPath } from '@zoho-studio/core'
import { logger } from '@zoho-studio/core'

import type { TreeIssue, ZohoIssue, ZohoIssueComment } from '../issue.types'
import { issuePrefixNumber, issuesParentSegments } from '../issue.utils'

export interface RawIssues {
    /** Open statuses first, then by prefix number, then by name. */
    issues: TreeIssue[]
    issuesById: Map<string, TreeIssue>
    /** Every issue names its project; the first one seen is as good as any. */
    projectName: string | null
    /** Files under `raw/issues/` that were not valid JSON; the render goes on without them and ends non-zero. */
    skippedFiles: string[]
}

const commentsSuffix = '.comments.json'

/**
 * Reads `raw/issues/` into one list. `raw/` accumulates, so a renamed issue has two folders and the
 * record with the later update time is the one that counts.
 */
export async function loadRawIssues(projectPath: string): Promise<RawIssues> {
    const issuesPath = resolveArtifactPath(projectPath, issuesParentSegments)
    const files = await readdir(issuesPath, { recursive: true, withFileTypes: true }).catch(() => [])
    const records = new Map<string, ZohoIssue>()
    const commentsByIssueId = new Map<string, ZohoIssueComment[]>()
    const skippedFiles: string[] = []

    for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.json')) {
            continue
        }

        const filePath = join(file.parentPath, file.name)
        const parsed = await Bun.file(filePath)
            .json()
            .catch(() => undefined)

        if (parsed === undefined) {
            logger.warn({ file: filePath }, 'Raw file is not valid JSON, skipped')
            skippedFiles.push(filePath)
            continue
        }

        if (file.name.endsWith(commentsSuffix)) {
            commentsByIssueId.set(file.name.slice(0, -commentsSuffix.length), Array.isArray(parsed) ? parsed : [])
        } else if (typeof parsed?.id === 'string') {
            const record = parsed as ZohoIssue
            const known = records.get(record.id)

            if (!known || String(record.last_updated_time ?? '') >= String(known.last_updated_time ?? '')) {
                records.set(record.id, record)
            }
        }
    }

    const issuesById = new Map<string, TreeIssue>()

    for (const record of records.values()) {
        issuesById.set(record.id, { record, comments: commentsByIssueId.get(record.id) ?? [] })
    }

    const issues = [...issuesById.values()].sort(
        (left, right) =>
            Number(left.record.status?.is_closed_type === true) - Number(right.record.status?.is_closed_type === true) ||
            issuePrefixNumber(left.record) - issuePrefixNumber(right.record) ||
            left.record.name.localeCompare(right.record.name)
    )
    const projectName = issues.find((issue) => issue.record.project?.name)?.record.project?.name ?? null

    return { issues, issuesById, projectName, skippedFiles }
}
