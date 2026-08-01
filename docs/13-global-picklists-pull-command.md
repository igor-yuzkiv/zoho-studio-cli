# `zoho-studio global-picklists:pull`

Downloads every Zoho CRM global picklist into a flat `src/global-picklists/` folder — one JSON file
per picklist, including the `pick_list_values` that the picklist list alone does not carry.

```bash
zoho-studio global-picklists:pull
```

```text
Pulling global picklists |████████████████████| 14/14 | Source
Global picklists found: 14
Global picklists saved: 14
Global picklists failed: 0
```

The command needs a project that has been through [`zoho-studio login`](4-login-command.md), with
the `ZohoCRM.settings.global_picklist.READ` scope granted. Without it Zoho answers
`OAUTH_SCOPE_MISMATCH`; the scope is in the default [settings](2-settings.md), so a project created
before it existed has to add it to `auth.scopes` and log in again.

## What you get

```text
src/global-picklists/
  Industry.json
  Source.json
  Time_Zone.json
```

Each file is one picklist exactly as Zoho returned it from `settings/global_picklists/{id}` — the
metadata plus every value with its `actual_value`, `display_value`, and `sequence_number`. Files are
named after `api_name`; a picklist whose name leaves no usable file name is stored under its id.

The folder is emptied and rewritten on every run, so it mirrors what Zoho answered rather than
accumulating picklists that were since deleted. It is emptied only after the list request succeeds —
a failed run leaves the previous snapshot in place.

## When a single picklist fails

The list is fetched once, then each picklist is fetched on its own, with a short pause between
requests. A picklist that fails is reported by name at the end and the run continues:

```text
Global picklists saved: 13
Global picklists failed: 1
  - Time_Zone: permission denied (OAUTH_SCOPE_MISMATCH)
```

A failure of the list request itself stops the command, because there is nothing to iterate over
and nothing has been deleted yet.

Which fields use a global picklist is not part of this command — that association endpoint needs a
scope Zoho has not granted here. What each module's fields hold comes from
[`fields:pull`](8-fields-pull-command.md).
