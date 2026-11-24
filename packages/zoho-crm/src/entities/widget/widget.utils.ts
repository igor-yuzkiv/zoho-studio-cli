import type { WidgetDescription, WidgetLocation, WidgetScenario, WidgetSdkCall, WidgetSdkPayload } from './widget.types'

export const widgetDescriptionFileName = 'widget.json'
export const widgetScenariosDirName = 'scenarios'
export const widgetResultsDirName = 'results'

/** The places Zoho CRM can show a widget; the studio records it but sends whatever the scenario says. */
export const widgetLocations = [
    'Dashboard',
    'Web Tab',
    'Custom Button',
    'Custom Related List',
    'Wizard',
    'Signal',
    'Settings',
    'Blueprint',
] as const

/** The events `ZOHO.embeddedApp.on` listens to; names are case-sensitive in the SDK. */
export const widgetEventNames = [
    'PageLoad',
    'DialerActive',
    'Dial',
    'Notify',
    'NotifyAndWait',
    'ContextUpdate',
] as const

/** Gives a scenario file its type; the result is the plain object, so a second copy of the package reads it too. */
export function defineWidgetScenario(scenario: WidgetScenario): WidgetScenario {
    return scenario
}

export function parseWidgetDescription(name: string, raw: unknown): WidgetDescription {
    const source = (raw ?? {}) as Record<string, unknown>
    const where = `widgets/${name}/${widgetDescriptionFileName}`

    if (typeof source.url !== 'string' || !/^https?:\/\//.test(source.url)) {
        throw new Error(`${where}: "url" must be the http(s) address the widget runs at.`)
    }

    if (source.location !== undefined && !widgetLocations.includes(source.location as WidgetLocation)) {
        throw new Error(`${where}: "location" must be one of ${widgetLocations.join(', ')}.`)
    }

    if (source.defaultScenario !== undefined && typeof source.defaultScenario !== 'string') {
        throw new Error(`${where}: "defaultScenario" must be a scenario name.`)
    }

    if (source.source !== undefined && (typeof source.source !== 'string' || source.source.trim() === '')) {
        throw new Error(`${where}: "source" must be the path to the widget's code.`)
    }

    return {
        name,
        url: source.url,
        location: source.location as WidgetLocation | undefined,
        defaultScenario: source.defaultScenario as string | undefined,
        source: source.source as string | undefined,
    }
}

/**
 * The SDK trusts only the parent named by `serviceOrigin`, so the harness puts its own origin there.
 * The SDK reads parameters from everything after the first `?` of the full address, hash included,
 * so the parameter goes at the very end: before a hash, a hash router's path would end up in its value.
 */
export function widgetUrlWithServiceOrigin(widgetUrl: string, serviceOrigin: string): string {
    const separator = widgetUrl.includes('?') ? '&' : '?'

    return `${widgetUrl}${separator}serviceOrigin=${encodeURIComponent(serviceOrigin)}`
}

const unsupported = (method: string): WidgetSdkCall => ({ method, supported: false })
const supported = (method: string): WidgetSdkCall => ({ method, supported: true })

/**
 * Names the SDK method a `CRM_EVENT` came from. SDK 1.5 sends a category and a few fields
 * instead of the method name, so the mapping mirrors how its methods build the message.
 */
