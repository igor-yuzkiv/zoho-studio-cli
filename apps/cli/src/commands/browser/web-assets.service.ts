import { join } from 'node:path'

/** Page files embedded into the compiled binary, keyed by their path below `dist/web`. */
let embeddedWebAssets: Record<string, string> | null = null

// Running from source, the page is the folder `bun run build:web` writes at the repository root.
const builtWebAssetsPath = join(import.meta.dir, '../../../../../dist/web')

/** Called by the compile entry point before the CLI starts; see scripts/compile.ts. */
export function registerEmbeddedWebAssets(assets: Record<string, string> | null): void {
    embeddedWebAssets = assets
}

/** Returns the file to serve for a page path, or null when the page has no such file. */
export async function resolveWebAsset(pathname: string): Promise<Bun.BunFile | null> {
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')

    if (embeddedWebAssets) {
        const embeddedPath = embeddedWebAssets[relativePath]

        return embeddedPath ? Bun.file(embeddedPath) : null
    }

    const assetPath = join(builtWebAssetsPath, relativePath)

    // join() normalizes `..`, so anything still inside the folder is safe to serve.
    if (!assetPath.startsWith(builtWebAssetsPath)) {
        return null
    }

    const asset = Bun.file(assetPath)

    return (await asset.exists()) ? asset : null
}
