/** The org record as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface Organization {
    company_name?: string
    id?: string
    primary_email?: string
    /** `sandbox` for a sandbox organization; see zoho-findings/organization.md. */
    type?: string
    [field: string]: unknown
}
