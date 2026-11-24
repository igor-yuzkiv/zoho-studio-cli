import { loadWidgetScenario, readLocalWidget } from '../services/local-widgets.service'
import type {
    WidgetCallLogEntry,
    WidgetDescription,
    WidgetEventName,
    WidgetMockData,
    WidgetScenario,
    WidgetSdkPayload,
} from '../widget.types'
import { resolveWidgetSdkCall } from '../widget.utils'
import { answerWithDefault } from './widget-default-responses.service'

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
 * `mockOverrides` replace the scenario's mocks of the same name for this session only; a test
 * passes them to try one situation without a scenario file of its own.
 */
export async function createWidgetSession(
    projectPath: string,
    widgetName: string,
    scenarioName?: string,
    mockOverrides: WidgetMockData = {}
): Promise<WidgetSession> {
    const widget = await readLocalWidget(projectPath, widgetName)
    const resolvedScenarioName = scenarioName ?? widget.defaultScenario
    const loadedScenario = await loadWidgetScenario(projectPath, widgetName, resolvedScenarioName)
    const scenario = { ...loadedScenario, mocks: { ...loadedScenario.mocks, ...mockOverrides } }
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

        const fallback = await answerWithDefault(projectPath, widgetName, method, args)

        if (fallback.found) {
            return fallback.value
        }

        throw {
            code: 'ZOHO_STUDIO_NO_MOCK',
            message: `No mock for ${method}. Add "${method}" to mocks in widgets/${widgetName}/scenarios/${resolvedScenarioName ?? '<scenario>'}.ts.`,
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
