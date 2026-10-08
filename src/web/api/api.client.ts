import type {
    ApiError,
    ArtifactGroupSummary,
    FileEntry,
    JsonBundle,
    ProjectInfo,
    PullRequest,
    PullRun,
    ServerEvent,
} from '@cli/commands/browser/browser.types'

export class ApiRequestError extends Error {
    constructor(
        message: string,
        readonly status: number
    ) {
        super(message)
    }
}

async function request<TResult>(path: string, init?: RequestInit): Promise<TResult> {
    const response = await fetch(path, init)

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiError | null
        throw new ApiRequestError(body?.error ?? response.statusText, response.status)
    }

    return response.json() as Promise<TResult>
}

function withPath(endpoint: string, path: string, extra: Record<string, string> = {}): string {
    return `${endpoint}?${new URLSearchParams({ path, ...extra })}`
}

export const api = {
    getProject: () => request<ProjectInfo>('api/project'),
    getGroups: () => request<ArtifactGroupSummary[]>('api/groups'),
    getTree: (path: string, depth = 1) => request<FileEntry>(withPath('api/tree', path, { depth: String(depth) })),
    getJson: (path: string) => request<JsonBundle>(withPath('api/json', path)),
    getFileText: async (path: string) => {
        const response = await fetch(withPath('api/file', path))

        if (!response.ok) {
            throw new ApiRequestError(response.statusText, response.status)
        }

        return response.text()
    },
    getPulls: () => request<PullRun[]>('api/pulls'),
    startPull: (pullRequest: PullRequest) =>
        request<PullRun>('api/pulls', { method: 'POST', body: JSON.stringify(pullRequest) }),
}

export function subscribeToServerEvents(listener: (event: ServerEvent) => void): () => void {
    const source = new EventSource('api/events')
    source.onmessage = (message) => listener(JSON.parse(message.data) as ServerEvent)

    return () => source.close()
}
