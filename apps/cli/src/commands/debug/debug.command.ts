import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import axios, { isAxiosError } from 'axios'
import { Command } from 'commander'

import { crmClient, describeRequestError } from '@zoho-studio/zoho-crm'
import { getProjectSettings } from '@zoho-studio/core'

/**
 * Probe paths, relative to the CRM client base URL. Edit by hand: the ids come from the
 * client_script_pages and client_scripts answers of an earlier run. When an answer carries a
 * client script hosting url or a user static resource uri, that url is probed too.
 */
const crmProbePaths = ['settings/static_resources?page=1&per_page=200']

const samplesDirName = '_tmp/zoho-crm-api/client-scripts'

export const debugCommand = new Command('debug')
    .description('Probe the Zoho CRM API and save every answer as a sample')
    .action(async () => {
        const { projectPath } = await getProjectSettings()
        const samplesPath = join(projectPath, samplesDirName)

        await mkdir(samplesPath, { recursive: true })

        for (const path of crmProbePaths) {
            const samplePath = join(samplesPath, `${toSampleFileName(path)}.json`)
            const sample = await probeCrm(path)

            await Bun.write(samplePath, JSON.stringify(sample, null, 4) + '\n')
            console.log(`${sample.status ?? 'ERR'} ${path} -> ${samplePath}`)

            const hostingUrl = findHostingUrl(sample.body)

            if (hostingUrl) {
                const hostingSamplePath = join(samplesPath, `${toSampleFileName(path)}_hosting.json`)
                const hostingSample = await probeHosting(hostingUrl)

                await Bun.write(hostingSamplePath, JSON.stringify(hostingSample, null, 4) + '\n')
                console.log(`${hostingSample.status ?? 'ERR'} ${hostingUrl} -> ${hostingSamplePath}`)
            }
        }
    })

type Sample = {
    path: string
    authorization: 'Zoho-oauthtoken' | 'none'
    status: number | null
    headers: Record<string, unknown>
    body: unknown
}

function findHostingUrl(body: unknown): string | undefined {
    const payload = body as {
        client_scripts?: { hosting?: { url?: string } }[]
        static_resources?: { source?: string; uri?: string }[]
    } | null

    return (
        payload?.client_scripts?.[0]?.hosting?.url ??
        payload?.static_resources?.find((resource) => resource.source === 'user')?.uri
    )
}

// The hosting url lives outside Zoho CRM, as in the browser, so it is requested without the OAuth token.
async function probeHosting(url: string): Promise<Sample> {
    try {
        const response = await axios.get(url, { responseType: 'text' })

        return {
            path: url,
            authorization: 'none',
            status: response.status,
            headers: response.headers as Record<string, unknown>,
            body: response.data,
        }
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            return {
                path: url,
                authorization: 'none',
                status: error.response.status,
                headers: error.response.headers as Record<string, unknown>,
                body: error.response.data,
            }
        }

        return {
            path: url,
            authorization: 'none',
            status: null,
            headers: {},
            body: { error: describeRequestError(error) },
        }
    }
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

        return {
            path,
            authorization: 'Zoho-oauthtoken',
            status: null,
            headers: {},
            body: { error: describeRequestError(error) },
        }
    }
}

function toSampleFileName(path: string): string {
    return path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}
