import type { InstructionTexts } from './instructions.service'

import browserText from './texts/browser.md' with { type: 'text' }
import initText from './texts/init.md' with { type: 'text' }
import instructionsText from './texts/instructions.md' with { type: 'text' }
import loginText from './texts/login.md' with { type: 'text' }
import overviewText from './texts/overview.md' with { type: 'text' }
import presetText from './texts/preset.md' with { type: 'text' }
import zCrmText from './texts/z-crm.md' with { type: 'text' }
import zCrmClientScriptsPullText from './texts/z-crm/client-scripts/pull.md' with { type: 'text' }
import zCrmFieldsPullText from './texts/z-crm/fields/pull.md' with { type: 'text' }
import zCrmFunctionsText from './texts/z-crm/functions.md' with { type: 'text' }
import zCrmFunctionsDeployText from './texts/z-crm/functions/deploy.md' with { type: 'text' }
import zCrmFunctionsImportText from './texts/z-crm/functions/import.md' with { type: 'text' }
import zCrmFunctionsMakeText from './texts/z-crm/functions/make.md' with { type: 'text' }
import zCrmFunctionsPullText from './texts/z-crm/functions/pull.md' with { type: 'text' }
import zCrmFunctionsRunText from './texts/z-crm/functions/run.md' with { type: 'text' }
import zCrmGlobalPicklistsPullText from './texts/z-crm/global-picklists/pull.md' with { type: 'text' }
import zCrmLayoutsPullText from './texts/z-crm/layouts/pull.md' with { type: 'text' }
import zCrmMigrationsText from './texts/z-crm/migrations.md' with { type: 'text' }
import zCrmMigrationsMakeText from './texts/z-crm/migrations/make.md' with { type: 'text' }
import zCrmModulesPullText from './texts/z-crm/modules/pull.md' with { type: 'text' }
import zCrmOrgInfoText from './texts/z-crm/org/info.md' with { type: 'text' }
import zCrmProfilesPullText from './texts/z-crm/profiles/pull.md' with { type: 'text' }
import zCrmStaticResourcesPullText from './texts/z-crm/static-resources/pull.md' with { type: 'text' }
import zCrmStatusText from './texts/z-crm/status.md' with { type: 'text' }
import zCrmWebhooksPullText from './texts/z-crm/webhooks/pull.md' with { type: 'text' }
import zCrmWidgetsText from './texts/z-crm/widgets.md' with { type: 'text' }
import zCrmWidgetsMakeText from './texts/z-crm/widgets/make.md' with { type: 'text' }
import zCrmWidgetsServeText from './texts/z-crm/widgets/serve.md' with { type: 'text' }
import zCrmWorkflowActionsPullText from './texts/z-crm/workflow-actions/pull.md' with { type: 'text' }
import zCrmWorkflowsPullText from './texts/z-crm/workflows/pull.md' with { type: 'text' }

/** Keyed by the path under texts/ without `.md`, which mirrors the command name: `z-crm:functions:pull` → `z-crm/functions/pull`. */
export const instructionTexts: InstructionTexts = {
    'browser': browserText,
    'init': initText,
    'instructions': instructionsText,
    'login': loginText,
    'overview': overviewText,
    'preset': presetText,
    'z-crm': zCrmText,
    'z-crm/client-scripts/pull': zCrmClientScriptsPullText,
    'z-crm/fields/pull': zCrmFieldsPullText,
    'z-crm/functions': zCrmFunctionsText,
    'z-crm/functions/deploy': zCrmFunctionsDeployText,
    'z-crm/functions/import': zCrmFunctionsImportText,
    'z-crm/functions/make': zCrmFunctionsMakeText,
    'z-crm/functions/pull': zCrmFunctionsPullText,
    'z-crm/functions/run': zCrmFunctionsRunText,
    'z-crm/global-picklists/pull': zCrmGlobalPicklistsPullText,
    'z-crm/layouts/pull': zCrmLayoutsPullText,
    'z-crm/migrations': zCrmMigrationsText,
    'z-crm/migrations/make': zCrmMigrationsMakeText,
    'z-crm/modules/pull': zCrmModulesPullText,
    'z-crm/org/info': zCrmOrgInfoText,
    'z-crm/profiles/pull': zCrmProfilesPullText,
    'z-crm/static-resources/pull': zCrmStaticResourcesPullText,
    'z-crm/status': zCrmStatusText,
    'z-crm/webhooks/pull': zCrmWebhooksPullText,
    'z-crm/widgets': zCrmWidgetsText,
    'z-crm/widgets/make': zCrmWidgetsMakeText,
    'z-crm/widgets/serve': zCrmWidgetsServeText,
    'z-crm/workflow-actions/pull': zCrmWorkflowActionsPullText,
    'z-crm/workflows/pull': zCrmWorkflowsPullText,
}
