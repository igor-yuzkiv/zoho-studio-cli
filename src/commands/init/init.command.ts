import { Command } from 'commander'
import { relative, resolve } from 'node:path'

import { projectSettingsGitignoreEntry, projectSettingsFileName } from '@/config'
import { initializeProject } from '@/services/init'

export const initCommand = new Command('init')
    .description('Initialize a Zoho Studio project in the target folder')
    .argument('[name]', 'project folder, resolved against the current directory; defaults to the current directory')
    .option('--force', `reset ${projectSettingsFileName} to defaults, discarding stored credentials`, false)
    .action(async (name: string | undefined, options: { force: boolean }) => {
        const projectPath = resolve(process.cwd(), name ?? '.')
        const result = await initializeProject(projectPath, { force: options.force })

        const displayPath = relative(process.cwd(), projectPath) || '.'

        console.log(`Initialized Zoho Studio project in ${displayPath}`)
        console.log(`  ${projectSettingsGitignoreEntry} — created`)
        console.log(`  .gitignore — ${result.gitignoreOutcome}`)
        console.log()
        console.log('Next steps:')
        console.log(`  1. Add auth.clientId and auth.clientSecret to ${projectSettingsGitignoreEntry}`)
        console.log('  2. Run "zoho-studio login"')
    })
