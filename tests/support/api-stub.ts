import type { ProjectSettings } from '@/settings'

import { buildSettings, createTempProject, removeTempProject } from './temp-project'

export interface ApiStub {
    projectPath: string
    requestedUrls: URL[]
    /** The `Authorization` header of every request, in order — read eagerly, since a finished request cannot be inspected later. */
    authorizations: (string | null)[]
    stop: () => Promise<void>
}

type SettingsForApi = (apiOrigin: string) => Partial<Pick<ProjectSettings, 'api' | 'projects'>>

/**
 * Runs a project whose API and accounts hosts are local stubs, so a request test exercises the real
 * client — base path, token refresh, and error handling included.
 */
export async function startApiStub(
    answer: (request: Request) => Response,
    settingsForApi: SettingsForApi,
    tokens: Partial<ProjectSettings['auth']['tokens']> = {}
): Promise<ApiStub> {
    const requestedUrls: URL[] = []
    const authorizations: (string | null)[] = []

    const apiServer = Bun.serve({
        port: 0,
        fetch(request) {
            requestedUrls.push(new URL(request.url))
            authorizations.push(request.headers.get('Authorization'))

            return answer(request)
        },
    })

    const accountsServer = Bun.serve({
        port: 0,
        fetch: () => Response.json({ access_token: 'fresh', expires_in: 3600, token_type: 'Bearer' }),
    })

    const projectPath = await createTempProject(
        buildSettings({
            auth: {
                baseUrl: accountsServer.url.origin,
                tokens: {
                    accessToken: 'access',
                    refreshToken: 'refresh',
                    accessTokenExpiresAt: Date.now() + 3_600_000,
                    ...tokens,
                },
            },
            ...settingsForApi(apiServer.url.origin),
        })
    )

    return {
        projectPath,
        requestedUrls,
        authorizations,
        stop: async () => {
            apiServer.stop(true)
            accountsServer.stop(true)
            await removeTempProject(projectPath)
        },
    }
}
