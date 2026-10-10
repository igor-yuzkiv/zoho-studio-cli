import { stat } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveWorkspaceSourcePath } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { pullClientScripts } from '@zoho-studio/zoho-crm/client-script'
import { pullFields } from '@zoho-studio/zoho-crm/field'
import { pullFunctions } from '@zoho-studio/zoho-crm/function'
import { pullGlobalPicklists } from '@zoho-studio/zoho-crm/global-picklist'
import { pullModules } from '@zoho-studio/zoho-crm/module'
import { pullStaticResources } from '@zoho-studio/zoho-crm/static-resource'
import { pullWebhooks } from '@zoho-studio/zoho-crm/webhook'
import { pullWorkflowActions } from '@zoho-studio/zoho-crm/workflow-action'
import { pullWorkflows } from '@zoho-studio/zoho-crm/workflow-rule'
import { pullIssues } from '@zoho-studio/zoho-projects'
import { pullMilestones } from '@zoho-studio/zoho-projects'
import { pullTaskLists } from '@zoho-studio/zoho-projects'
import { pullTasks } from '@zoho-studio/zoho-projects'

import type { AreaId, ArtifactGroupSummary, PullOptionName } from './browser.types'

type PullOptions = Partial<Record<PullOptionName, string>>

export type ArtifactGroup = {
    area: AreaId
    id: string
    label: string
    command: string
    options: PullOptionName[]
    relativePath: string
    /** Matches one file per artifact, relative to `relativePath`. */
    artifactPattern: string
    excludedPattern?: string
    pull: (options: PullOptions, progress: PullProgress) => Promise<PullResult>
}

const commentsPattern = '**/*.comments.json'

export const artifactGroups: ArtifactGroup[] = [
    {
        area: 'crm',
        id: 'functions',
        label: 'Functions',
        command: 'z-crm:functions:pull',
        options: [],
        relativePath: 'zoho-crm/functions',
        artifactPattern: '*/*.metadata.json',
        pull: (_, progress) => pullFunctions(progress),
    },
    {
        area: 'crm',
        id: 'modules',
        label: 'Modules',
        command: 'z-crm:modules:pull',
        options: [],
        relativePath: 'zoho-crm/modules',
        artifactPattern: '*/*.metadata.json',
        pull: (_, progress) => pullModules(progress),
    },
    {
        area: 'crm',
        id: 'fields',
        label: 'Fields',
        command: 'z-crm:fields:pull',
        options: ['module'],
        relativePath: 'zoho-crm/modules',
        artifactPattern: '*/fields/*.json',
        pull: (options, progress) => pullFields({ module: options.module }, progress),
    },
    {
        area: 'crm',
        id: 'workflows',
        label: 'Workflow rules',
        command: 'z-crm:workflows:pull',
        options: ['module'],
        relativePath: 'zoho-crm/workflows',
        artifactPattern: '**/*.json',
        pull: (options, progress) => pullWorkflows({ module: options.module }, progress),
    },
    {
        area: 'crm',
        id: 'workflow-actions',
        label: 'Workflow actions',
        command: 'z-crm:workflow-actions:pull',
        options: ['module', 'type'],
        relativePath: 'zoho-crm/workflow-actions',
        artifactPattern: '**/*.json',
        pull: (options, progress) =>
            pullWorkflowActions(
                { module: options.module, type: options.type } as Parameters<typeof pullWorkflowActions>[0],
                progress
            ),
    },
    {
        area: 'crm',
        id: 'webhooks',
        label: 'Webhooks',
        command: 'z-crm:webhooks:pull',
        options: [],
        relativePath: 'zoho-crm/webhooks',
        artifactPattern: '**/*.json',
        pull: (_, progress) => pullWebhooks(progress),
    },
    {
        area: 'crm',
        id: 'global-picklists',
        label: 'Global picklists',
        command: 'z-crm:global-picklists:pull',
        options: [],
        relativePath: 'zoho-crm/global-picklists',
        artifactPattern: '**/*.json',
        pull: (_, progress) => pullGlobalPicklists(progress),
    },
    {
        area: 'crm',
        id: 'client-scripts',
        label: 'Client scripts',
        command: 'z-crm:client-scripts:pull',
        options: [],
        relativePath: 'zoho-crm/client-scripts',
        artifactPattern: '**/*.js',
        pull: (_, progress) => pullClientScripts(progress),
    },
    {
        area: 'crm',
        id: 'static-resources',
        label: 'Static resources',
        command: 'z-crm:static-resources:pull',
        options: [],
        relativePath: 'zoho-crm/static-resources',
        artifactPattern: '**/*.metadata.json',
        pull: (_, progress) => pullStaticResources(progress),
    },
    {
        area: 'projects',
        id: 'milestones',
        label: 'Milestones',
        command: 'z-projects:milestones:pull',
        options: [],
        relativePath: 'zoho-projects/raw',
        artifactPattern: '*/*.json',
        excludedPattern: 'issues/*.json',
        pull: (_, progress) => pullMilestones(progress),
    },
    {
        area: 'projects',
        id: 'task-lists',
        label: 'Task lists',
        command: 'z-projects:task-lists:pull',
        options: [],
        relativePath: 'zoho-projects/raw',
        artifactPattern: '*/task-lists/*/*.json',
        pull: (_, progress) => pullTaskLists(progress),
    },
    {
        area: 'projects',
        id: 'tasks',
        label: 'Tasks',
        command: 'z-projects:tasks:pull',
        options: ['from', 'to'],
        relativePath: 'zoho-projects/raw',
        artifactPattern: '**/tasks/*/*.json',
        excludedPattern: commentsPattern,
        pull: (options, progress) => pullTasks({ from: options.from, to: options.to }, progress),
    },
    {
        area: 'projects',
        id: 'issues',
        label: 'Issues',
        command: 'z-projects:issues:pull',
        options: ['from', 'to'],
        relativePath: 'zoho-projects/raw/issues',
        artifactPattern: '*/*.json',
        excludedPattern: commentsPattern,
        pull: (options, progress) => pullIssues({ from: options.from, to: options.to }, progress),
    },
]

export function findArtifactGroup(area: string, id: string): ArtifactGroup | undefined {
    return artifactGroups.find((group) => group.area === area && group.id === id)
}

export async function summarizeArtifactGroup(projectPath: string, group: ArtifactGroup): Promise<ArtifactGroupSummary> {
    const absolutePath = join(resolveWorkspaceSourcePath(projectPath), group.relativePath)
    const { relativePath, area, id, label, command, options } = group
    const base = { area, id, label, command, options, relativePath, absolutePath }

    if (!(await stat(absolutePath).catch(() => null))) {
        return { ...base, count: null, pulledAt: null }
    }

    const excluded = group.excludedPattern ? new Bun.Glob(group.excludedPattern) : null
    let count = 0
    let newestModifiedAt = 0

    for await (const filePath of new Bun.Glob(group.artifactPattern).scan({ cwd: absolutePath, onlyFiles: true })) {
        if (excluded?.match(filePath)) {
            continue
        }

        count++
        newestModifiedAt = Math.max(newestModifiedAt, (await stat(join(absolutePath, filePath))).mtimeMs)
    }

    return { ...base, count, pulledAt: newestModifiedAt ? new Date(newestModifiedAt).toISOString() : null }
}
