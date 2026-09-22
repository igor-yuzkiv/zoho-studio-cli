export interface Period {
    from?: Date
    to?: Date
}

const dateOptionPattern = /^\d{4}-\d{2}-\d{2}$/

/** Turns the `--from`/`--to` options into an inclusive UTC period: the start of `from` to the end of `to`. */
export function parsePeriod(options: { from?: string; to?: string }): Period {
    const from = options.from === undefined ? undefined : parseDateOption('--from', options.from)
    const to = options.to === undefined ? undefined : parseDateOption('--to', options.to)

    if (to) {
        to.setUTCHours(23, 59, 59, 999)
    }

    if (from && to && from > to) {
        throw new Error(`--from (${options.from}) is later than --to (${options.to}).`)
    }

    return { from, to }
}

function parseDateOption(option: string, value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`)

    if (!dateOptionPattern.test(value) || Number.isNaN(date.getTime())) {
        throw new Error(`${option} must be a date as YYYY-MM-DD, got "${value}".`)
    }

    return date
}

/** An ISO time is in the period; a missing or unreadable one only passes an open period. */
export function isInPeriod(time: string | undefined, period: Period): boolean {
    if (!period.from && !period.to) {
        return true
    }

    const at = time ? new Date(time) : null

    if (!at || Number.isNaN(at.getTime())) {
        return false
    }

    return (!period.from || at >= period.from) && (!period.to || at <= period.to)
}
