import { loadWidgetMocks, loadWidgetScenario, readLocalWidget } from '../services/local-widgets.service'
import type {
    WidgetCallLogEntry,
    WidgetDescription,
    WidgetEventName,
    WidgetMockData,
    WidgetMocks,
    WidgetScenario,
    WidgetSdkPayload,
} from '../widget.types'
import { resolveWidgetSdkCall } from '../widget.utils'

export interface WidgetSdkAnswer {
    ok: boolean
    data: unknown
    entry: WidgetCallLogEntry
}

export interface WidgetPushedEvent {
    name: WidgetEventName
    data: unknown
}

/** One opening of a widget: its scenario, its own call log, and the events waiting to reach it. */
export interface WidgetSession {
    id: string
    widget: WidgetDescription
    scenarioName?: string
    scenario: WidgetScenario
    calls: WidgetCallLogEntry[]
    answer(eventName: string, data: WidgetSdkPayload): Promise<WidgetSdkAnswer>
    push(event: WidgetPushedEvent): void
    subscribe(listener: (event: WidgetPushedEvent) => void): () => void
}

/**
 * What a test changes for its own session: `use` names files in `testing/mocks/`, `mocks` are
 * inline data. They cross from the test process, so they cannot hold functions.
 */
export interface WidgetSessionOverrides {
    use?: string[]
    mocks?: WidgetMockData
}

/**
 * Mocks apply in this order, a later one replacing an earlier one of the same key: the scenario's
 * `use`, the scenario's own `mocks`, the test's `use`, the test's `mocks`.
 */
export async function createWidgetSession(
    projectPath: string,
    widgetName: string,
    scenarioName?: string,
    overrides: WidgetSessionOverrides = {}
): Promise<WidgetSession> {
    const widget = await readLocalWidget(projectPath, widgetName)
    const resolvedScenarioName = scenarioName ?? widget.defaultScenario
    const loadedScenario = await loadWidgetScenario(projectPath, widgetName, resolvedScenarioName)
    const useMocks = async (names: unknown = [], where: string): Promise<WidgetMocks> => {
        if (!Array.isArray(names) || names.some((name) => typeof name !== 'string')) {
            throw new Error(`${where}: "use" must be a list of names of files in widgets/${widgetName}/testing/mocks/.`)
        }

        const sets = await Promise.all(names.map((name) => loadWidgetMocks(projectPath, widgetName, name)))

        return Object.assign({}, ...sets)
    }
    const scenario: WidgetScenario = {
        ...loadedScenario,
        mocks: {
            ...(await useMocks(loadedScenario.use, `Scenario "${resolvedScenarioName}" of widget "${widgetName}"`)),
            ...loadedScenario.mocks,
            ...(await useMocks(overrides.use, 'The session request')),
            ...overrides.mocks,
        },
    }
    const calls: WidgetCallLogEntry[] = []
    const listeners = new Set<(event: WidgetPushedEvent) => void>()

    async function answer(eventName: string, data: WidgetSdkPayload): Promise<WidgetSdkAnswer> {
        const args: WidgetSdkPayload = { ...data }
        delete args.category
        delete args.sdkVersion
        const call =
            eventName === 'CRM_EVENT'
                ? resolveWidgetSdkCall(data ?? {})
                : { method: `ZDK.${data?.action ?? eventName}`, supported: false }
        const entry: WidgetCallLogEntry = { at: new Date().toISOString(), method: call.method, args, ok: true }

        try {
            entry.response = await resolveAnswer(call.method, call.supported, args)
        } catch (error) {
            entry.ok = false
            entry.error = toRejection(error)
        }

        calls.push(entry)

        return { ok: entry.ok, data: entry.ok ? entry.response : entry.error, entry }
    }

    async function resolveAnswer(method: string, supported: boolean, args: WidgetSdkPayload): Promise<unknown> {
        if (!supported) {
            throw {
                code: 'ZOHO_STUDIO_UNSUPPORTED',
                message: `${method} is not supported by Zoho Studio yet, so the widget cannot be run with it locally.`,
            }
        }

        const mock = scenario.mocks?.[method]

        if (mock !== undefined) {
            const answer = typeof mock === 'function' ? await mock(args) : mock

            if (isRejection(answer)) {
                throw answer.$reject
            }

            return answer
        }

        throw {
            code: 'ZOHO_STUDIO_NO_MOCK',
            message: `No mock for ${method}. Add "${method}" to widgets/${widgetName}/testing/scenarios/${resolvedScenarioName ?? '<scenario>'}.ts or to a file in widgets/${widgetName}/testing/mocks/ the scenario uses.`,
        }
    }

    return {
        id: crypto.randomUUID(),
        widget,
        scenarioName: resolvedScenarioName,
        scenario,
        calls,
        answer,
        push: (event) => listeners.forEach((listener) => listener(event)),
        subscribe(listener) {
            listeners.add(listener)

            return () => listeners.delete(listener)
        },
    }
}

function isRejection(value: unknown): value is { $reject: unknown } {
    return typeof value === 'object' && value !== null && '$reject' in value
}

/** A mock rejects by throwing; an Error becomes a plain object, because it crosses postMessage. */
function toRejection(error: unknown): unknown {
    if (error instanceof Error) {
        return { code: 'ZOHO_STUDIO_ERROR', message: error.message }
    }

    return error
}
