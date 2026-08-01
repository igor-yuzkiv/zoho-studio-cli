import { Command } from 'commander'

import type { Organization } from '@/shared/api/crm'

import { pullOrganization, type OrganizationSnapshot } from './org.service'

export const orgInfoCommand = new Command('org:info')
    .description('Show the Zoho organization and store it in the project')
    .option('--json', 'print the organization exactly as Zoho returned it', false)
    .action(async (options: { json: boolean }) => {
        const snapshot = await pullOrganization()

        if (options.json) {
            console.log(JSON.stringify(snapshot.organization, null, 4))
            return
        }

        printOrganization(snapshot)
    })

export function printOrganization({ organization, organizationPath }: OrganizationSnapshot): void {
    for (const line of formatOrganization(organization)) {
        console.log(line)
    }

    console.log()
    console.log(`Saved to ${organizationPath}`)
}

export function formatOrganization(organization: Organization): string[] {
    const lines = [`Organization: ${asText(organization.company_name)}`]

    for (const [label, value] of describedFields(organization)) {
        if (value !== undefined && value !== null && value !== '') {
            lines.push(`  ${label}: ${String(value)}`)
        }
    }

    return lines
}

/** The fields worth reading in a terminal; everything else stays in the stored file. */
function describedFields(organization: Organization): [string, unknown][] {
    const license = asRecord(organization.license_details)

    return [
        ['id', organization.id],
        ['type', organization.type],
        ['domain', organization.domain_name],
        ['primary email', organization.primary_email],
        ['phone', organization.phone],
        ['website', organization.website],
        ['location', formatLocation(organization)],
        ['currency', organization.currency],
        ['time zone', organization.time_zone],
        ['employees', organization.employee_count],
        ['created', organization.created_time],
        ['licence', license && `${asText(license.paid_type)}, ${asText(license.users_license_purchased)} users`],
    ]
}

function formatLocation(organization: Organization): string {
    return [organization.city, organization.state, organization.country ?? organization.country_code]
        .filter((part) => typeof part === 'string' && part !== '')
        .join(', ')
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function asText(value: unknown): string {
    return value === undefined || value === null || value === '' ? 'unknown' : String(value)
}
