import { chmod, mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { resolveCredentialsHome } from './credentials.config'

/** Secrets live here, so every folder from the store root down is owner-only and so is the file. */
export async function writeSecretJson(filePath: string, value: unknown): Promise<void> {
    const home = resolveCredentialsHome()

    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 })

    for (let dir = dirname(filePath); dir.startsWith(home); dir = dirname(dir)) {
        await chmod(dir, 0o700)

        if (dir === home) {
            break
        }
    }

    // Written owner-only from the first byte and renamed into place, so the secret is never readable by others.
    const tempPath = `${filePath}.${process.pid}.tmp`
    await writeFile(tempPath, `${JSON.stringify(value, null, 4)}\n`, { mode: 0o600 })
    await chmod(tempPath, 0o600)
    await rename(tempPath, filePath)
}

export async function readJsonOrNull<T>(filePath: string): Promise<T | null> {
    const file = Bun.file(filePath)

    return (await file.exists()) ? ((await file.json()) as T) : null
}
