# preset

Runs a named list of zoho-studio commands from `presets` in `.zoho-studio/settings.json`, one after
another, in one process. Without a name it lists the presets.

- **Writes to Zoho:** only if a step does. **Needs login:** if a step does.

## When to use

`zoho-studio preset pull-crm` — the built-in preset — refreshes the whole CRM snapshot:
`z-crm:org:info`, then every `z-crm:*:pull`, with modules before fields and layouts. Use it instead
of calling the pulls one by one.

## Side effects

- A step that fails stops the preset. A step with partial failures does not stop it, but the run
  exits non-zero.
- Steps are checked before anything runs: a line that names no command, or calls `preset`, stops
  the run with nothing executed.
- A preset with a built-in name replaces the built-in one.