export function resolveWidgetSdkCall(data: WidgetSdkPayload): WidgetSdkCall {
    const { category, type, action } = data

    switch (category) {
        case 'READ':
            // The SDK's own examples pass RelatedList, Zoho's widget docs RelatedListAPIName.
            if (data.APIData?.RecordID && (data.APIData?.RelatedList || data.APIData?.RelatedListAPIName)) {
                return supported('API.getRelatedRecords')
            }
            return supported(data.APIData?.RecordID ? 'API.getRecord' : 'API.getAllRecords')
        case 'CREATE':
            if (type === 'NOTES') return supported('API.addNotes')
            if (type === 'ATTACHMENT') return supported('API.attachFile')
            return supported(data.APIData?.action === 'UPSERT' ? 'API.upsertRecord' : 'API.insertRecord')
        case 'UPDATE':
            return supported(
                {
                    RELATED_RECORD: 'API.updateRelatedRecords',
                    PROFILE: 'API.updateProfile',
                    NOTES: 'API.addNotesAttachment',
                }[type as string] ?? 'API.updateRecord'
            )
        case 'DELETE':
            return supported(type === 'RELATED_RECORD' ? 'API.delinkRelatedRecord' : 'API.deleteRecord')
        case 'SEARCH':
            return supported('API.searchRecord')
        case 'QUERY':
            return supported('API.coql')
        case 'USER':
            return supported(data.ID ? 'API.getUser' : 'API.getAllUsers')
        case 'PROFILES':
            return supported(type === 'GET_PROFILE' ? 'API.getProfile' : 'API.getAllProfiles')
        case 'CONFIG':
            return supported(
                {
                    ORG: 'CONFIG.getOrgInfo',
                    CURRENT_USER: 'CONFIG.getCurrentUser',
                    ORG_LEVEL_INFO: 'CONFIG.GetCurrentEnvironment',
                    USER_PREFERENCE: 'CONFIG.getUserPreference',
                    VARIABLE: 'API.getOrgVariable',
                }[type as string] ?? `CONFIG.${type}`
            )
        case 'META':
            return supported(
                {
                    FIELD_LIST: 'META.getFields',
                    MODULE_LIST: 'META.getModules',
                    ASSIGNMENT_RULES: 'META.getAssignmentRules',
                    LAYOUT: 'META.getLayouts',
                    LAYOUTS: 'META.getLayouts',
                    RELATED_LIST: 'META.getRelatedList',
                    CUSTOM_VIEW: 'META.getCustomViews',
                    CUSTOM_VIEWS: 'META.getCustomViews',
                }[type as string] ?? `META.${type}`
            )
        case 'UI':
            return supported(resolveUiMethod(action))
        case 'CONNECTOR':
            if (typeof data.nameSpace === 'string' && data.nameSpace.startsWith('wget.')) {
                return supported(`HTTP.${data.nameSpace.slice('wget.'.length)}`)
            }
            return supported(type === 'CONNECTOR_AUTHORIZE' ? 'CONNECTOR.authorize' : 'CONNECTOR.invokeAPI')
        case 'CRM_CONNECTION':
            return supported('CONNECTION.invoke')
        case 'FUNCTIONS_EXECUTE':
            return unsupported('FUNCTIONS.execute')
        case 'EVENTS_DISPATCH':
            return unsupported('EVENTS.dispatch')
        case 'CRM_WIZARD':
            return unsupported('WIZARD.post')
        case 'CRM_BLUEPRINT':
            return unsupported('BLUEPRINT.proceed')
        case 'BLUEPRINT':
            return unsupported(data.action === 'UPDATE_BLUEPRINT_STATUS' ? 'API.updateBluePrint' : 'API.getBluePrint')
        case 'APPROVALS':
            return unsupported(`API.approvals (${data.action})`)
        case 'FILES':
            return unsupported(type === 'UPLOAD_FILE' ? 'API.uploadFile' : 'API.getFile')
        case 'ACTION':
            return unsupported(`ACTION.${type}`)
        case 'ZRC_REQUEST':
            return unsupported('zrc')
        default:
            return unsupported(String(category))
    }
}

function resolveUiMethod(action: WidgetSdkPayload[string]): string {
    if (action === 'RESIZE') return 'UI.Resize'
    if (action?.telephony) return `UI.Dialer.${String(action.telephony).toLowerCase()}`
    if (action?.record) return `UI.Record.${String(action.record).toLowerCase()}`
    if (action?.popup) return action.popup === 'CLOSE_RELOAD' ? 'UI.Popup.closeReload' : 'UI.Popup.close'
    if (action?.webTab) return 'UI.Widget.open'

    return 'UI.unknown'
}
