import type { WidgetSdkPayload } from '../widget.types'
import { resolveWorkspaceOrganizationPath } from '@zoho-studio/core'

import { readLocalModuleFields } from '../../field/services/read-local-module-fields.service'
import { readLocalModuleLayouts } from '../../layout/services/read-local-module-layouts.service'
import { resolveLocalModuleNames } from '../../module/services/local-modules.service'
import { readLocalModuleMetadata } from '../../module/services/read-local-module.service'
import { readWidgetFixtureRecords } from '../services/local-widgets.service'

export type WidgetDefaultAnswer = { found: true; value: unknown } | { found: false }

const notFound: WidgetDefaultAnswer = { found: false }

/**
 * What a method answers when the scenario does not mock it: metadata from `data/`, the org from
 * `.zoho-studio/org.json`, records from the widget's fixtures, `true` for UI actions. External
 * calls (HTTP, connections) have no default, so nothing is made up for them.
 */
export async function answerWithDefault(
    projectPath: string,
    widgetName: string,
    method: string,
    args: WidgetSdkPayload
): Promise<WidgetDefaultAnswer> {
    if (method.startsWith('UI.')) {
        return { found: true, value: true }
    }

    switch (method) {
        case 'META.getFields':
            return { found: true, value: { fields: await readLocalModuleFields(projectPath, args.Entity) } }
        case 'META.getModules': {
            const names = await resolveLocalModuleNames(projectPath)
            const modules = await Promise.all(names.map((name) => readLocalModuleMetadata(projectPath, name)))

            return { found: true, value: { modules } }
        }
        case 'META.getLayouts': {
            const layouts = await readLocalModuleLayouts(projectPath, args.Entity)
            const wanted = args.Id ?? args.id

            return {
                found: true,
                value: { layouts: wanted ? layouts.filter((layout) => layout.id === wanted) : layouts },
            }
        }
        case 'CONFIG.getOrgInfo': {
            const file = Bun.file(resolveWorkspaceOrganizationPath(projectPath))

            return (await file.exists()) ? { found: true, value: { org: [await file.json()] } } : notFound
        }
        case 'API.getRecord':
            return answerWithFixtureRecord(projectPath, widgetName, args.APIData ?? {})
        case 'API.getAllRecords':
            return answerWithFixtureRecords(projectPath, widgetName, args.APIData ?? {})
        default:
            return notFound
    }
}

async function answerWithFixtureRecord(
    projectPath: string,
    widgetName: string,
    { Entity, RecordID }: WidgetSdkPayload
): Promise<WidgetDefaultAnswer> {
    const records = await readWidgetFixtureRecords(projectPath, widgetName, Entity)
    const record = records?.find((item) => String(item.id) === String(RecordID))

    if (!record) {
        throw {
            code: 'ZOHO_STUDIO_NO_FIXTURE',
            message: `No record ${RecordID} in widgets/${widgetName}/fixtures/${Entity}.json. Add it there or mock API.getRecord in the scenario.`,
        }
    }

    return { found: true, value: { data: [record] } }
}

async function answerWithFixtureRecords(
    projectPath: string,
    widgetName: string,
    { Entity }: WidgetSdkPayload
): Promise<WidgetDefaultAnswer> {
    const records = await readWidgetFixtureRecords(projectPath, widgetName, Entity)

    if (!records) {
        return notFound
    }

    return { found: true, value: { data: records, info: { count: records.length, more_records: false } } }
}
