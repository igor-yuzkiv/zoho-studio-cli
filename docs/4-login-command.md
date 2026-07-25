# `zoho-studio login`

Authorizes the project against Zoho and stores the resulting access and refresh tokens in
`.zoho-studio/settings.json`.

```bash
zoho-studio login
```

You never copy a code out of the Zoho console. The CLI asks Zoho for a device code, shows you a
short user code and a URL, and waits while you approve the request in a browser:

```text
Open https://accounts.zoho.com/oauth/v3/device in a browser and enter this code:

    A1B2-C3D4

The code is valid for 5 min. Waiting for approval...

Authorized. Tokens stored in the project settings.
  access token valid for 60 min

The project is authorized.
```

The token values are never printed. `login` finds the project by walking up from the current
folder, so it works from any subfolder, and it overwrites the tokens of a previous login without
asking.

## One-time setup

1. Open [api-console.zoho.com](https://api-console.zoho.com) with the account whose data you want,
   in the data center that account belongs to (`.com`, `.eu`, `.in`, …). If it is not `.com`, set
   `auth.baseUrl` and `api.baseUrl` in the settings to that region.
2. Register a client of type **Non-browser Mobile Applications**. This is the type the device flow
   needs — it has no redirect URI, so nothing has to run on a web server or a local port.
3. Copy `Client ID` and `Client Secret` into `auth.clientId` and `auth.clientSecret` in
   `.zoho-studio/settings.json`.
4. Check `auth.scopes` — the CLI requests exactly what is listed there, and the browser consent
   screen shows the same list. See [2-settings.md](2-settings.md).

Then run `login`.

## Staying authorized

You run `login` once. The access token Zoho issues lives an hour, and commands that need it ask
`TokenService` (`src/api/auth/token.service.ts`) rather than reading the settings themselves.
It hands back the stored token while it is valid, and otherwise exchanges the refresh token for a
new access token and writes it back to `settings.json`. A token within a minute of expiring counts
as expired, so it is never handed out just before it dies, and concurrent callers in one run share
a single refresh — Zoho caps a refresh token at 10 access tokens per 10 minutes.

The refresh token itself does not expire. You only need `login` again if it was revoked in the Zoho
console or the client was replaced; that shows up as
`The stored refresh token is no longer valid …`.

## Checking the result

[`zoho-studio status`](5-status-command.md) asks Zoho which organization the project is connected
to — the quickest confirmation that the credentials and `api.baseUrl` are right.

## When it fails

| Message | What it means |
| --- | --- |
| `No .zoho-studio/settings.json found …` | You are outside a project — run [`zoho-studio init`](3-init-command.md). |
| `auth.clientId and auth.clientSecret are required …` | The credentials are still empty; nothing was sent to Zoho. |
| `auth.scopes is empty …` | There is nothing to ask permission for. |
| `Zoho rejected the request: invalid_client …` | The client id does not match the console, or `auth.baseUrl` points to the wrong data center. |
| `Zoho rejected the request: invalid_scope …` | One of the scopes in `auth.scopes` does not exist. |
| `Zoho rejected the request: access_denied …` | The request was denied on the consent screen. |
| `Zoho rejected the request: other_dc …` | The account lives in another data center than `auth.baseUrl`. |
| `The device code expired before it was approved.` | The code was not entered in time — run `login` again. |

Zoho reports these failures with HTTP 200 and an `error` field in the body, so a "successful"
request can still be a rejection — the CLI treats them as errors and writes nothing. Network
failures propagate as-is, and the stored tokens are left untouched.
