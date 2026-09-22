import { issuesDirName, rawDirName, zohoProjectsDirName } from '@/zoho-projects/zoho-projects.config'
import { toSlug } from '@/zoho-projects/md'
import { isInPeriod, type Period } from '@/zoho-projects/period.utils'
import { writeRawEntity } from '@/zoho-projects/raw'
import { writeArtifactJson } from '@/shared/artifacts'

import type { ZohoIssue, ZohoIssueComment } from './issue.types'

export const issuesParentSegments = [zohoProjectsDirName, rawDirName, issuesDirName]

/** An issue is in the period by its last update. */
export function isIssueInPeriod(issue: ZohoIssue, period: Period): boolean {
    return isInPeriod(issue.last_updated_time, period)
}

/** Writes `<issue>/<id>.json` and `<issue>/<id>.comments.json` — the comments file always, so every issue folder looks alike. */
export async function writeIssue(projectPath: string, issue: ZohoIssue, comments: ZohoIssueComment[]): Promise<string[]> {
    const segments = await writeRawEntity(projectPath, issuesParentSegments, issue)

    await writeArtifactJson(projectPath, [...segments, `${issue.id}.comments.json`], comments)

    return segments
}

/** `SS5-I14` → `14-<slug>`; an issue without a prefix names its file after its id. */
export function issueFileBaseName(issue: Pick<ZohoIssue, 'id' | 'prefix' | 'name'>): string {
    return `${issue.prefix?.match(/(\d+)$/)?.[1] ?? issue.id}-${toSlug(issue.name, issue.id)}`
}
