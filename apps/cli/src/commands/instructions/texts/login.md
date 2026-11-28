# login

Authorizes the project with Zoho through the OAuth device flow, using a credential profile (a
client from the Zoho API Console), and stores the tokens in `~/.zoho-studio`. Then reads the
organization into `.zoho-studio/org.json`.

- **Writes to Zoho:** no. **Needs a terminal:** yes, unless `--profile` is given or there is exactly
  one stored profile. **Needs a person:** yes — they approve the request in a browser.

## When to use

When `z-crm:status` says the project is not authorized, after the project moved to another path,
or after `auth.scopes` changed (Zoho fixes scopes at consent time). Ask the person to run it; do not
try to complete the browser step yourself.

## Side effects

- Overwrites the project's previous tokens without asking.
- Creating a profile asks for a client secret — never ask the person to paste secrets into the chat.
- Token values are never printed.
