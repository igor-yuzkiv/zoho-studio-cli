import { input } from '@inquirer/prompts'
import { Command } from 'commander'

import { listProfiles } from '@/credentials'

import { migrateLegacyAuth } from './migrate-legacy.service'

export const authMigrateLegacyCommand = new Command('auth:migrate-legacy')
    .description('Move the client and tokens from an older settings.json into ~/.zoho-studio')
    .option('--profile <name>', 'the name of the profile to create, instead of being asked')
    .action(async (options: { profile?: string }) => {
        const result = await migrateLegacyAuth({
            chooseProfileName: async (suggestion) => options.profile?.trim() || askProfileName(suggestion),
        })

        if (result.status === 'nothing-to-migrate') {
            console.log('Nothing to migrate: settings.json holds no client or tokens.')
            return
        }

        console.log(
            result.profileCreated
                ? `Created the "${result.profile}" profile from the client in settings.json.`
                : `The client in settings.json is already the "${result.profile}" profile.`
        )
        if (result.tokensMoved) {
            console.log('Moved the tokens to ~/.zoho-studio.')
        } else if (result.connectionProfile) {
            console.log(
                `Kept the tokens already stored in ~/.zoho-studio; the project stays on the "${result.connectionProfile}" profile.`
            )
        } else {
            console.log('settings.json held no refresh token — run "zoho-studio login" to authorize the project.')
        }
        console.log('Removed auth.clientId, auth.clientSecret and auth.tokens from settings.json.')
    })

async function askProfileName(suggestion: string): Promise<string> {
    if (!process.stdin.isTTY) {
        return suggestion
    }

    const takenNames = new Set((await listProfiles()).map((profile) => profile.name))
    const name = await input({
        message: 'Name of the new profile',
        default: takenNames.has(suggestion) ? undefined : suggestion,
        validate: (value) => {
            if (!value.trim()) {
                return 'Enter a name.'
            }

            return takenNames.has(value.trim()) ? `A profile named "${value.trim()}" already exists.` : true
        },
    })

    return name.trim()
}
