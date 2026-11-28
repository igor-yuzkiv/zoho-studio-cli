import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { reportPullResult } from '@zoho-studio/core'

describe('reportPullResult', () => {
    afterEach(() => {
        process.exitCode = 0
    })

    test('prints the summary and leaves the exit code alone when nothing failed', () => {
        const log = spyOn(console, 'log').mockImplementation(() => {})

        reportPullResult({ summary: ['Functions found: 2'], failedCount: 0 })

        expect(log).toHaveBeenCalledWith('Functions found: 2')
        expect(process.exitCode).toBe(0)
        log.mockRestore()
    })

    test('sets a non-zero exit code when some items failed', () => {
        const log = spyOn(console, 'log').mockImplementation(() => {})

        reportPullResult({ summary: ['Failed: 1'], failedCount: 1 })

        expect(process.exitCode).toBe(1)
        log.mockRestore()
    })
})
