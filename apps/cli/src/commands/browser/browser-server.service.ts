import { basename } from 'node:path'

import { resolveWorkspaceOrganizationPath, resolveWorkspaceSourcePath } from '@zoho-studio/core'
import { addProfile, listProfiles, readConnection } from '@zoho-studio/core'
import { getProjectSettings } from '@zoho-studio/core'
import { workflowActionTypes } from '@zoho-studio/zoho-crm/workflow-action'

import { readFileTree, readJsonBundle, resolveRequestedPath } from './artifact-files.service'
import { artifactGroups, findArtifactGroup, summarizeArtifactGroup } from './artifact-groups.service'
import type {
    ApiError,
    AuthStatus,
    ConnectionName,
    CreateProfileRequest,
    LoginRequest,
    ProfileSummary,
    ProjectInfo,
    PullRequest,
    ServerEvent,
} from './browser.types'
import { readLogPage } from './log-reader.service'
import { LoginBusyError, LoginSession } from './login-session.service'
import { PullBusyError, PullRunner } from './pull-runner.service'

export type BrowserServerOptions = {
    projectPath: string
    port: number
    /** Serves the page; the browser command passes resolveWebAsset. */
    resolveAsset: (pathname: string) => Promise<Blob | null>
}

const maxTreeDepth = 8
const maxLogPageSize = 500

export function startBrowserServer({ projectPath, port, resolveAsset }: BrowserServerOptions) {
    const pullRunner = new PullRunner()
    const loginSession = new LoginSession()

    const server: ReturnType<typeof Bun.serve> = Bun.serve({
        hostname: '127.0.0.1',
        port,
        // Server-sent event streams stay open for as long as the page does.
        idleTimeout: 0,
        routes: guardRoutes(() => server.port, {
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

                // Served as text: an .html or .svg artifact must not run as a page on this origin.
                return (await file.exists())
                    ? new Response(file, {
                          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
                      })
                    : apiError('Not found', 404)
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

            '/api/logs': async (request) => {
                const url = new URL(request.url)
                const before = url.searchParams.get('before')
                const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), maxLogPageSize)
                const { settings } = await getProjectSettings(projectPath)

                return Response.json(
                    await readLogPage(projectPath, settings.logs.file, before === null ? null : Number(before), limit)
                )
            },

            '/api/profiles': {
                GET: async () => Response.json(summarizeProfiles(await listProfiles())),
                POST: async (request) => {
                    const { name, clientId, clientSecret } = (await request.json()) as Partial<CreateProfileRequest>

                    if (!isFilled(name) || !isFilled(clientId) || !isFilled(clientSecret)) {
                        return apiError('A profile needs a name, a client id, and a client secret.', 400)
                    }

                    if ((await listProfiles()).some((profile) => profile.name === name.trim())) {
                        return apiError(`A profile named "${name.trim()}" already exists.`, 409)
                    }

                    const profile = { name: name.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim() }
                    await addProfile(profile)

                    return Response.json(summarizeProfiles([profile])[0], { status: 201 })
                },
            },

            '/api/login': {
                GET: () => Response.json(loginSession.state),
                POST: async (request) => {
                    const { profile, connection } = (await request.json()) as Partial<LoginRequest>

                    if (!isFilled(profile) || (connection !== 'default' && connection !== 'projects')) {
                        return apiError('A login needs a profile and a connection: "default" or "projects".', 400)
                    }

                    try {
                        return Response.json(loginSession.start({ profile, connection }), { status: 202 })
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
        }),

        fetch: async (request) => {
            const asset = await resolveAsset(new URL(request.url).pathname)

            return asset ? new Response(asset) : new Response('Not found', { status: 404 })
        },

        error: (error) => apiError(error.message, 400),
    })

    return server
}

type RouteHandler = (request: Bun.BunRequest) => Response | Promise<Response>
type Route = RouteHandler | Partial<Record<'GET' | 'POST', RouteHandler>>

/**
 * The API can empty folders under src/ and start a login, and any page open in the same browser can
 * send requests to 127.0.0.1. Only the app's own page is answered: the Host must name this server
 * (which defeats DNS rebinding), a cross-site Origin is refused, and a POST must declare JSON, which
 * a cross-site form or no-preflight fetch cannot do.
 */
function guardRoutes<TRoutes extends Record<string, Route>>(
    currentPort: () => number | undefined,
    routes: TRoutes
): TRoutes {
    const guard =
        (handler: RouteHandler): RouteHandler =>
        (request) => {
            const refusal = refuseForeignRequest(request, currentPort())

            return refusal ?? handler(request)
        }

    return Object.fromEntries(
        Object.entries(routes).map(([path, route]) => [
            path,
            typeof route === 'function'
                ? guard(route)
                : Object.fromEntries(Object.entries(route).map(([method, handler]) => [method, guard(handler)])),
        ])
    ) as TRoutes
}

export function refuseForeignRequest(request: Request, port: number | undefined): Response | null {
    const ownHosts = [`127.0.0.1:${port}`, `localhost:${port}`]
    const origin = request.headers.get('Origin')

    if (!ownHosts.includes(request.headers.get('Host') ?? '')) {
        return apiError('Unknown host', 403)
    }

    if (origin && !ownHosts.some((host) => origin === `http://${host}`)) {
        return apiError('Cross-origin requests are refused', 403)
    }

    if (request.method === 'POST' && !request.headers.get('Content-Type')?.startsWith('application/json')) {
        return apiError('Expected a JSON request', 415)
    }

    return null
}

async function readProjectInfo(projectPath: string): Promise<ProjectInfo> {
    const organizationFile = Bun.file(resolveWorkspaceOrganizationPath(projectPath))

    return {
        name: basename(projectPath),
        projectPath,
        sourcePath: resolveWorkspaceSourcePath(projectPath),
        organization: (await organizationFile.exists()) ? await organizationFile.json() : null,
        auth: {
            default: await readAuthStatus(projectPath, 'default'),
            projects: await readAuthStatus(projectPath, 'projects'),
        },
        workflowActionTypes: [...workflowActionTypes],
    }
}

/** A key shared with another project's path reads as not logged in rather than failing the whole page. */
async function readAuthStatus(projectPath: string, connection: ConnectionName): Promise<AuthStatus> {
    const tokens = await readConnection(projectPath, connection).catch(() => null)

    return tokens?.refreshToken ? 'authorized' : 'missing'
}

function summarizeProfiles(profiles: ProfileSummary[]): ProfileSummary[] {
    return profiles.map(({ name, clientId }) => ({ name, clientId }))
}

function isFilled(value: unknown): value is string {
    return typeof value === 'string' && value.trim() !== ''
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
