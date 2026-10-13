const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
]

export function formatTimeAgo(isoTime: string | null, now = Date.now()): string {
    if (!isoTime) {
        return 'never'
    }

    const seconds = Math.round((new Date(isoTime).getTime() - now) / 1000)

    for (const [unit, unitSeconds] of units) {
        if (Math.abs(seconds) >= unitSeconds) {
            return relativeTime.format(Math.round(seconds / unitSeconds), unit)
        }
    }

    return 'just now'
}

export function formatCount(count: number | null): string {
    return count === null ? '—' : count.toLocaleString('en')
}
