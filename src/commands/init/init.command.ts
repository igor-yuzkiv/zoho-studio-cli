import { Command } from 'commander'
import { relative, resolve } from 'node:path'

import { projectSettingsFileName, projectSettingsRelativePath } from '@/config'
import { initializeProject } from './init.service'

export const initCommand = new Command('init')
    .description('Scaffold a Zoho Studio project in the target folder')
    .argument('[name]', 'project folder, resolved against the current directory; defaults to the current directory')
    .option('--force', `reset ${projectSettingsFileName} to defaults, discarding stored credentials`, false)
    .action(async (name: string | undefined, options: { force: boolean }) => {
        const projectPath = resolve(process.cwd(), name ?? '.')
        const result = await initializeProject(projectPath, { force: options.force })

        const displayPath = relative(process.cwd(), projectPath) || '.'

        console.log(`Initialized Zoho Studio project in ${displayPath}`)
        console.log(`  ${projectSettingsRelativePath} — created`)

        for (const templateFile of result.templateFiles) {
            console.log(`  ${templateFile.path} — ${templateFile.outcome}`)
        }

        console.log()
        console.log('Next steps:')
        console.log(`  1. Add auth.clientId and auth.clientSecret to ${projectSettingsRelativePath}`)
        console.log('  2. Run "zoho-studio login"')
    })
