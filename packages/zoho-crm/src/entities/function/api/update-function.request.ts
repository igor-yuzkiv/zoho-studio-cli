import { crmClient } from '../../../api'

import type { FunctionDeployMetadata } from '../function.types'
import { findRejectedFunction, toFunctionRequestError } from './function-request.error'
import { buildFunctionForm } from './function-request.utils'

/**
 * Replaces the code, name and description of a function and publishes it. The API name, category
 * and runtime are left out: Zoho refuses to change them.
 */
export async function updateFunctionRequest(
    id: string,
    definition: Pick<FunctionDeployMetadata, 'name' | 'api_name' | 'description'>,
    code: string,
    changelog: string
): Promise<void> {
    const metadata = {
        functions: [{ name: definition.name, description: definition.description }],
        publish: { changelog },
    }

    let data: unknown

    try {
        ;({ data } = await crmClient.put(
            `/settings/functions/${encodeURIComponent(id)}`,
            buildFunctionForm(metadata, definition.api_name, code)
        ))
    } catch (error) {
        throw toFunctionRequestError(error)
    }

    const rejected = findRejectedFunction(data)

    if (rejected) {
        throw rejected
    }
}
