# Rule: Zoho findings

Zoho's documentation and OpenAPI spec are often incomplete or wrong. Whatever we learn about how
Zoho actually behaves is recorded in `zoho-findings/`, so the next task starts from it
instead of rediscovering it.

## When to record

Record a finding when observed behavior differs from the spec or the docs, fills a gap they leave,
or constrains our code: a rejected payload, an undocumented limit, an error code, a value Zoho adds
on its own, a spec typo we rely on being a typo. Record it in the same change as the code that
depends on it.

Before relying on the spec for something the findings already cover, read the finding: it wins
over the spec until a newer observation says otherwise.

## Where

One file per Zoho area, named after it: `modules.md`, `fields.md`, `layouts.md`, `auth.md`, …
`README.md` in the folder lists the files. Add a file when an area has its first finding.

## Format

Each finding is a short section:

```markdown
## Static text tooltip is rejected on date fields

- **Observed:** 2026-10-13, sandbox org, `bun run migrate` (ZS-66)
- **Spec says:** `tooltip.name` is `static_text` or `info_icon` for any field (fields.yaml:4105)
- **Actually:** `POST /settings/fields` answers `DEPENDENT_MISMATCH` — "Invalid tooltip type
  static_text for data type date"
- **In our code:** the migration builder rejects static_text on date fields
```

- **Observed** — when, on what kind of org, and how (a probe, a run, a task key). Never a local
  path or a secret.
- **Spec says** — with a file and line in the spec, or "not documented".
- **Actually** — the request and Zoho's answer, as precise as it was seen.
- **In our code** — what depends on it, or "nothing yet".

Mark what was inferred rather than seen as **Assumed**. When a later observation contradicts a
finding, update the finding instead of adding a second one.
