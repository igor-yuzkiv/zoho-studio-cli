import { crmClient } from '../../../api'

import type { FunctionDeployMetadata } from '../function.types'
import { findRejectedFunction, toFunctionRequestError } from './function-request.error'
import { buildFunctionForm } from './function-request.utils'

type FunctionDefinition = Pick<FunctionDeployMetadata, 'name' | 'api_name' | 'description' | 'category' | 'runtime'>

interface CreateFunctionPayload {
    functions?: { details?: { id?: string } }[]
}

/** Creates a Deluge function and returns its id; Zoho publishes it as part of the same request. */
export async function createFunctionRequest(
    definition: FunctionDefinition,
    code: string,
    changelog: string
): Promise<{ id: string }> {
    const metadata = {
        functions: [
            {
                name: definition.name,
                api_name: definition.api_name,
                description: definition.description,
                category: definition.category,
                runtime: definition.runtime,
            },
        ],
        publish: { changelog },
    }

    let data: CreateFunctionPayload

    try {
        ;({ data } = await crmClient.post<CreateFunctionPayload>(
            '/settings/functions',
            buildFunctionForm(metadata, definition.api_name, code)
        ))
    } catch (error) {
        throw toFunctionRequestError(error)
    }

    const rejected = findRejectedFunction(data)

    if (rejected) {
        throw rejected
    }

    const id = data?.functions?.[0]?.details?.id

    if (!id) {
        throw new Error('Zoho CRM answered the function creation without the id of the new function.')
    }

    return { id }
}
