import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveWorkspaceSettingsDirPath, writeJsonFile } from '@zoho-studio/core'

import type { MigrationJournal, MigrationJournalEntry } from './migration.types'

/** One project may point at a sandbox and production in turn, so runs are kept per organization. */
type JournalFile = Record<string, MigrationJournal>

const journalFileName = 'migrations.json'

function resolveJournalPath(projectPath: string): string {
    return join(resolveWorkspaceSettingsDirPath(projectPath), journalFileName)
}

async function readJournalFile(projectPath: string): Promise<JournalFile> {
    const content = await readFile(resolveJournalPath(projectPath), 'utf8').catch(() => null)

    return content ? (JSON.parse(content) as JournalFile) : {}
}

export async function readMigrationJournal(projectPath: string, organizationId: string): Promise<MigrationJournal> {
    return (await readJournalFile(projectPath))[organizationId] ?? {}
}

export async function saveMigrationJournalEntry(
    projectPath: string,
    organizationId: string,
    name: string,
    entry: MigrationJournalEntry
): Promise<void> {
    const journal = await readJournalFile(projectPath)

    journal[organizationId] = { ...journal[organizationId], [name]: entry }

    await writeJsonFile(resolveJournalPath(projectPath), journal)
}
