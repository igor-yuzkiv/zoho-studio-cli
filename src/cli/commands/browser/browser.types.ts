/**
 * The HTTP contract between the browser command and the single-page app. The app imports these
 * types directly, so this file must stay free of runtime imports.
 */

export type AreaId = 'crm' | 'projects'

export type PullOptionName = 'module' | 'type' | 'from' | 'to'

export type ArtifactGroupSummary = {
    area: AreaId
    id: string
    label: string
    /** The CLI command that pulls this group, without the binary name. */
    command: string
    options: PullOptionName[]
    /** Relative to the project's `src/`. */
    relativePath: string
    absolutePath: string
    /** Null until the group has been pulled at least once. */
    count: number | null
    /** ISO time of the newest file in the group. */
    pulledAt: string | null
}

/** Authorized means a refresh token is stored; whether Zoho still accepts it shows on the next request. */
export type AuthStatus = 'authorized' | 'missing'

export type ProjectInfo = {
    name: string
    projectPath: string
    sourcePath: string
    organization: Record<string, unknown> | null
    auth: AuthStatus
    workflowActionTypes: string[]
}

export type FileEntry = {
    name: string
    /** Relative to the project's `src/`, with `/` separators. */
    path: string
    absolutePath: string
    kind: 'file' | 'directory'
    size: number
    modifiedAt: string
    children?: FileEntry[]
}

/** Every JSON file under a directory, keyed by its path relative to the project's `src/`. */
export type JsonBundle = Record<string, unknown>

export type PullRequest = {
    area: AreaId
    group: string
    options: Partial<Record<PullOptionName, string>>
}

export type PullRunStatus = 'running' | 'done' | 'partial' | 'failed'

export type PullRun = {
    id: string
    area: AreaId
    group: string
    command: string
    status: PullRunStatus
    total: number
    completed: number
    currentItem: string | null
    log: string[]
    startedAt: string
    finishedAt: string | null
    /** The pull failed because the project has no usable tokens; logging in again should fix it. */
    authRequired: boolean
}

export type LoginState =
    | { status: 'idle' }
    | { status: 'starting' }
    | { status: 'waiting'; verificationUrl: string; userCode: string; expiresAt: string }
    | { status: 'done'; warning: string | null; organizationError: string | null }
    | { status: 'failed'; message: string }

/** Server-sent events on `/api/events`; `data` is the JSON of the matching payload. */
export type ServerEvent = { type: 'pull'; run: PullRun } | { type: 'login'; state: LoginState }

export type ApiError = { error: string }
