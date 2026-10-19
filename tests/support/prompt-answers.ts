import { mock } from 'bun:test'

type PromptName = 'select' | 'input' | 'confirm' | 'search'

const answers: { prompt: PromptName; value: unknown }[] = []
export const askedPrompts: { prompt: PromptName; message: string }[] = []

function answer(prompt: PromptName) {
    return async (config: { message: string; default?: unknown }) => {
        askedPrompts.push({ prompt, message: config.message })
        const next = answers.shift()

        if (!next || next.prompt !== prompt) {
            throw new Error(`Unexpected ${prompt} prompt "${config.message}"; next scripted answer: ${next?.prompt}`)
        }

        return next.value === useDefault ? config.default : next.value
    }
}

/** Stands for "the user pressed Enter": the prompt answers its default. */
export const useDefault = Symbol('default')

/**
 * Replaces @inquirer/prompts for the whole test run, so a command's questions are answered from a
 * script instead of a terminal. A command file must be imported after this module.
 */
await mock.module('@inquirer/prompts', () => ({
    select: answer('select'),
    input: answer('input'),
    confirm: answer('confirm'),
    search: answer('search'),
}))

/** Queues the answers, in the order the command will ask. */
export function scriptPrompts(...scripted: [PromptName, unknown][]): void {
    answers.splice(0, answers.length, ...scripted.map(([prompt, value]) => ({ prompt, value })))
    askedPrompts.length = 0
}

export function remainingPromptAnswers(): number {
    return answers.length
}
