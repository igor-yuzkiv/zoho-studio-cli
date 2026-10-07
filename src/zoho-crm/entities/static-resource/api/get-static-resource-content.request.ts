import axios from 'axios'

/**
 * Returns the file behind a static resource uri as bytes, since some of Zoho's own resources are
 * gzip archives. The uri lies outside Zoho CRM and the CRM web UI reads it without credentials, so
 * no token is sent there.
 */
export async function getStaticResourceContent(uri: string): Promise<Uint8Array> {
    const { data } = await axios.get<ArrayBuffer>(uri, { responseType: 'arraybuffer' })

    return new Uint8Array(data)
}
