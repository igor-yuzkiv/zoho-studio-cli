import { login } from '@zoho-studio/auth'
import { pullOrganization } from '@zoho-studio/zoho-crm/organization'

import type { LoginRequest, LoginState } from './browser.types'

type StateListener = (state: LoginState) => void

export class LoginBusyError extends Error {
    constructor() {
        super('A login is already waiting for approval.')
    }
}

/** Runs the same device flow as `zoho-studio login`, reporting each step to the page instead of the terminal. */
export class LoginSession {
    private currentState: LoginState = { status: 'idle' }
    private readonly listeners = new Set<StateListener>()

    get state(): LoginState {
        return this.currentState
    }

    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener)

        return () => this.listeners.delete(listener)
    }

    start(request: LoginRequest): LoginState {
        if (this.currentState.status === 'starting' || this.currentState.status === 'waiting') {
            throw new LoginBusyError()
        }

        this.publish({ status: 'starting' })
        void this.run(request)

        return this.currentState
    }

    private async run({ profile, connection }: LoginRequest) {
        try {
            const result = await login({
                profile,
                connection,
                onVerificationRequired: ({ verificationUrl, userCode, expiresInMs }) =>
                    this.publish({
                        status: 'waiting',
                        verificationUrl,
                        userCode,
                        expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
                    }),
            })

            const warning = result.apiDomainMismatch
                ? `Zoho answered with api_domain ${result.apiDomainMismatch.received}, but api.baseUrl is ` +
                  `${result.apiDomainMismatch.expected}. API calls will fail unless api.baseUrl matches your data center.`
                : null

            // The organization belongs to the CRM side, which the default connection serves.
            const organizationError = connection === 'default' ? await refreshOrganization() : null

            this.publish({ status: 'done', profile: result.profile, connection, warning, organizationError })
        } catch (error) {
            this.publish({ status: 'failed', message: error instanceof Error ? error.message : String(error) })
        }
    }

    private publish(state: LoginState) {
        this.currentState = state

        for (const listener of this.listeners) {
            listener(state)
        }
    }
}

/** The tokens are already stored, so a failing org pull is reported rather than raised, as the CLI does. */
async function refreshOrganization(): Promise<string | null> {
    try {
        await pullOrganization()

        return null
    } catch (error) {
        return error instanceof Error ? error.message : String(error)
    }
}
