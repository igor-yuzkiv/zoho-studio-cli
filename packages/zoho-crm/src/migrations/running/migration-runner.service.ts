import { describeRequestError } from '../../api'
import { createFieldsRequest, getFieldsListRequest, saveModuleFields } from '../../entities/field'
import { createModuleRequest, getModulesListRequest, saveModuleMetadata } from '../../entities/module'
import { getOrganizationRequest } from '../../entities/organization'

import { readMigrationJournal, saveMigrationJournalEntry, type MigrationJournalEntry } from '../journal'
import type { MigrationStep, PreparedMigration } from '../planning'

import type { MigrationEvent, MigrationRunStatus } from './migration-run.types'

type EmitMigrationEvent = (event: MigrationEvent) => void

/**
 * Runs a prepared migration step by step and stops at the first step that fails. Zoho cannot delete
 * a module, so nothing is rolled back; instead the result is read back from Zoho, the local
 * artifacts of the module are refreshed, and the run is journaled whatever its outcome.
 */
export async function runMigration(
    projectPath: string,
    prepared: PreparedMigration,
    emit: EmitMigrationEvent
): Promise<MigrationRunStatus> {
    const finish = (status: MigrationRunStatus, message: string) => {
        emit({ type: 'finished', status, message })
        return status
    }

    if (!prepared.plan || !prepared.description || prepared.conflicts.length > 0) {
        const count = prepared.conflicts.length
        return finish('blocked', `The migration has ${count} conflict${count === 1 ? '' : 's'}.`)
    }

    const organizationId = (await getOrganizationRequest()).id ?? 'unknown'
    const previousRun = (await readMigrationJournal(projectPath, organizationId))[prepared.name]

    if (previousRun?.status === 'applied') {
        return finish('blocked', `The migration was already applied to this organization on ${previousRun.ranAt}.`)
    }

    const entry: MigrationJournalEntry = { status: 'applied', ranAt: new Date().toISOString(), fieldIds: {} }
    let moduleApiName = prepared.description.action === 'update' ? prepared.description.module.api_name : null

    for (const [index, step] of prepared.plan.steps.entries()) {
        emit({ type: 'step-started', index, step })

        try {
            moduleApiName = await runStep(step, moduleApiName, index, entry, emit)
            emit({ type: 'step-finished', index, status: 'success' })
        } catch (error) {
            entry.status = 'failed'
            entry.error = describeRequestError(error)
            emit({ type: 'step-finished', index, status: 'failed', error: entry.error })
            break
        }
    }

    if (moduleApiName) {
        try {
            await verifyAndRefresh(projectPath, moduleApiName, prepared, emit)
        } catch (error) {
            // Zoho has already changed by now, so the run is journaled whatever the read-back says.
            emit({ type: 'verification-failed', error: describeRequestError(error) })
        }
    }

    await saveMigrationJournalEntry(projectPath, organizationId, prepared.name, entry)

    return entry.status === 'applied'
        ? finish('applied', `Migration "${prepared.name}" applied.`)
        : finish('failed', `Migration "${prepared.name}" failed: ${entry.error}`)
}

/** Runs one step and returns the API name of the module the next steps work on. */
async function runStep(
    step: MigrationStep,
    moduleApiName: string | null,
    index: number,
    entry: MigrationJournalEntry,
    emit: EmitMigrationEvent
): Promise<string | null> {
    if (step.kind === 'create-module') {
        const { id } = await createModuleRequest(step.module)

        // Recorded before the API name lookup, which can still fail, so the journal knows the module exists.
        entry.moduleId = id

        const apiName = step.module.api_name ?? (await findModuleApiName(id))

        emit({ type: 'module-created', id, api_name: apiName })

        return apiName
    }

    const targetModule = step.module ?? moduleApiName

    if (!targetModule) {
        throw new Error('The module to add the fields to is unknown.')
    }

    const results = await createFieldsRequest(targetModule, step.fields)
    let failedCount = 0

    for (const [position, result] of results.entries()) {
        const fieldLabel = step.fields[position]!.field_label

        emit({ type: 'field-result', index, field_label: fieldLabel, result })

        if (result.status === 'success') {
            entry.fieldIds[fieldLabel] = result.id
        } else {
            failedCount += 1
        }
    }

    if (failedCount > 0) {
        throw new Error(`${failedCount} of ${results.length} fields were not created.`)
    }

    return targetModule
}

/** Zoho answers a module creation with its id only, so a generated API name is looked up by it. */
async function findModuleApiName(moduleId: string): Promise<string> {
    const module = (await getModulesListRequest()).find((candidate) => candidate.id === moduleId)

    if (!module) {
        throw new Error(`Zoho CRM does not list the module it has just created (id ${moduleId}).`)
    }

    return module.api_name
}

async function verifyAndRefresh(
    projectPath: string,
    moduleApiName: string,
    prepared: PreparedMigration,
    emit: EmitMigrationEvent
): Promise<void> {
    const module = (await getModulesListRequest()).find((candidate) => candidate.api_name === moduleApiName)
    const fields = await getFieldsListRequest(moduleApiName)
    const existingLabels = new Set(fields.map((field) => field.field_label.toLowerCase()))
    const plannedLabels = prepared.description!.fields.map((field) => field.field_label)

    emit({
        type: 'verified',
        verification: {
            module: moduleApiName,
            created: plannedLabels.filter((label) => existingLabels.has(label.toLowerCase())),
            missing: plannedLabels.filter((label) => !existingLabels.has(label.toLowerCase())),
        },
    })

    if (module) {
        await saveModuleMetadata(projectPath, module)
    }

    await saveModuleFields(projectPath, moduleApiName, fields)
    emit({ type: 'artifacts-updated', module: moduleApiName })
}
