import type { JsonBundle } from '@cli/commands/browser/browser.types'

export type BundleEntry<TValue> = {
    /** Relative to the project's `src/`. */
    path: string
    directory: string
    fileName: string
    value: TValue
}

export function bundleEntries<TValue>(bundle: JsonBundle | null, suffix = '.json'): BundleEntry<TValue>[] {
    return Object.entries(bundle ?? {})
        .filter(([path, value]) => path.endsWith(suffix) && value !== null)
        .map(([path, value]) => {
            const slashIndex = path.lastIndexOf('/')

            return {
                path,
                directory: path.slice(0, slashIndex),
                fileName: path.slice(slashIndex + 1),
                value: value as TValue,
            }
        })
}

export function joinAbsolutePath(sourcePath: string | undefined, relativePath: string): string {
    return sourcePath ? `${sourcePath}/${relativePath}` : relativePath
}

export function matchesFilter(filter: string, ...values: (string | null | undefined)[]): boolean {
    const needle = filter.trim().toLowerCase()

    return !needle || values.some((value) => value?.toLowerCase().includes(needle))
}

export function formatDate(isoTime: string | null | undefined): string {
    return isoTime
        ? new Date(isoTime).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'
}
