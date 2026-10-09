import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveWorkspaceSettingsPath } from '@/config'
import { addProfile, credentialsHomeEnvName, resolveProjectTokensPath } from '@/credentials'
import { login } from '@/shared/api/auth'

import {
    buildSettings,
    createTempProject,
    readStoredSettings,
    readStoredTokens as readConnection,
    removeTempProject,
} from '../../../support/temp-project'

let projectPath: string | null = null
let server: ReturnType<typeof Bun.serve> | null = null

afterEach(async () => {
    server?.stop(true)
    server = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const issuedTokens = {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
    api_domain: 'https://www.zohoapis.com',
    token_type: 'Bearer',
}

const deviceCodeAnswer = {
    device_code: 'device',
    user_code: 'USER-CODE',
    verification_url: 'https://accounts.zoho.com/oauth/v3/device',
    // Keeps the polling loop instant in tests; Zoho dictates 5000 in practice.
    interval: 1,
    expires_in: 300_000,
}

/** Answers the device code request, then the given poll answers in order. */
function startZoho(pollAnswers: unknown[] = [], deviceCode: unknown = deviceCodeAnswer): string {
    const answers = [...pollAnswers]

    server = Bun.serve({
        port: 0,
        fetch(request) {
            if (new URL(request.url).pathname.endsWith('/device/code')) {
                return Response.json(deviceCode)
            }

            return Response.json(answers.shift() ?? issuedTokens)
        },
    })

    return server.url.origin
}

async function startProject(
    pollAnswers: unknown[] = [],
    {
        auth = {},
        api = {},
        deviceCode = deviceCodeAnswer,
    }: Parameters<typeof buildSettings>[0] & {
        deviceCode?: unknown
    } = {}
): Promise<void> {
    const baseUrl = startZoho(pollAnswers, deviceCode)
    projectPath = await createTempProject(buildSettings({ auth: { baseUrl, ...auth }, api }))
}

async function readStoredTokens() {
    return (await readConnection(projectPath!))!
}

describe('login', () => {
    test('waits for approval, then stores the tokens owner-only', async () => {
        await startProject([{ error: 'authorization_pending' }, { error: 'slow_down' }, issuedTokens])

        const result = await login()

        const tokens = await readStoredTokens()
        expect(tokens.accessToken).toBe('access')
        expect(tokens.refreshToken).toBe('refresh')
        expect(tokens.accessTokenExpiresAt).toBe(result.accessTokenExpiresAt)
        expect(tokens.profile).toBe('test')
        expect((await stat(resolveProjectTokensPath(projectPath!))).mode & 0o777).toBe(0o600)
        expect((await stat(process.env[credentialsHomeEnvName]!)).mode & 0o777).toBe(0o700)
        expect(result.projectPath).toBe(projectPath!)
        expect(result.profile).toBe('test')
        expect(result.apiDomainMismatch).toBeNull()
    })

    test('reports the code to enter before waiting', async () => {
        await startProject()
        const verifications: unknown[] = []

        await login({ onVerificationRequired: (verification) => verifications.push(verification) })

        expect(verifications).toEqual([
            {
                verificationUrl: 'https://accounts.zoho.com/oauth/v3/device',
                userCode: 'USER-CODE',
                expiresInMs: 300_000,
            },
        ])
    })

    test('overwrites earlier tokens and keeps secrets out of settings.json', async () => {
        await startProject([], {
            auth: { tokens: { accessToken: 'old', refreshToken: 'old', accessTokenExpiresAt: 1 } },
        })

        await login()

        expect((await readStoredTokens()).accessToken).toBe('access')
        expect(await readStoredSettings(projectPath!)).not.toHaveProperty('auth.clientSecret')
        expect(await readStoredSettings(projectPath!)).not.toHaveProperty('auth.tokens')
    })

    test('logs in with the named profile when several exist', async () => {
        await startProject()
        await addProfile({ name: 'other', clientId: '1000.OTHER', clientSecret: 'other' })

        await expect(login()).rejects.toThrow(/Several profiles.*--profile/s)
        expect((await login({ profile: 'other' })).profile).toBe('other')
        expect((await readStoredTokens()).profile).toBe('other')
    })

    test('fails on an unknown profile', async () => {
        await startProject()

        await expect(login({ profile: 'missing' })).rejects.toThrow(/no profile named "missing"/)
    })

    test('keeps tokens of two projects with one profile apart', async () => {
        await startProject()
        await login()
        const firstPath = projectPath!
        const home = process.env[credentialsHomeEnvName]!

        const secondPath = await mkdtemp(join(tmpdir(), 'zoho-studio-'))
        await mkdir(join(secondPath, '.zoho-studio'))
        await Bun.write(
            resolveWorkspaceSettingsPath(secondPath),
            JSON.stringify({ auth: { baseUrl: server!.url.origin } })
        )
        process.chdir(secondPath)

        try {
            server!.reload({
                fetch: (request) =>
                    Response.json(
                        new URL(request.url).pathname.endsWith('/device/code')
                            ? deviceCodeAnswer
                            : { ...issuedTokens, access_token: 'second' }
                    ),
            })
            await login()

            expect((await readConnection(firstPath))?.accessToken).toBe('access')
            expect((await readConnection(secondPath))?.accessToken).toBe('second')
            expect(process.env[credentialsHomeEnvName]).toBe(home)
        } finally {
            process.chdir(firstPath)
            await rm(secondPath, { recursive: true, force: true })
        }
    })

    test('ignores legacy credentials in settings.json and warns about them', async () => {
        await startProject()
        const settingsPath = resolveWorkspaceSettingsPath(projectPath!)
        const settings = await Bun.file(settingsPath).json()
        await Bun.write(
            settingsPath,
            JSON.stringify({ ...settings, auth: { ...settings.auth, clientId: 'legacy', clientSecret: 'legacy' } })
        )
        const warnings: string[] = []
        const originalWarn = console.warn
        console.warn = (message: string) => warnings.push(message)

        try {
            await login()
        } finally {
            console.warn = originalWarn
        }

        expect(warnings.join('\n')).toMatch(/auth:migrate-legacy/)
        expect((await readStoredTokens()).profile).toBe('test')
    })

    test('works from a nested folder', async () => {
        await startProject()
        const nestedPath = join(projectPath!, 'a', 'b')
        await mkdir(nestedPath, { recursive: true })
        process.chdir(nestedPath)

        expect((await login()).projectPath).toBe(projectPath!)
    })

    test('reports a data center mismatch without failing', async () => {
        await startProject([], { api: { baseUrl: 'https://www.zohoapis.eu', version: 'v8' } })

        expect((await login()).apiDomainMismatch).toEqual({
            expected: 'https://www.zohoapis.eu',
            received: 'https://www.zohoapis.com',
        })
    })

    test('fails outside a project with a hint about init', async () => {
        const emptyPath = await mkdtemp(join(tmpdir(), 'zoho-studio-empty-'))
        const previousPath = process.cwd()
        process.chdir(emptyPath)

        try {
            await expect(login()).rejects.toThrow(/zoho-studio init/)
        } finally {
            process.chdir(previousPath)
            await rm(emptyPath, { recursive: true, force: true })
        }
    })

    test('fails without any profile before calling Zoho', async () => {
        await startProject([], { auth: { clientId: '', clientSecret: '' } })

        await expect(login()).rejects.toThrow(/no credential profile yet/)
    })

    test('fails on empty scopes without calling Zoho', async () => {
        await startProject([], { auth: { scopes: { crm: [], projects: [] } } })

        await expect(login()).rejects.toThrow(/auth.scopes is empty/)
    })

    test('asks for every scope on the default connection and only Projects ones on a separate login', async () => {
        await startProject([], { auth: { scopes: { crm: ['C'], projects: ['P'] } } })
        const requestedScopes: (string | null)[] = []
        server!.reload({
            fetch(request) {
                const url = new URL(request.url)

                if (url.pathname.endsWith('/device/code')) {
                    requestedScopes.push(url.searchParams.get('scope'))
                    return Response.json(deviceCodeAnswer)
                }

                return Response.json(issuedTokens)
            },
        })

        await login()
        expect((await login({ connection: 'projects' })).connection).toBe('projects')

        expect(requestedScopes).toEqual(['C,P', 'P'])
        expect((await readConnection(projectPath!, 'projects'))?.refreshToken).toBe('refresh')
        expect((await readStoredTokens()).refreshToken).toBe('refresh')
    })

    test('gives up when the device code expires before approval', async () => {
        await startProject([{ error: 'authorization_pending' }], {
            deviceCode: { ...deviceCodeAnswer, expires_in: 1 },
        })

        await expect(login()).rejects.toThrow(/expired before it was approved/)
    })

    test('leaves the stored tokens untouched when the user denies the request', async () => {
        await startProject([{ error: 'access_denied' }], {
            auth: { tokens: { accessToken: 'old', refreshToken: 'old', accessTokenExpiresAt: 1 } },
        })

        await expect(login()).rejects.toThrow(/access_denied/)

        expect((await readStoredTokens()).accessToken).toBe('old')
    })
})
