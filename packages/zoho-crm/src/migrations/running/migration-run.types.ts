import type { FieldCreateResult } from '../../entities/field'

import type { MigrationStep } from '../planning'

export type MigrationRunStatus = 'applied' | 'failed' | 'blocked'

/** Planned fields compared by label with what Zoho holds after the run. */
export interface MigrationVerification {
    module: string
    created: string[]
    missing: string[]
}

/** What a run reports as it goes; the CLI prints these, and the web app will read the same stream. */
export type MigrationEvent =
    | { type: 'step-started'; index: number; step: MigrationStep }
    | { type: 'module-created'; id: string; api_name: string }
    | { type: 'field-result'; index: number; field_label: string; result: FieldCreateResult }
    | { type: 'step-finished'; index: number; status: 'success' | 'failed'; error?: string }
    | { type: 'verified'; verification: MigrationVerification }
    | { type: 'verification-failed'; error: string }
    | { type: 'artifacts-updated'; module: string }
    | { type: 'finished'; status: MigrationRunStatus; message: string }
