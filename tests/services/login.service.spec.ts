import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveProjectSettingsPath } from '@/config'
import { login } from '@/services/login'
import { clearProjectCache, defaultProjectSettings, type ProjectSettings } from '@/settings'

let projectPath: string
let server: ReturnType<typeof Bun.serve> | null = null

beforeEach(async () => {
    clearProjectCache()
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-login-'))
})

afterEach(async () => {
    server?.stop(true)
    server = null
    await rm(projectPath, { recursive: true, force: true })
})

const issuedTokens = {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
    api_domain: 'https://www.zohoapis.com',
    token_type: 'Bearer',
}

/** Answers the device code request, then the given poll answers in order. */
function startZoho(pollAnswers: unknown[], deviceCodeAnswer: unknown = null): string {
    const answers = [...pollAnswers]

    server = Bun.serve({
        port: 0,
        fetch(request) {
            if (new URL(request.url).pathname.endsWith('/device/code')) {
                return Response.json(
                    deviceCodeAnswer ?? {
                        device_code: 'device',
                        user_code: 'USER-CODE',
                        verification_url: 'https://accounts.zoho.com/oauth/v3/device',
                        // Keeps the polling loop instant in tests; Zoho dictates 5000 in practice.
                        interval: 1,
                        expires_in: 300_000,
                    }
                )
            }

            return Response.json(answers.shift() ?? issuedTokens)
        },
    })

    return server.url.origin
}

async function writeSettings(overrides: Partial<ProjectSettings['auth']>, api = defaultProjectSettings.api) {
    const settings: ProjectSettings = {
        ...defaultProjectSettings,
        auth: { ...defaultProjectSettings.auth, clientId: '1000.CLIENT', clientSecret: 'secret', ...overrides },
        api,
    }

    await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify(settings))
}

function readSettings(): Promise<ProjectSettings> {
    return Bun.file(resolveProjectSettingsPath(projectPath)).json()
}

describe('login', () => {
    test('waits for approval, then stores the tokens owner-only', async () => {
        const baseUrl = startZoho([{ error: 'authorization_pending' }, { error: 'slow_down' }, issuedTokens])
        await writeSettings({ baseUrl })

        const result = await login({ startPath: projectPath })

        const tokens = (await readSettings()).auth.tokens
        expect(tokens.accessToken).toBe('access')
        expect(tokens.refreshToken).toBe('refresh')
        expect(tokens.accessTokenExpiresAt).toBe(result.accessTokenExpiresAt)
        expect((await stat(resolveProjectSettingsPath(projectPath))).mode & 0o777).toBe(0o600)
        expect(result.projectPath).toBe(projectPath)
        expect(result.apiDomainMismatch).toBeNull()
    })

    test('reports the code to enter before waiting', async () => {
        const baseUrl = startZoho([])
        await writeSettings({ baseUrl })
        const verifications: unknown[] = []

        await login({ startPath: projectPath, onVerificationRequired: (v) => verifications.push(v) })

        expect(verifications).toEqual([
            {
                verificationUrl: 'https://accounts.zoho.com/oauth/v3/device',
                userCode: 'USER-CODE',
                expiresInMs: 300_000,
            },
        ])
    })

    test('preserves the credentials and overwrites earlier tokens', async () => {
        const baseUrl = startZoho([])
        await writeSettings({
            baseUrl,
            tokens: { accessToken: 'old', refreshToken: 'old', accessTokenExpiresAt: 1 },
        })

        await login({ startPath: projectPath })

        const settings = await readSettings()
        expect(settings.auth.clientSecret).toBe('secret')
        expect(settings.auth.tokens.accessToken).toBe('access')
    })

    test('works from a nested folder', async () => {
        const baseUrl = startZoho([])
        await writeSettings({ baseUrl })
        const nestedPath = join(projectPath, 'a', 'b')
        await mkdir(nestedPath, { recursive: true })

        expect((await login({ startPath: nestedPath })).projectPath).toBe(projectPath)
    })

    test('reports a data center mismatch without failing', async () => {
        const baseUrl = startZoho([])
        await writeSettings({ baseUrl }, { baseUrl: 'https://www.zohoapis.eu', version: 'v8' })

        const result = await login({ startPath: projectPath })

        expect(result.apiDomainMismatch).toEqual({
            expected: 'https://www.zohoapis.eu',
            received: 'https://www.zohoapis.com',
        })
    })

    test('fails outside a project with a hint about init', async () => {
        await expect(login({ startPath: projectPath })).rejects.toThrow(/zoho-studio init/)
    })

    test('fails on empty credentials without calling Zoho', async () => {
        await writeSettings({ clientId: '', clientSecret: '' })

        await expect(login({ startPath: projectPath })).rejects.toThrow(/auth.clientId and auth.clientSecret/)
    })

    test('fails on empty scopes without calling Zoho', async () => {
        await writeSettings({ scopes: [] })

        await expect(login({ startPath: projectPath })).rejects.toThrow(/auth.scopes is empty/)
    })

    test('gives up when the device code expires before approval', async () => {
        const baseUrl = startZoho([{ error: 'authorization_pending' }], {
            device_code: 'device',
            user_code: 'USER-CODE',
            verification_url: 'https://accounts.zoho.com/oauth/v3/device',
            interval: 1,
            expires_in: 1,
        })
        await writeSettings({ baseUrl })

        await expect(login({ startPath: projectPath })).rejects.toThrow(/expired before it was approved/)
    })

    test('leaves the stored tokens untouched when the user denies the request', async () => {
        const baseUrl = startZoho([{ error: 'access_denied' }])
        await writeSettings({ baseUrl, tokens: { accessToken: 'old', refreshToken: 'old', accessTokenExpiresAt: 1 } })

        await expect(login({ startPath: projectPath })).rejects.toThrow(/access_denied/)

        expect((await readSettings()).auth.tokens.accessToken).toBe('old')
    })
})
