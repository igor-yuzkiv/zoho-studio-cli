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

The command needs a project that has been through [`zoho-studio login`](../project/login.md), with
the `ZohoCRM.settings.profiles.READ` scope granted (or `ZohoCRM.settings.ALL`, which covers it).
Without it Zoho answers `OAUTH_SCOPE_MISMATCH`; the scope is in the default
[settings](../project/settings.md), so a project created before it existed has to add it to `auth.scopes`
and log in again.

The command is part of the default `pull-crm` [preset](../project/preset.md).

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

The folder mirrors what Zoho answered: a file whose content did not change stays as it is, a changed one is rewritten, and profiles deleted in Zoho move to `data/.removed/<date-time>/` — see [Pulling](../../guides/pulling.md). Nothing is moved until the list request succeeds, so a failed run leaves the previous snapshot in place.
