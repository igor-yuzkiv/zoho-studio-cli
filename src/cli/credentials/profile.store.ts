import { resolveProfilesPath } from './credentials.config'
import type { CredentialProfile } from './credentials.types'
import { readJsonOrNull, writeSecretJson } from './secret-file.utils'

export async function listProfiles(): Promise<CredentialProfile[]> {
    return (await readJsonOrNull<CredentialProfile[]>(resolveProfilesPath())) ?? []
}

export async function findProfile(name: string): Promise<CredentialProfile | null> {
    return (await listProfiles()).find((profile) => profile.name === name) ?? null
}

export async function addProfile(profile: CredentialProfile): Promise<void> {
    const name = profile.name.trim()

    if (!name || !profile.clientId || !profile.clientSecret) {
        throw new Error('A profile needs a name, a client id, and a client secret.')
    }

    const profiles = await listProfiles()

    if (profiles.some((existing) => existing.name === name)) {
        throw new Error(`A profile named "${name}" already exists.`)
    }

    await writeSecretJson(resolveProfilesPath(), [...profiles, { ...profile, name }])
}
