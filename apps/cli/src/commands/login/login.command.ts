import { Command, Option } from 'commander'

import type { ConnectionName } from '@zoho-studio/core'

import { printOrganization, pullOrganization } from '@zoho-studio/zoho-crm/organization'

import { login } from '@zoho-studio/auth'

import { promptForProfile } from './profile-prompt.service'

export const loginCommand = new Command('login')
    .description('Authorize the project with Zoho and store the resulting tokens')
    .option('--profile <name>', 'the credential profile to log in with, instead of choosing from a list')
    .addOption(
        new Option('--connection <name>', 'log in the default connection, or a separate one for Zoho Projects')
            .choices(['default', 'projects'])
            .default('default')
    )
    .action(async (options: { profile?: string; connection: ConnectionName }) => {
        // Without a terminal to ask in, login() still accepts the only stored profile.
        const profile = options.profile ?? (process.stdin.isTTY ? await promptForProfile() : undefined)

        const result = await login({
            profile,
            connection: options.connection,
            onVerificationRequired: ({ verificationUrl, userCode, expiresInMs }) => {
                console.log(`Open ${verificationUrl} in a browser and enter this code:`)
                console.log()
                console.log(`    ${userCode}`)
                console.log()
                console.log(`The code is valid for ${formatMinutes(expiresInMs)}. Waiting for approval...`)
            },
        })

        console.log()
        console.log(
            `Authorized with the "${result.profile}" profile. Tokens of the ${result.connection} connection stored in ~/.zoho-studio.`
        )
        console.log(`  access token valid for ${formatMinutes(result.accessTokenExpiresAt - Date.now())}`)

        if (result.apiDomainMismatch) {
            console.log()
            console.log(
                `Warning: Zoho answered with api_domain ${result.apiDomainMismatch.received}, ` +
                    `but api.baseUrl is ${result.apiDomainMismatch.expected}. ` +
                    'API calls will fail unless api.baseUrl matches your data center.'
            )
        }

        // The organization belongs to the CRM side, which the default connection serves.
        if (result.connection === 'default') {
            console.log()
            await reportOrganization()
        }

        console.log()
        console.log('The project is authorized.')
    })

/** The tokens are already stored, so a failing org pull is reported rather than raised. */
async function reportOrganization(): Promise<void> {
    try {
        printOrganization(await pullOrganization())
    } catch (error) {
        console.log(
            `Could not read the organization: ${error instanceof Error ? error.message : String(error)}. ` +
                'Run "zoho-studio z-crm:org:info" once the cause is fixed.'
        )
    }
}

function formatMinutes(durationMs: number): string {
    return `${Math.max(0, Math.round(durationMs / 60_000))} min`
}
