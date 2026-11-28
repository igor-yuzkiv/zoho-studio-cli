# `zoho-studio z-crm:status`

Asks Zoho which organization the project is connected to. It is the fastest way to confirm that
the profile, the stored tokens, and `api.baseUrl` all work together.

```bash
zoho-studio z-crm:status          # the fields you usually want
zoho-studio z-crm:status --json   # the org record exactly as Zoho returned it
```

```text
Organization: Acme Inc
  id: 7000000012345
  type: sandbox
  domain: acme
  data center: com (https://www.zohoapis.com)
  primary email: owner@acme.test
```

`type` tells a sandbox (`sandbox`) from the production organization. `domain` is the organization's part of its CRM web address — for a sandbox in the EU data center, `crmsandbox.zoho.eu/crm/<domain>/`. The organization record names no data center, so `data center` is read from `api.baseUrl` in the [settings](../project/settings.md): the part after `zohoapis.`, then the address itself.

The access token is refreshed on the way if the stored one has expired, so a successful `z-crm:status`
also means the refresh token still works. Nothing is printed about the tokens themselves.

The command needs a project that has been through [`zoho-studio login`](../project/login.md). Run it
before that, and it stops with `This project is not authorized yet`.
