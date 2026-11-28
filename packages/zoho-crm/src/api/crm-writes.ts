/**
 * Requests that change nothing in the organization: everything sent with GET, and the POST endpoints
 * listed here, which only read.
 */
const readOnlyPostPaths = new Set(['/coql'])

let writesAllowed = false

/**
 * A project script reads by default: the CRM client refuses any request that can change the
 * organization until the script calls this. The CLI calls it for its own commands.
 */
export function allowCrmWrites(): void {
    writesAllowed = true
}

export function disallowCrmWrites(): void {
    writesAllowed = false
}

export class CrmWritesDisabledError extends Error {
    readonly code = 'CRM_WRITES_DISABLED'

    constructor(method: string, path: string) {
        super(
            `${method} ${path} can change the organization, and writes are disabled. ` +
                'A script that is meant to write calls allowCrmWrites() from @zoho-studio/zoho-crm first.'
        )
        this.name = 'CrmWritesDisabledError'
    }
}

export function assertCrmRequestAllowed(method: string | undefined, path: string | undefined): void {
    const verb = (method ?? 'get').toUpperCase()
    const [pathname = ''] = (path ?? '').split('?')

    if (writesAllowed || verb === 'GET' || verb === 'HEAD' || (verb === 'POST' && readOnlyPostPaths.has(pathname))) {
        return
    }

    throw new CrmWritesDisabledError(verb, pathname)
}
