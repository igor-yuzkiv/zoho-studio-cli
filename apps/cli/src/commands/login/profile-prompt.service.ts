import { input, password, select } from '@inquirer/prompts'

import { addProfile, listProfiles } from '@zoho-studio/core'

const createProfileChoice = Symbol('create')

/** Lets the user pick a stored profile or describe a new client, and returns the profile name. */
export async function promptForProfile(): Promise<string> {
    const profiles = await listProfiles()

    const choice = await select<string | typeof createProfileChoice>({
        message: 'Credential profile',
        choices: [
            ...profiles.map((profile) => ({ name: profile.name, value: profile.name, description: profile.clientId })),
            { name: 'Create a new profile', value: createProfileChoice },
        ],
    })

    if (choice !== createProfileChoice) {
        return choice
    }

    const takenNames = new Set(profiles.map((profile) => profile.name))
    const name = await input({
        message: 'Profile name',
        validate: (value) => {
            if (!value.trim()) {
                return 'Enter a name.'
            }

            return takenNames.has(value.trim()) ? `A profile named "${value.trim()}" already exists.` : true
        },
    })
    const clientId = await input({
        message: 'Client ID',
        validate: (value) => Boolean(value.trim()) || 'Enter the client id.',
    })
    const clientSecret = await password({
        message: 'Client Secret',
        mask: true,
        validate: (value) => Boolean(value.trim()) || 'Enter the client secret.',
    })

    await addProfile({ name: name.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim() })

    return name.trim()
}
