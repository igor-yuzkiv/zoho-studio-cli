import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import axios, { isAxiosError } from 'axios'
import { Command } from 'commander'

import { tokenService } from '@/shared/api/auth'
import { crmClient, describeRequestError } from '@/shared/api/crm'
import { describeProjectsRequestError, projectsClient, resolveProjectsBaseUrl } from '@/shared/api/projects'
import { getProjectSettings } from '@/settings'
import { createCommandLogger } from '@/shared/logger'

/**
 * Probe paths, relative to the Projects client base URL. Edit by hand: after the first run,
 * replace <TASK_ID> and <ISSUE_ID> with real ids from the tasks and issues answers and run again.
 */
const projectsProbePaths = [
    'phases?page=1&per_page=200',
    'tasklists?page=1&per_page=200',
    'tasks?page=1&per_page=200',
    'tasks/<TASK_ID>/comments',
    'issues?page=1&per_page=200',
    'issues/<ISSUE_ID>',
    'issues/<ISSUE_ID>/description',
    'bugs/<ISSUE_ID>/comments',
]

/**
 * Probe paths, relative to the CRM client base URL. Edit by hand: the ids come from the
 * client_script_pages and client_scripts answers of an earlier run.
 */
const crmProbePaths = [
    'settings/client_script_pages',
    'settings/client_script_pages/6640142000000521215',
    'settings/client_scripts?client_script_page_id=6640142000000521215',
    'settings/client_scripts/6640142000000521219',
    'settings/client_scripts/6640142000000521219/code',
]

type Area = 'crm' | 'projects'

const samplesDirNames: Record<Area, string> = {
    crm: '_tmp/zoho-crm-api/client-scripts',
    projects: '_tmp/zoho-projects-api',
}

export const debugCommand = new Command('debug')
    .description('Probe the Zoho CRM or Zoho Projects API and save every answer as a sample')
    .option('--area <area>', 'API to probe: crm or projects', 'crm')
    .action(async (options: { area: string }) => {
        if (options.area !== 'crm' && options.area !== 'projects') {
            throw new Error(`Unknown area "${options.area}": use crm or projects`)
        }

        const area: Area = options.area
        const logger = await createCommandLogger('debug')
        const { projectPath } = await getProjectSettings()
        const samplesPath = join(projectPath, samplesDirNames[area])
        const probePaths = area === 'crm' ? crmProbePaths : projectsProbePaths

        await mkdir(samplesPath, { recursive: true })

        for (const path of probePaths) {
            const samplePath = join(samplesPath, `${toSampleFileName(path)}.json`)
            const sample = area === 'crm' ? await probeCrm(path) : await probe(path, logger)

            await Bun.write(samplePath, JSON.stringify(sample, null, 4) + '\n')
            console.log(`${sample.status ?? 'ERR'} ${path} -> ${samplePath}`)
        }
    })

type Sample = {
    path: string
    authorization: 'Zoho-oauthtoken' | 'Bearer'
    status: number | null
    headers: Record<string, unknown>
    body: unknown
}

async function probeCrm(path: string): Promise<Sample> {
    try {
        const response = await crmClient.get(path)

        return {
            path,
            authorization: 'Zoho-oauthtoken',
            status: response.status,
            headers: response.headers as Record<string, unknown>,
            body: response.data,
        }
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            return {
                path,
                authorization: 'Zoho-oauthtoken',
                status: error.response.status,
                headers: error.response.headers as Record<string, unknown>,
                body: error.response.data,
            }
        }

        return { path, authorization: 'Zoho-oauthtoken', status: null, headers: {}, body: { error: describeRequestError(error) } }
    }
}

async function probe(path: string, logger: Awaited<ReturnType<typeof createCommandLogger>>): Promise<Sample> {
    const first = await request(path, 'Zoho-oauthtoken')

    if (first.status !== 401) {
        return first
    }

    // Zoho documents Bearer for Projects and Zoho-oauthtoken for CRM; whichever works is the client's answer.
    logger.warn({ path }, 'Zoho-oauthtoken answered 401, retrying with Bearer')
    const second = await request(path, 'Bearer')

    logger.info({ path, status: second.status }, 'Bearer retry finished')

    return second
}

async function request(path: string, authorization: Sample['authorization']): Promise<Sample> {
    try {
        const response =
            authorization === 'Zoho-oauthtoken'
                ? await projectsClient.get(path)
                : await axios.get(await resolveProbeUrl(path), {
                      headers: { Authorization: `Bearer ${await tokenService.getAccessToken()}` },
                  })

        return {
            path,
            authorization,
            status: response.status,
            headers: response.headers as Record<string, unknown>,
            body: response.data,
        }
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            return {
                path,
                authorization,
                status: error.response.status,
                headers: error.response.headers as Record<string, unknown>,
                body: error.response.data,
            }
        }

        return {
            path,
            authorization,
            status: null,
            headers: {},
            body: { error: describeProjectsRequestError(error) },
        }
    }
}

async function resolveProbeUrl(path: string): Promise<string> {
    const { settings } = await getProjectSettings()

    return `${resolveProjectsBaseUrl(settings.projects)}/${path}`
}

function toSampleFileName(path: string): string {
    return path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}
