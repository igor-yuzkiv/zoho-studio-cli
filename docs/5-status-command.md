# `zoho-studio status`

Asks Zoho which organization the project is connected to. It is the fastest way to confirm that
the credentials, the stored tokens, and `api.baseUrl` all work together.

```bash
zoho-studio status          # the fields you usually want
zoho-studio status --json   # the org record exactly as Zoho returned it
```

```text
Organization: Acme Inc
  id: 7000000012345
  primary email: owner@acme.test
```

The access token is refreshed on the way if the stored one has expired, so a successful `status`
also means the refresh token still works. Nothing is printed about the tokens themselves.

The command needs a project that has been through [`zoho-studio login`](4-login-command.md). Run it
before that, and it stops with `No refresh token in .zoho-studio/settings.json`.
