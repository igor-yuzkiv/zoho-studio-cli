# `zoho-studio auth:migrate-legacy`

Moves the client and the tokens out of the `settings.json` of a project created by an older CLI
and into `~/.zoho-studio`, so the project keeps working without a new login.

```bash
zoho-studio auth:migrate-legacy                  # asks how to name the new profile
zoho-studio auth:migrate-legacy --profile acme   # no questions asked
```

Older versions kept `auth.clientId`, `auth.clientSecret`, and `auth.tokens` in
`.zoho-studio/settings.json`. The CLI now ignores those keys and warns about them on every run.
This command takes them over:

1. **The client becomes a profile.** If a profile with the same client id is already stored, it is
   reused and nothing is asked. Otherwise a new profile is created; its name comes from
   `--profile`, or the command asks for it and suggests the project folder name. Without a terminal
   to ask in, the folder name is used.
2. **The tokens become the project's default connection** — unless the store already holds tokens
   for this project, which are newer and are kept.
3. **The three keys are removed from `settings.json`.** Everything else in the file stays as it
   was, including a flat `auth.scopes` list, which the CLI reads as before.

```text
Created the "acme" profile from the client in settings.json.
Moved the tokens to ~/.zoho-studio.
Removed auth.clientId, auth.clientSecret and auth.tokens from settings.json.
```

Running it again, or on a project that never had these keys, changes nothing and prints
`Nothing to migrate`. Several old projects that used the same client end up sharing one profile.

A client id without a client secret, or the other way round, is not migrated: the command stops,
writes nothing, and asks you to remove the keys and run [`zoho-studio login`](4-login-command.md).
A name passed with `--profile` that another profile already has stops the command the same way.
