const zohoApisHostPrefix = /^(?:www\.)?zohoapis\./

/**
 * The organization record names no data center; the API address the project calls does —
 * `https://www.zohoapis.eu` is the EU one.
 */
export function describeDataCenter(apiBaseUrl: string): string {
    const host = URL.canParse(apiBaseUrl) ? new URL(apiBaseUrl).hostname : ''

    return zohoApisHostPrefix.test(host) ? `${host.replace(zohoApisHostPrefix, '')} (${apiBaseUrl})` : apiBaseUrl
}
