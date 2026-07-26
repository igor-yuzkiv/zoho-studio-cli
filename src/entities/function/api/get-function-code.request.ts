import { crmClient } from '@/shared/api/crm'

/** Returns the Deluge source of a function, addressed by its id or api name. */
export async function getFunctionCode(functionId: string): Promise<string> {
    const { data } = await crmClient.get<string>(`/settings/functions/${encodeURIComponent(functionId)}/code`, {
        responseType: 'text',
        // The endpoint answers plain Deluge, so axios must not parse or reshape the body.
        transformResponse: (body: unknown) => body,
    })

    return typeof data === 'string' ? data : String(data ?? '')
}
