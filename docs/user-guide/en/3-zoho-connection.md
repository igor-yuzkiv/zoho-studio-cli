# Connecting to Zoho

Zoho Studio talks to Zoho with your permission, given once per project through `zoho-studio login`.
It needs a **client** — an entry you register in the Zoho API console — and stores it on your
computer as a **profile**, so several projects can use the same client.

## The client

1. Open [api-console.zoho.com](https://api-console.zoho.com) with the account whose CRM you want,
   in the data center that account lives in.
2. Add a client of type **Non-browser Mobile Applications**. This type needs no redirect URL, so
   nothing has to run on a server.
3. Copy its `Client ID` and `Client Secret` when `login` asks for them.

## Logging in

```bash
zoho-studio login                  # pick a profile or create one
zoho-studio login --profile acme   # use a stored profile directly
```

`login` shows a link and a code; open the link in any browser, enter the code, and approve. The
code is valid for a few minutes. After that the project stays logged in: the CLI renews its access
on its own, and you need `login` again only if the access was revoked in Zoho, the client was
replaced, or you moved the project folder.

`zoho-studio z-crm:status` confirms the connection at any time by showing the organization.

The approval screen lists what Zoho Studio asks to do. The list comes from `auth.scopes` in the
settings; the default covers everything the tool does, including creating modules and fields for
migrations.

## Data centers

Zoho runs separate data centers, and an account belongs to one of them. If your CRM opens at a
domain other than `zoho.com`, set both addresses in `.zoho-studio/settings.json` before you log in:

```json
{
    "auth": { "baseUrl": "https://accounts.zoho.eu" },
    "api": { "baseUrl": "https://www.zohoapis.eu" }
}
```

Use your region's ending instead of `.eu` — `.in`, `.com.au`, `.jp`, `.ca`, `.com.cn`.

## Where your credentials are kept

Profiles and tokens live in `~/.zoho-studio` in your home folder, never in the project, and only
your user can read them. Treat that folder like a password: anyone who has it can read your CRM.

More detail: [login](../../4-login-command.md), [settings](../../2-settings.md),
[status](../../5-status-command.md).
