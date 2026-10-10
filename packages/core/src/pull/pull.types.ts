/**
 * How a pull reports its per-item progress. The CLI draws it as a progress bar, the browser
 * command streams it to the page, so a pull never decides where its progress goes.
 */
export type PullProgress = {
    start(total: number): void
    update(itemName: string): void
    increment(): void
    stop(): void
}

export type PullResult = {
    /** The closing report, line by line, exactly as the CLI prints it. */
    summary: string[]
    /** Items that could not be pulled; the rest of the run still completed. */
    failedCount: number
}
