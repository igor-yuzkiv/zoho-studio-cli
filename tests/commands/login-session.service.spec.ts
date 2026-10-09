import { afterEach, describe, expect, test } from 'bun:test'

import type { LoginState } from '@/commands/browser/browser.types'
import { LoginBusyError, LoginSession } from '@/commands/browser/login-session.service'

import { buildSettings, createTempProject, readStoredTokens, removeTempProject } from '../support/temp-project'

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

const deviceCodeAnswer = {
    device_code: 'device',
    user_code: 'USER-CODE',
    verification_url: 'https://accounts.zoho.com/oauth/v3/device',
    interval: 1,
    expires_in: 300_000,
}

const issuedTokens = {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'Bearer',
}

/** One stub plays both the accounts host and the CRM host; the org request gets a minimal organization. */
async function startProject(pollAnswers: unknown[], deviceCode: unknown = deviceCodeAnswer) {
    const answers = [...pollAnswers]

    server = Bun.serve({
        port: 0,
        fetch(request) {
            const { pathname } = new URL(request.url)

            if (pathname.endsWith('/device/code')) {
                return Response.json(deviceCode)
            }

            if (pathname.endsWith('/org')) {
                return Response.json({ org: [{ id: '1', company_name: 'Acme' }] })
            }

            return Response.json(answers.shift() ?? issuedTokens)
        },
    })

    const origin = server.url.origin
    projectPath = await createTempProject(
        buildSettings({ auth: { baseUrl: origin }, api: { baseUrl: origin, version: 'v8' } })
    )
}

function collectStates(session: LoginSession): LoginState[] {
    const states: LoginState[] = []
    session.subscribe((state) => states.push(state))

    return states
}

async function waitForSettled(session: LoginSession) {
    for (let attempt = 0; attempt < 100 && !['done', 'failed'].includes(session.state.status); attempt++) {
        await Bun.sleep(20)
    }
}

describe('LoginSession', () => {
    test('shows the code to approve, then stores the tokens', async () => {
        await startProject([{ error: 'authorization_pending' }, issuedTokens])
        const session = new LoginSession()
        const states = collectStates(session)

        session.start({ profile: 'test', connection: 'default' })
        await waitForSettled(session)

        expect(states.map(({ status }) => status)).toEqual(['starting', 'waiting', 'done'])
        expect(states[1]).toMatchObject({ userCode: 'USER-CODE', verificationUrl: deviceCodeAnswer.verification_url })
        expect((await readStoredTokens(projectPath!))?.refreshToken).toBe('refresh')
    })

    test('logs in the Projects connection with the chosen profile', async () => {
        await startProject([issuedTokens])
        const session = new LoginSession()

        session.start({ profile: 'test', connection: 'projects' })
        await waitForSettled(session)

        expect(session.state).toMatchObject({
            status: 'done',
            profile: 'test',
            connection: 'projects',
            organizationError: null,
        })
        expect((await readStoredTokens(projectPath!, 'projects'))?.refreshToken).toBe('refresh')
    })

    test('reports a rejected login with the reason', async () => {
        await startProject([{ error: 'access_denied' }])
        const session = new LoginSession()

        session.start({ profile: 'test', connection: 'default' })
        await waitForSettled(session)

        expect(session.state).toMatchObject({ status: 'failed' })
        expect(session.state.status === 'failed' && session.state.message).toContain('access_denied')
    })

    test('refuses a second login while one waits for approval', async () => {
        await startProject(Array(50).fill({ error: 'authorization_pending' }))
        const session = new LoginSession()

        session.start({ profile: 'test', connection: 'default' })
        for (let attempt = 0; attempt < 50 && session.state.status !== 'waiting'; attempt++) {
            await Bun.sleep(10)
        }

        expect(() => session.start({ profile: 'test', connection: 'default' })).toThrow(LoginBusyError)
    })
})
