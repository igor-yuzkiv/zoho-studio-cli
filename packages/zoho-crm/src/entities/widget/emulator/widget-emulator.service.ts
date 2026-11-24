import type { WidgetSdkPayload } from '../widget.types'
import { listLocalWidgets, listWidgetScenarios } from '../services/local-widgets.service'
import { widgetEventNames, widgetUrlWithServiceOrigin } from '../widget.utils'
import type { WidgetEventName, WidgetMockData } from '../widget.types'
import { renderWidgetHarnessPage } from './widget-harness.page'
import { createWidgetSession, type WidgetSession } from './widget-session.service'

export interface WidgetSessionInfo {
    id: string
    widget: string
    scenario: string | null
    url: string
}

export interface WidgetEmulator {
    origin: string
    createSession(widgetName: string, scenarioName?: string, mocks?: WidgetMockData): Promise<WidgetSessionInfo>
    stop(): Promise<void>
}

export interface StartWidgetEmulatorOptions {
    projectPath: string
    port?: number
}

/**
 * Serves harness pages and the session API. Bound to 127.0.0.1 only, and always named that way,
 * because the SDK compares the parent's origin to `serviceOrigin` character for character.
 */
export function startWidgetEmulator({ projectPath, port = 0 }: StartWidgetEmulatorOptions): WidgetEmulator {
    const sessions = new Map<string, WidgetSession>()
    let origin = ''

    async function createSession(
        widgetName: string,
        scenarioName?: string,
        mocks?: WidgetMockData
    ): Promise<WidgetSessionInfo> {
        const session = await createWidgetSession(projectPath, widgetName, scenarioName, mocks)
        sessions.set(session.id, session)

        return describeSession(session)
    }

    function describeSession(session: WidgetSession): WidgetSessionInfo {
        return {
            id: session.id,
            widget: session.widget.name,
            scenario: session.scenarioName ?? null,
            url: `${origin}/harness/${session.id}`,
        }
    }

    function withSession(handler: (session: WidgetSession, request: Request) => Promise<Response> | Response) {
        return (request: Bun.BunRequest) => {
            const session = sessions.get((request.params as Record<string, string>).id ?? '')

            return session ? handler(session, request) : Response.json({ error: 'Unknown session' }, { status: 404 })
        }
    }

    const server = Bun.serve({
        hostname: '127.0.0.1',
        port,
        idleTimeout: 0,
        routes: guardRoutes(() => origin, {
            '/api/widgets': async () =>
                Response.json(
                    await Promise.all(
                        (await listLocalWidgets(projectPath)).map(async (widget) => ({
                            ...widget,
                            scenarios: await listWidgetScenarios(projectPath, widget.name),
                        }))
                    )
                ),
            '/api/sessions': {
                POST: async (request) => {
                    const body = (await request.json().catch(() => ({}))) as {
                        widget?: string
                        scenario?: string
                        mocks?: WidgetMockData
                    }

                    if (!body.widget) {
                        return Response.json({ error: 'Expected { "widget": "<name>" }' }, { status: 400 })
                    }

                    try {
                        return Response.json(await createSession(body.widget, body.scenario, body.mocks))
                    } catch (error) {
                        return Response.json(
                            { error: error instanceof Error ? error.message : String(error) },
                            { status: 400 }
                        )
                    }
                },
            },
            '/api/sessions/:id': {
                GET: withSession((session) => Response.json(describeSession(session))),
                DELETE: withSession((session) => {
                    sessions.delete(session.id)

                    return new Response(null, { status: 204 })
                }),
            },
            '/api/sessions/:id/calls': withSession((session) => Response.json(session.calls)),
            '/api/sessions/:id/sdk': {
                POST: withSession(async (session, request) => {
                    const { eventName, data } = (await request.json()) as { eventName: string; data: WidgetSdkPayload }

                    return Response.json(await session.answer(eventName, data))
                }),
            },
            '/api/sessions/:id/events': {
                POST: withSession(async (session, request) => {
                    const { name, data } = (await request.json()) as { name: WidgetEventName; data: unknown }

                    if (!widgetEventNames.includes(name)) {
                        return Response.json(
                            { error: `Event must be one of ${widgetEventNames.join(', ')}` },
                            { status: 400 }
                        )
                    }

                    session.push({ name, data })

                    return new Response(null, { status: 204 })
                }),
            },
            '/api/sessions/:id/stream': withSession((session, request) => streamSessionEvents(session, request)),
            '/harness/:id': withSession(
                (session) =>
                    new Response(
                        renderWidgetHarnessPage({
                            sessionId: session.id,
                            widgetName: session.widget.name,
                            scenarioName: session.scenarioName,
                            widgetSrc: widgetUrlWithServiceOrigin(session.widget.url, origin),
                            pageLoad: session.scenario.pageLoad ?? {},
                        }),
                        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    )
            ),
        }),
        fetch: (request) => refuseForeignRequest(request, origin) ?? new Response('Not found', { status: 404 }),
    })

    origin = `http://127.0.0.1:${server.port}`

    return {
        origin,
        createSession,
        stop: async () => {
            await server.stop(true)
        },
    }
}

type RouteHandler = (request: Bun.BunRequest) => Response | Promise<Response>

/**
 * The widget runs on another origin and must not drive the session API; the harness page and the
 * test fixture (no Origin header at all) may.
 */
function guardRoutes<TRoutes extends Record<string, RouteHandler | Record<string, RouteHandler>>>(
    getOrigin: () => string,
    routes: TRoutes
): TRoutes {
    const guard =
        (handler: RouteHandler): RouteHandler =>
        (request) =>
            refuseForeignRequest(request, getOrigin()) ?? handler(request)

    return Object.fromEntries(
        Object.entries(routes).map(([path, route]) => [
            path,
            typeof route === 'function'
                ? guard(route)
                : Object.fromEntries(Object.entries(route).map(([method, handler]) => [method, guard(handler)])),
        ])
    ) as TRoutes
}

function refuseForeignRequest(request: Request, origin: string): Response | null {
    const requestOrigin = request.headers.get('Origin')

    return requestOrigin && requestOrigin !== origin
        ? Response.json({ error: 'Cross-origin requests are refused' }, { status: 403 })
        : null
}

function streamSessionEvents(session: WidgetSession, request: Request): Response {
    let unsubscribe = () => {}

    const stream = new ReadableStream<string>({
        start(controller) {
            unsubscribe = session.subscribe((event) => controller.enqueue(`data: ${JSON.stringify(event)}\n\n`))
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
