export interface CommandSummary {
    name: string
    summary: string
}

/** Keys are text paths without `.md`: `overview`, `z-crm`, `z-crm/functions`, `z-crm/functions/pull`. */
export type InstructionTexts = Record<string, string>

export const overviewTextKey = 'overview'

const nameSeparator = ':'
const maxSuggestions = 5
const maxSuggestionDistance = 3

export function instructionTextKey(name: string): string {
    return name.split(nameSeparator).join('/')
}

/** Every prefix that groups commands: `z-crm`, `z-crm:functions`, but not a command itself. */
export function listNamespaces(commands: CommandSummary[]): string[] {
    const commandNames = new Set(commands.map((command) => command.name))
    const namespaces = new Set<string>()

    for (const { name } of commands) {
        const segments = name.split(nameSeparator)

        for (let length = 1; length < segments.length; length++) {
            const prefix = segments.slice(0, length).join(nameSeparator)

            if (!commandNames.has(prefix)) {
                namespaces.add(prefix)
            }
        }
    }

    return [...namespaces].sort()
}

export function renderInstructions(
    name: string | undefined,
    commands: CommandSummary[],
    texts: InstructionTexts
): string {
    if (!name) {
        return joinSections(texts[overviewTextKey] ?? '', renderCommandList(commands))
    }

    const command = commands.find((candidate) => candidate.name === name)

    if (command) {
        const text = texts[instructionTextKey(name)]

        if (text === undefined) {
            throw new Error(`There are no instructions for "${name}" yet; see "zoho-studio ${name} --help".`)
        }

        return joinSections(text, renderOptionsHint(name))
    }

    const commandsInNamespace = commands.filter((candidate) => candidate.name.startsWith(name + nameSeparator))

    if (commandsInNamespace.length > 0) {
        const text = texts[instructionTextKey(name)] ?? `# ${name}`

        return joinSections(text, renderCommandList(commandsInNamespace))
    }

    throw new Error(renderUnknownName(name, commands))
}

function renderCommandList(commands: CommandSummary[]): string {
    const lines = commands.map((command) => `- \`${command.name}\` — ${command.summary}`)

    return [
        '## Commands',
        '',
        ...lines,
        '',
        'Run `zoho-studio instructions <command>` for one of them, `zoho-studio <command> --help` for its options.',
    ].join('\n')
}

function renderOptionsHint(name: string): string {
    return `Options: \`zoho-studio ${name} --help\`.`
}

function renderUnknownName(name: string, commands: CommandSummary[]): string {
    const candidates = [...commands.map((command) => command.name), ...listNamespaces(commands)]
    const suggestions = candidates
        .map((candidate) => ({ candidate, distance: suggestionDistance(name, candidate) }))
        .filter(({ distance }) => distance <= maxSuggestionDistance)
        .sort((left, right) => left.distance - right.distance || left.candidate.localeCompare(right.candidate))
        .slice(0, maxSuggestions)
        .map(({ candidate }) => candidate)

    const hint =
        suggestions.length > 0
            ? `Did you mean: ${suggestions.join(', ')}?`
            : 'Run "zoho-studio instructions" for the list of commands.'

    return `There is no command or group named "${name}". ${hint}`
}

/** A name that is part of a candidate (`functions` in `z-crm:functions`) counts as a close match. */
function suggestionDistance(name: string, candidate: string): number {
    if (candidate.includes(name)) {
        return 0
    }

    return levenshteinDistance(name, candidate)
}

function levenshteinDistance(left: string, right: string): number {
    let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index)

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
        const currentRow = [leftIndex]

        for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
            const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1

            currentRow.push(
                Math.min(
                    previousRow[rightIndex]! + 1,
                    currentRow[rightIndex - 1]! + 1,
                    previousRow[rightIndex - 1]! + substitutionCost
                )
            )
        }

        previousRow = currentRow
    }

    return previousRow[right.length]!
}

function joinSections(...sections: string[]): string {
    return sections
        .map((section) => section.trim())
        .filter((section) => section.length > 0)
        .join('\n\n')
}
