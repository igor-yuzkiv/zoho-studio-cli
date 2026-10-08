import { basename } from 'node:path'

import { resolveWorkspaceOrganizationPath, resolveWorkspaceSourcePath } from '@/config'
import { getProjectSettings } from '@/settings'
import { workflowActionTypes } from '@/zoho-crm/entities/workflow-action'

import { readFileTree, readJsonBundle, resolveRequestedPath } from './artifact-files.service'
import { artifactGroups, findArtifactGroup, summarizeArtifactGroup } from './artifact-groups.service'
import type { ApiError, ProjectInfo, PullRequest, ServerEvent } from './browser.types'
import { LoginBusyError, LoginSession } from './login-session.service'
import { PullBusyError, PullRunner } from './pull-runner.service'

export type BrowserServerOptions = {
    projectPath: string
    port: number
    /** Serves the page; the browser command passes resolveWebAsset. */
    resolveAsset: (pathname: string) => Promise<Blob | null>
}

const maxTreeDepth = 8

export function startBrowserServer({ projectPath, port, resolveAsset }: BrowserServerOptions) {
    const pullRunner = new PullRunner()
    const loginSession = new LoginSession()

    return Bun.serve({
        hostname: '127.0.0.1',
        port,
        // Server-sent event streams stay open for as long as the page does.
        idleTimeout: 0,
        routes: {
            '/api/project': async () => Response.json(await readProjectInfo(projectPath)),

            '/api/groups': async () =>
                Response.json(
                    await Promise.all(artifactGroups.map((group) => summarizeArtifactGroup(projectPath, group)))
                ),

            '/api/tree': async (request) => {
                const url = new URL(request.url)
                const depth = Math.min(Number(url.searchParams.get('depth') ?? 1), maxTreeDepth)
                const tree = await readFileTree(projectPath, url.searchParams.get('path') ?? '', depth)

                return tree ? Response.json(tree) : apiError('Not found', 404)
            },

            '/api/file': async (request) => {
                const file = Bun.file(
                    resolveRequestedPath(projectPath, new URL(request.url).searchParams.get('path') ?? '')
                )

                return (await file.exists()) ? new Response(file) : apiError('Not found', 404)
            },

            '/api/json': async (request) =>
                Response.json(await readJsonBundle(projectPath, new URL(request.url).searchParams.get('path') ?? '')),

            '/api/pulls': {
                GET: () => Response.json(pullRunner.recentRuns),
                POST: async (request) => {
                    const pullRequest = (await request.json()) as PullRequest
                    const group = findArtifactGroup(pullRequest.area, pullRequest.group)

                    if (!group) {
                        return apiError(`Unknown group ${pullRequest.area}/${pullRequest.group}`, 404)
                    }

                    try {
                        return Response.json(pullRunner.start(group, pullRequest.options ?? {}), { status: 202 })
                    } catch (error) {
                        if (error instanceof PullBusyError) {
                            return apiError(error.message, 409)
                        }

                        throw error
                    }
                },
            },

            '/api/login': {
                GET: () => Response.json(loginSession.state),
                POST: () => {
                    try {
                        return Response.json(loginSession.start(), { status: 202 })
                    } catch (error) {
                        if (error instanceof LoginBusyError) {
                            return apiError(error.message, 409)
                        }

                        throw error
                    }
                },
            },

            '/api/events': (request) => streamEvents(request, pullRunner, loginSession),

            '/api/*': () => apiError('Not found', 404),
        },

        fetch: async (request) => {
            const asset = await resolveAsset(new URL(request.url).pathname)

            return asset ? new Response(asset) : new Response('Not found', { status: 404 })
        },

        error: (error) => apiError(error.message, 400),
    })
}

async function readProjectInfo(projectPath: string): Promise<ProjectInfo> {
    const { settings } = await getProjectSettings(projectPath)
    const organizationFile = Bun.file(resolveWorkspaceOrganizationPath(projectPath))

    return {
        name: basename(projectPath),
        projectPath,
        sourcePath: resolveWorkspaceSourcePath(projectPath),
        organization: (await organizationFile.exists()) ? await organizationFile.json() : null,
        auth: settings.auth.tokens.refreshToken ? 'authorized' : 'missing',
        workflowActionTypes: [...workflowActionTypes],
    }
}

function streamEvents(request: Request, pullRunner: PullRunner, loginSession: LoginSession): Response {
    let unsubscribe = () => {}

    const stream = new ReadableStream<string>({
        start(controller) {
            const send = (event: ServerEvent) => controller.enqueue(`data: ${JSON.stringify(event)}\n\n`)

            const unsubscribeFromPulls = pullRunner.subscribe((run) => send({ type: 'pull', run }))
            const unsubscribeFromLogin = loginSession.subscribe((state) => send({ type: 'login', state }))

            unsubscribe = () => {
                unsubscribeFromPulls()
                unsubscribeFromLogin()
            }
            request.signal.addEventListener('abort', () => {
                unsubscribe()
                controller.close()
            })
        },
        cancel: () => unsubscribe(),
    })

    return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
}

function apiError(message: string, status: number): Response {
    return Response.json({ error: message } satisfies ApiError, { status })
}
