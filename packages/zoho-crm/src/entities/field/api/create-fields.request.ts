import { AxiosError } from 'axios'

import { crmClient, describeRequestError } from '../../../api'

import type { FieldCreateResult, ZohoFieldCreate } from '../field.types'

export const maxFieldsPerCreateRequest = 25

interface FieldCreateOutcome {
    code?: string
    message?: string
    details?: { id?: string }
}

interface CreateFieldsPayload {
    fields?: FieldCreateOutcome[]
}

/**
 * Creates fields in a module and returns one result per field, in request order. Zoho accepts or
 * rejects each field on its own — 201 when all pass, 207 when some do, 400 with a `fields` list when
 * none do — so only a rejection of the request itself, such as an unknown module, is thrown.
 */
export async function createFields(moduleApiName: string, fields: ZohoFieldCreate[]): Promise<FieldCreateResult[]> {
    if (fields.length > maxFieldsPerCreateRequest) {
        throw new Error(`Zoho CRM creates at most ${maxFieldsPerCreateRequest} fields per request, got ${fields.length}.`)
    }

    let outcomes: FieldCreateOutcome[] | undefined

    try {
        const { data } = await crmClient.post<CreateFieldsPayload>('/settings/fields', { fields }, {
            params: { module: moduleApiName },
        })
        outcomes = data?.fields
    } catch (error) {
        outcomes = error instanceof AxiosError ? (error.response?.data as CreateFieldsPayload)?.fields : undefined

        if (!outcomes) {
            throw new Error(describeRequestError(error), { cause: error })
        }
    }

    return fields.map((_, index) => toFieldCreateResult(outcomes?.[index]))
}

function toFieldCreateResult(outcome: FieldCreateOutcome | undefined): FieldCreateResult {
    if (outcome?.code === 'SUCCESS' && outcome.details?.id) {
        return { status: 'success', id: outcome.details.id }
    }

    return {
        status: 'error',
        code: outcome?.code ?? 'NO_ANSWER',
        message: outcome?.message ?? 'Zoho CRM returned no result for this field.',
    }
}
