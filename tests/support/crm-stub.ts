import { buildSettings, createTempProject, removeTempProject } from './temp-project'

export interface CrmStub {
    projectPath: string
    requestedUrls: URL[]
    stop: () => Promise<void>
}

/**
 * Runs a project whose CRM and accounts hosts are local stubs, so a request test exercises the real
 * client — base path, token refresh, and error handling included.
 */
export async function startCrmStub(answer: (request: Request) => Response): Promise<CrmStub> {
    const requestedUrls: URL[] = []

    const crmServer = Bun.serve({
        port: 0,
        fetch(request) {
            requestedUrls.push(new URL(request.url))

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
                },
            },
            api: { baseUrl: crmServer.url.origin, version: 'v8' },
        })
    )

    return {
        projectPath,
        requestedUrls,
        stop: async () => {
            crmServer.stop(true)
            accountsServer.stop(true)
            await removeTempProject(projectPath)
        },
    }
}
