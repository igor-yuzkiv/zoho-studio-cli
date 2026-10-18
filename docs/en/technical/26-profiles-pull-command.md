# `zoho-studio z-crm:profiles:pull`

Downloads every Zoho CRM profile into a flat `data/zoho-crm/profiles/` folder — one JSON file per
profile.

```bash
zoho-studio z-crm:profiles:pull
```

```text
Pulling profiles |████████████████████| 3/3 | Team_User
Profiles saved: 3
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md), with
the `ZohoCRM.settings.profiles.READ` scope granted (or `ZohoCRM.settings.ALL`, which covers it).
Without it Zoho answers `OAUTH_SCOPE_MISMATCH`; the scope is in the default
[settings](2-settings.md), so a project created before it existed has to add it to `auth.scopes`
and log in again.

The command is part of the default `pull-crm` [preset](24-preset-command.md).

## What you get

```text
data/zoho-crm/profiles/
  Administrator.json
  Standard.json
  Team_User.json
```

Each file is one profile exactly as Zoho returned it from `settings/profiles` — its `id`, `name`,
`api_name`, `type`, and the permissions the list carries. Files are named after `api_name`; a
profile whose name leaves no usable file name is stored under its id.

The folder is emptied and rewritten on every run, so it mirrors what Zoho answered rather than
accumulating profiles that were since deleted. It is emptied only after the list request succeeds —
a failed run leaves the previous snapshot in place.
