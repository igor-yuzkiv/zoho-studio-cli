# @zoho-studio/core

The base of every zoho-studio package: the project, its settings, and the files under `data/`. It knows nothing about a particular Zoho product and sends no requests, so a script that only reads pulled artifacts needs nothing else.

## Entry points

- `getProjectSettings()` → `{ projectPath, settings }` — finds the project from the current folder up (the folder with `.zoho-studio/settings.json`) and reads its settings. Every script starts here.
- `resolveArtifactPath(projectPath, segments)` — the path of a pulled artifact under `data/`. The folder names come from the product package: `resolveArtifactPath(projectPath, [zohoCrmDirName, modulesDirName])` is `data/zoho-crm/modules`.
- `resolveSourcePath`, `resolveWorkspaceMigrationsPath`, `resolveWorkspaceWidgetsPath` — `src/`, `migrations/`, `widgets/`.
- `writeArtifactJson`, `writeArtifactText` — write under `data/` with the same formatting as the CLI's pulls.
- `createCommandLogger(name)` — a logger that writes to the project's `logs/`.

The full list is `src/index.ts` and the files it re-exports.

## Example: read pulled artifacts

```ts
import { readdir } from 'node:fs/promises'

import { getProjectSettings, resolveArtifactPath } from '@zoho-studio/core'
import { modulesDirName, zohoCrmDirName } from '@zoho-studio/zoho-crm'

const { projectPath } = await getProjectSettings()
const modules = await readdir(resolveArtifactPath(projectPath, [zohoCrmDirName, modulesDirName]))

console.log(modules)
```

Run a script from the project folder: `bun run scripts/<name>.ts`.
