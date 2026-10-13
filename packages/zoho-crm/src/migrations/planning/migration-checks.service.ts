import { getFieldsList } from '../../entities/field'
import { getModulesList, type ZohoModule } from '../../entities/module'
import { findProfileByName, getProfilesList } from '../../entities/profile'

import type { MigrationDescription } from '../definition'

import type { MigrationCheck } from './migration-plan.types'

interface ExistingField {
    api_name: string
    field_label: string
}

/**
 * Fields Zoho adds to every new custom module, as seen on a sandbox org. Currency and Exchange Rate
 * appear only with multi-currency enabled, but are listed anyway: a needless block is cheaper than
 * a run that fails halfway.
 */
function newModuleFields(singularLabel: string): ExistingField[] {
    return [
        ['Name', `${singularLabel} Name`],
        ['Owner', `${singularLabel} Owner`],
        ['Record_Image', `${singularLabel} Image`],
        ['Email', 'Email'],
        ['Secondary_Email', 'Secondary Email'],
        ['Email_Opt_Out', 'Email Opt Out'],
        ['Created_By', 'Created By'],
        ['Modified_By', 'Modified By'],
        ['Created_Time', 'Created Time'],
        ['Modified_Time', 'Modified Time'],
        ['Last_Activity_Time', 'Last Activity Time'],
        ['Tag', 'Tag'],
        ['Currency', 'Currency'],
        ['Exchange_Rate', 'Exchange Rate'],
        ['Locked__s', 'Locked'],
        ['Record_Status__s', 'Record Status'],
        ['Unsubscribed_Mode', 'Unsubscribed Mode'],
        ['Unsubscribed_Time', 'Unsubscribed Time'],
        ['id', 'Record Id'],
    ].map(([api_name, field_label]) => ({ api_name: api_name!, field_label: field_label! }))
}

/** Compares a described migration with the current state of Zoho CRM; read failures are thrown. */
export async function checkMigration(description: MigrationDescription): Promise<MigrationCheck> {
    const conflicts: string[] = []
    const modules = await getModulesList()
    const findModule = (apiName: string) => modules.find((module) => sameName(module.api_name, apiName))

    let existingFields: ExistingField[] = []
    let profileIds: string[] = []

    if (description.action === 'create') {
        conflicts.push(...findTakenModuleNames(modules, description.module))
        existingFields = newModuleFields(description.module.singular_label)

        const resolved = await resolveProfileIds(description.profiles)
        conflicts.push(...resolved.conflicts)
        profileIds = resolved.profileIds
    } else if (findModule(description.module.api_name)) {
        existingFields = await getFieldsList(description.module.api_name)
    } else {
        conflicts.push(`Module "${description.module.api_name}" does not exist in Zoho CRM.`)
    }

    for (const field of description.fields) {
        const takenByApiName = field.api_name && existingFields.find((existing) => sameName(existing.api_name, field.api_name!))
        const takenByLabel = existingFields.find((existing) => sameName(existing.field_label, field.field_label))

        if (takenByLabel) {
            conflicts.push(`Field "${field.field_label}": the label is already taken by ${describeField(takenByLabel)}.`)
        } else if (takenByApiName) {
            conflicts.push(`Field "${field.field_label}": the API name is already taken by ${describeField(takenByApiName)}.`)
        }

        const lookupTarget = (field.lookup as { module?: { api_name?: string } } | undefined)?.module?.api_name

        if (lookupTarget && !findModule(lookupTarget)) {
            conflicts.push(`Field "${field.field_label}": the lookup target module "${lookupTarget}" does not exist in Zoho CRM.`)
        }
    }

    return { conflicts, profileIds }
}

function findTakenModuleNames(
    modules: ZohoModule[],
    wanted: { api_name?: string; singular_label: string; plural_label: string }
): string[] {
    const conflicts: string[] = []

    for (const module of modules) {
        for (const property of ['api_name', 'singular_label', 'plural_label'] as const) {
            const wantedName = wanted[property]
            const existingName = module[property]

            if (wantedName && typeof existingName === 'string' && sameName(existingName, wantedName)) {
                conflicts.push(`Module "${module.api_name}" already has the ${property} "${wantedName}".`)
            }
        }
    }

    return conflicts
}

async function resolveProfileIds(names: string[]): Promise<MigrationCheck> {
    const profiles = await getProfilesList()
    const conflicts: string[] = []
    const profileIds: string[] = []

    for (const name of names) {
        try {
            profileIds.push(findProfileByName(profiles, name).id)
        } catch (error) {
            conflicts.push(error instanceof Error ? error.message : String(error))
        }
    }

    return { conflicts, profileIds }
}

function describeField(field: ExistingField): string {
    return `the field "${field.field_label}" (${field.api_name})`
}

function sameName(left: string, right: string): boolean {
    return left.toLowerCase() === right.toLowerCase()
}
