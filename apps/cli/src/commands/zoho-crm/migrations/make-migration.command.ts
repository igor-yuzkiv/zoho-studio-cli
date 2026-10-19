import { Command } from 'commander'
import { relative } from 'node:path'

import { getProjectSettings } from '@zoho-studio/core'
import { scaffoldMigration } from '@zoho-studio/zoho-crm/migrations'
import { resolveLocalModuleNames } from '@zoho-studio/zoho-crm/module'

import { promptForMigrationMake } from './migration-make-prompt.service'

export const makeMigrationCommand = new Command('z-crm:migrations:make')
    .description('Create a migration file in migrations/zoho-crm/ through a few questions')
    .action(async () => {
        if (!process.stdin.isTTY) {
            throw new Error('z-crm:migrations:make asks questions, so it needs an interactive terminal.')
        }

        const { projectPath } = await getProjectSettings()
        const scaffold = await promptForMigrationMake({
            projectPath,
            localModuleNames: await resolveLocalModuleNames(projectPath).catch(() => []),
        })

        if (!scaffold) {
            console.log('Nothing created.')
            return
        }

        const migration = await scaffoldMigration(projectPath, scaffold)

        console.log(`Created ${relative(projectPath, migration.path)}`)
        console.log(`Declare the fields, then check it with "bun run migrate ${migration.name} --dry-run".`)
    })
