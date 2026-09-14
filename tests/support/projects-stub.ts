import { buildSettings, createTempProject, removeTempProject } from './temp-project'

export interface ProjectsStub {
    projectPath: string
    requestedUrls: URL[]
    stop: () => Promise<void>
}

/**
 * Runs a project whose Projects and accounts hosts are local stubs, so a request test exercises the
 * real client — base path, token refresh, and error handling included.
 */
export async function startProjectsStub(answer: (request: Request) => Response): Promise<ProjectsStub> {
    const requestedUrls: URL[] = []

    const projectsServer = Bun.serve({
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
            projects: { baseUrl: projectsServer.url.origin, portalId: '100', projectId: '200' },
        })
    )

    return {
        projectPath,
        requestedUrls,
        stop: async () => {
            projectsServer.stop(true)
            accountsServer.stop(true)
            await removeTempProject(projectPath)
        },
    }
}

/** Answers one Projects list page the way the live API shapes it. */
export function listPage(key: string, items: unknown[], { page = 1, hasNextPage = false } = {}): Response {
    return Response.json({ [key]: items, page_info: { page, per_page: 200, has_next_page: hasNextPage } })
}
