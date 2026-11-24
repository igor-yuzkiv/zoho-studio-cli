import type { widgetEventNames, widgetLocations } from './widget.utils'

export type WidgetLocation = (typeof widgetLocations)[number]

/** `widgets/<name>/widget.json`: where a widget already runs and what it is, as the studio needs it. */
export interface WidgetDescription {
    name: string
    url: string
    location?: WidgetLocation
    defaultScenario?: string
}

export type WidgetEventName = (typeof widgetEventNames)[number]

/** What a mock answers: data resolves the widget's promise, a thrown error rejects it. */
export type WidgetMockHandler = unknown | ((args: Record<string, unknown>) => unknown | Promise<unknown>)

/** One run of a widget: what `PageLoad` carries and how SDK methods answer, keyed `API.getRecord`. */
export interface WidgetScenario {
    pageLoad?: Record<string, unknown>
    mocks?: Record<string, WidgetMockHandler>
}

export interface WidgetCallLogEntry {
    at: string
    method: string
    args: Record<string, unknown>
    ok: boolean
    response?: unknown
    error?: unknown
}

export interface WidgetSdkCall {
    method: string
    supported: boolean
}

/**
 * A `CRM_EVENT` payload as SDK 1.5 builds it. Its fields differ per method and come from widget
 * code, so they are read loosely rather than modelled per method.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WidgetSdkPayload = Record<string, any>
