interface ClientScriptPageSelectors {
    module?: { api_name: string; display_label?: string; id?: string }
    layout?: { api_name: string; display_label?: string; id?: string }
    canvas?: { name: string; id?: string }
    [selector: string]: unknown
}

/** A client script page as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ClientScriptPage {
    id: string
    definition: string
    selectors?: ClientScriptPageSelectors | null
    [field: string]: unknown
}

/** A client script as Zoho returns it — the named fields are the ones the CLI relies on. */
export interface ClientScript {
    id: string
    name: string
    hosting?: { url?: string } | null
    [field: string]: unknown
}
