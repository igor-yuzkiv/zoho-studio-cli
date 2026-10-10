# `zoho-studio login`

Authorizes the project against Zoho with a **credential profile** and stores the resulting access
and refresh tokens in `~/.zoho-studio`, outside the project.

```bash
zoho-studio login                         # choose a profile from the list, or create one
zoho-studio login --profile acme          # no questions asked
zoho-studio login --connection projects   # a separate login for Zoho Projects
```

## Profiles

A profile is a client from the Zoho API Console under a name of your choice: the name, the
`Client ID`, and the `Client Secret`. It is stored once, in `~/.zoho-studio/profiles.json`, and any
number of projects can log in with it.

Without `--profile`, `login` lists the stored profiles with a **Create a new profile** entry at the
end. Creating one asks for the name, the client id, and the client secret — the secret is masked
while you type — and saves the profile before the login starts. There is no other command to add,
list, or remove profiles.

`--profile <name>` skips the list and fails if no profile has that name. When `login` runs without
a terminal to ask in and without `--profile`, it uses the only stored profile and refuses when
there are none or several.

## The device flow

You never copy a code out of the Zoho console. The CLI asks Zoho for a device code, shows you a
short user code and a URL, and waits while you approve the request in a browser:

```text
? Credential profile acme

Open https://accounts.zoho.com/oauth/v3/device in a browser and enter this code:

    A1B2-C3D4

The code is valid for 5 min. Waiting for approval...

Authorized with the "acme" profile. Tokens of the default connection stored in ~/.zoho-studio.
  access token valid for 60 min

Organization: Acme Inc
  id: 7000000012345
  type: sandbox
  primary email: owner@acme.test

Saved to /projects/acme/.zoho-studio/org.json

The project is authorized.
```

Once the tokens are stored, `login` reads the organization and writes it to
`.zoho-studio/org.json` — the same thing [`zoho-studio z-crm:org:info`](10-org-info-command.md) does. The
tokens are already saved by then, so a failure there is reported and the login still succeeds.

The token values are never printed. `login` finds the project by walking up from the current
folder, so it works from any subfolder, and it overwrites the tokens of a previous login of the
same connection without asking.

## Connections

A project has a **default** connection, and every command uses it. `--connection projects` logs in
a second, separate connection — with another profile, or another Zoho account — that the
`z-projects:*` commands use instead whenever it exists. CRM commands always stay on the default
one.

The default login asks Zoho for `auth.scopes.crm` and `auth.scopes.projects` together; a Projects
login asks only for `auth.scopes.projects` and does not read the organization. See
[2-settings.md](2-settings.md).

## Where the tokens live

```text
~/.zoho-studio/
  profiles.json                      # every profile, with its client secret
  projects/
    -home-me-work-acme/
      tokens.json                    # this project's connections and the profile of each
```

A project's folder is named after its absolute path with `/` replaced by `-`. Move or rename the
project and its tokens stay behind under the old name — run `login` again. Two paths can map to
the same name (`/a-b` and `/a/b`); `tokens.json` records the original path, and a project that
finds another project's file there stops with an error instead of using its tokens.

The folders are created readable by the owner only, and both files are written with `chmod 0600`.
They hold client secrets and refresh tokens — treat a leak as if a password leaked.
`ZOHO_STUDIO_HOME` moves the whole store to another folder.

## One-time setup of a client

1. Open [api-console.zoho.com](https://api-console.zoho.com) with the account whose data you want,
   in the data center that account belongs to (`.com`, `.eu`, `.in`, …). If it is not `.com`, set
   `auth.baseUrl` and `api.baseUrl` in the project settings to that region.
2. Register a client of type **Non-browser Mobile Applications**. This is the type the device flow
   needs — it has no redirect URI, so nothing has to run on a web server or a local port.
3. Run `login`, choose **Create a new profile**, and paste `Client ID` and `Client Secret`.

## Staying authorized

You run `login` once per connection. The access token Zoho issues lives an hour, and commands that
need it ask `TokenService` (`src/cli/shared/api/auth/token.service.ts`) rather than reading the store
themselves. It hands back the stored token while it is valid, and otherwise exchanges the refresh
token — with the client of the connection's profile — for a new access token and writes it back to
`tokens.json`. A token within a minute of expiring counts as expired, so it is never handed out
just before it dies, and concurrent callers of one connection share a single refresh — Zoho caps a
refresh token at 10 access tokens per 10 minutes.

The refresh token itself does not expire. You only need `login` again if it was revoked in the Zoho
console, the client was replaced, or the profile was removed from `profiles.json`.

## Checking the result

[`zoho-studio z-crm:status`](5-status-command.md) asks Zoho which organization the project is connected
to — the quickest confirmation that the profile and `api.baseUrl` are right.

## When it fails

| Message | What it means |
| --- | --- |
| `No .zoho-studio/settings.json found …` | You are outside a project — run [`zoho-studio init`](3-init-command.md). |
| `There is no credential profile yet …` | No terminal to create one in — run `login` interactively. |
| `There is no profile named "…"` | `--profile` names a profile that is not stored. |
| `Several profiles exist …` | No terminal to choose in — pass `--profile`. |
| `auth.scopes is empty …` | There is nothing to ask permission for. |
| `Zoho rejected the request: invalid_client …` | The client id of the profile does not match the console, or `auth.baseUrl` points to the wrong data center. |
| `Zoho rejected the request: invalid_scope …` | One of the scopes in `auth.scopes` does not exist. |
| `Zoho rejected the request: access_denied …` | The request was denied on the consent screen. |
| `Zoho rejected the request: other_dc …` | The account lives in another data center than `auth.baseUrl`. |
| `The device code expired before it was approved.` | The code was not entered in time — run `login` again. |

Zoho reports these failures with HTTP 200 and an `error` field in the body, so a "successful"
request can still be a rejection — the CLI treats them as errors and writes nothing. Network
failures propagate as-is, and the stored tokens are left untouched.

A project whose `settings.json` still carries `auth.clientId`, `auth.clientSecret`, or
`auth.tokens` from an older version gets a warning on every run: those keys are ignored now.
[`zoho-studio auth:migrate-legacy`](26-auth-migrate-legacy-command.md) moves them into
`~/.zoho-studio`.
