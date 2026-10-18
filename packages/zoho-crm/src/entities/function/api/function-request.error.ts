import { AxiosError } from 'axios'

export interface FunctionCompilationError {
    line: number
    index: number
    message: string
}

interface FunctionRejection {
    code?: string
    message?: string
    details?: { errors?: FunctionCompilationError[] }
}

interface FunctionRejectionPayload extends FunctionRejection {
    functions?: FunctionRejection[]
}

/** A create or update Zoho refused, with its code so a caller can react to one reason in particular. */
export class FunctionRequestError extends Error {
    constructor(
        readonly code: string,
        message: string,
        readonly compilationErrors: FunctionCompilationError[],
        options?: ErrorOptions
    ) {
        super(message, options)
        this.name = 'FunctionRequestError'
    }
}

/**
 * Zoho reports a rejected field inside the `functions` list, but a compilation error or an unknown
 * function at the top level — see zoho-findings/functions.md.
 */
export function toFunctionRequestError(error: unknown): unknown {
    const payload =
        error instanceof AxiosError ? (error.response?.data as FunctionRejectionPayload | undefined) : undefined

    return describeFunctionRejection(payload?.functions?.[0] ?? payload, error) ?? error
}

/** A success status can still carry a rejected function, as Zoho's partial-success answers do. */
export function findRejectedFunction(payload: unknown): FunctionRequestError | null {
    const outcome = (payload as FunctionRejectionPayload | undefined)?.functions?.[0] as
        (FunctionRejection & { status?: string }) | undefined

    return outcome?.status === 'error' ? describeFunctionRejection(outcome) : null
}

function describeFunctionRejection(
    rejection: FunctionRejection | undefined,
    cause?: unknown
): FunctionRequestError | null {
    if (!rejection?.code) {
        return null
    }

    const compilationErrors = rejection.details?.errors ?? []
    const lines = compilationErrors.map((entry) => `\n  line ${entry.line}, position ${entry.index}: ${entry.message}`)
    const message = rejection.message ?? rejection.code

    return new FunctionRequestError(
        rejection.code,
        `${message} (${rejection.code})${lines.join('')}`,
        compilationErrors,
        {
            cause,
        }
    )
}
