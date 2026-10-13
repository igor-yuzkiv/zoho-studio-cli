export interface MigrationJournalEntry {
    status: 'applied' | 'failed'
    ranAt: string
    error?: string
    moduleId?: string
    /** Ids of the created fields by label. */
    fieldIds: Record<string, string>
}

/** Journal entries of one organization by migration name. */
export type MigrationJournal = Record<string, MigrationJournalEntry>
