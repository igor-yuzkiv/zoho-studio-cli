import { workspaceSettingsRelativePath } from '@/config'
import type { ProjectSettings } from '@/settings'

let warned = false

/**
 * Older projects kept the client and tokens in settings.json. Unknown keys survive the settings
 * merge, so they are still visible here; the CLI no longer uses them and says so once per run.
 */
export function warnAboutLegacyAuth(settings: ProjectSettings): void {
    const auth = settings.auth as ProjectSettings['auth'] & Record<string, unknown>

    if (warned || !('clientId' in auth || 'clientSecret' in auth || 'tokens' in auth)) {
        return
    }

    warned = true
    console.warn(
        `Warning: ${workspaceSettingsRelativePath} still holds auth.clientId, auth.clientSecret or auth.tokens. ` +
            'They are ignored now — credentials live in ~/.zoho-studio. Run "zoho-studio auth:migrate-legacy" ' +
            'to move them, or "zoho-studio login".'
    )
}
