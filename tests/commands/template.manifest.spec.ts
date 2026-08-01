import { describe, expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

import { templateFiles } from '@/commands/init/template.manifest'

const templateDirPath = join(import.meta.dir, '../../template')

async function readTemplateFilePaths(dirPath: string): Promise<string[]> {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const paths: string[] = []

    for (const entry of entries) {
        const entryPath = join(dirPath, entry.name)

        paths.push(...(entry.isDirectory() ? await readTemplateFilePaths(entryPath) : [entryPath]))
    }

    return paths
}

describe('templateFiles', () => {
    // A file added to template/ without a manifest entry is never embedded, and never reaches a user.
    test('covers every file in the template directory', async () => {
        const onDisk = (await readTemplateFilePaths(templateDirPath))
            .map((filePath) => relative(templateDirPath, filePath))
            .sort()

        expect(templateFiles.map(({ destination }) => destination).sort()).toEqual(onDisk)
    })

    test('resolves every embedded source to readable content', async () => {
        for (const templateFile of templateFiles) {
            expect(await Bun.file(templateFile.embeddedPath).exists()).toBe(true)
        }
    })
})
