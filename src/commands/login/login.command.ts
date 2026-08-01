import { Command } from 'commander'

import { printOrganization, pullOrganization } from '@/commands/org'

import { login } from './login.service'

export const loginCommand = new Command('login')
    .description('Authorize the project with Zoho and store the resulting tokens')
    .action(async () => {
        const result = await login({
            onVerificationRequired: ({ verificationUrl, userCode, expiresInMs }) => {
                console.log(`Open ${verificationUrl} in a browser and enter this code:`)
                console.log()
                console.log(`    ${userCode}`)
                console.log()
                console.log(`The code is valid for ${formatMinutes(expiresInMs)}. Waiting for approval...`)
            },
        })

        console.log()
        console.log('Authorized. Tokens stored in the project settings.')
        console.log(`  access token valid for ${formatMinutes(result.accessTokenExpiresAt - Date.now())}`)

        if (result.apiDomainMismatch) {
            console.log()
            console.log(
                `Warning: Zoho answered with api_domain ${result.apiDomainMismatch.received}, ` +
                    `but api.baseUrl is ${result.apiDomainMismatch.expected}. ` +
                    'API calls will fail unless api.baseUrl matches your data center.'
            )
        }

        console.log()
        await reportOrganization()

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
                'Run "zoho-studio org:info" once the cause is fixed.'
        )
    }
}

function formatMinutes(durationMs: number): string {
    return `${Math.max(0, Math.round(durationMs / 60_000))} min`
}
