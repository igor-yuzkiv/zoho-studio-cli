/**
 * Zoho answers INVALID_REQUEST when the metadata comes as a file part, so it goes as a text field —
 * see zoho-findings/functions.md.
 */
export function buildFunctionForm(metadata: unknown, apiName: string, code: string): FormData {
    const form = new FormData()
    form.append('metadata', JSON.stringify(metadata))
    form.append('code', new Blob([code]), `${apiName}.ds`)

    return form
}
