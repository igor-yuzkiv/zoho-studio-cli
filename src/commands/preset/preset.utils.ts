/**
 * Splits a preset entry into arguments the way a shell would for the simple cases a preset needs:
 * whitespace separates arguments, and single or double quotes keep a value with spaces together.
 */
export function splitPresetEntry(entry: string): string[] {
    const args: string[] = []
    const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g

    for (const match of entry.matchAll(pattern)) {
        args.push(match[1] ?? match[2] ?? match[3] ?? '')
    }

    return args
}
