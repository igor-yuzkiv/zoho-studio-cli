import type { widgetEventNames, widgetLocations } from './widget.utils'

export type WidgetLocation = (typeof widgetLocations)[number]

/** `widgets/<name>/widget.json`: where a widget already runs and what it is, as the studio needs it. */
export interface WidgetDescription {
    name: string
    url: string
    location?: WidgetLocation
    defaultScenario?: string
    /**
     * Where the widget's code is, relative to the widget folder or absolute, so an agent can read
     * which SDK calls it makes. Defaults to `src` when the widget folder has one.
     */
    source?: string
    /** How to start the widget when nothing answers at `url`; `cwd` is relative to the widget folder. */
    run?: WidgetRunCommand
}

export interface WidgetRunCommand {
    command: string
    cwd?: string
}

export type WidgetEventName = (typeof widgetEventNames)[number]

/**
 * What a mock answers: data resolves the widget's promise, `{ $reject: value }` or a thrown error
 * rejects it.
 */
export type WidgetMockHandler = unknown | ((args: Record<string, unknown>) => unknown | Promise<unknown>)

/** Mocks that are plain data, so they can cross from a test process to the emulator. */
export type WidgetMockData = Record<string, unknown>

/** Answers of SDK methods keyed `API.getRecord`: a file in `testing/mocks/`, or inline. */
export type WidgetMocks = Record<string, WidgetMockHandler>

/**
 * One run of a widget: what `PageLoad` carries and how SDK methods answer. `use` names files in
 * `testing/mocks/`, applied in order; `mocks` override them by key.
 */
export interface WidgetScenario {
    pageLoad?: Record<string, unknown>
    use?: string[]
    mocks?: WidgetMocks
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
