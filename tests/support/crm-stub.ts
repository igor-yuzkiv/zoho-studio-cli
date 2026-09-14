import { type ApiStub, startApiStub } from './api-stub'

export type CrmStub = ApiStub

/** A project whose CRM host is a local stub — see `startApiStub`. */
export function startCrmStub(answer: (request: Request) => Response): Promise<CrmStub> {
    return startApiStub(answer, (origin) => ({ api: { baseUrl: origin, version: 'v8' } }))
}
