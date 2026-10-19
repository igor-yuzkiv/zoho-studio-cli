import { crmClient } from '../../../api'

import type { FunctionRunResult } from '../function.types'
import { toFunctionRequestError } from './function-request.error'

/**
 * Runs code as the given function without saving it, as the Run button of Zoho's Deluge editor
 * does. Zoho documents neither the endpoint nor its answer — see zoho-findings/functions.md.
 */
export async function runFunctionRequest(
    apiName: string,
    code: string,
    args: Record<string, string>
): Promise<FunctionRunResult> {
    try {
        const { data } = await crmClient.post<FunctionRunResult>(
            `/settings/functions/${encodeURIComponent(apiName)}/actions/test`,
            { functions: [{ script: code, arguments: args }] }
        )

        return data
    } catch (error) {
        throw toFunctionRequestError(error)
    }
}
