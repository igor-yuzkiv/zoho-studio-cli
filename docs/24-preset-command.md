# `zoho-studio preset`

Runs a named sequence of CLI commands, one after another, from the `presets` section of the project
settings.

```bash
zoho-studio preset                        # list the presets
zoho-studio preset pull-crm               # run one
```

```text
[1/10] zoho-studio z-crm:org:info
…
[2/10] zoho-studio z-crm:modules:pull
…
Preset "pull-crm" finished: 10 steps
```

## Defining presets

`presets` in [`.zoho-studio/settings.json`](2-settings.md) maps a preset name to a list of command
lines. Each line is what you would type after `zoho-studio`:

```json
{
    "presets": {
        "pull-leads": ["z-crm:modules:pull", "z-crm:fields:pull --module=Leads"]
    }
}
```

Arguments are separated by whitespace; wrap a value that contains spaces in single or double
quotes. No other shell syntax is understood — no variables, pipes, or `&&`.

Two presets come built in:

- `pull-crm` — `z-crm:org:info`, then every `z-crm:*:pull` command, with `z-crm:modules:pull`
  before `z-crm:fields:pull`, as the fields pull requires.
- `pull-render-projects` — the four `z-projects:*:pull` commands from milestones down to issues,
  then `z-projects:tasks:render` and `z-projects:issues:render`.

Presets are merged with the built-in ones by name: a preset you define is added, and one with a
built-in name replaces that built-in preset entirely.

## How a preset runs

Before the first step runs, every line is checked: a line that names no `zoho-studio` command, or
that calls `preset` itself, stops the run with nothing executed. Presets cannot call other presets.

The steps then run in order, in the same process. A step that fails stops the preset, and the error
names the step. A step that finishes with a partial failure it only reports — a skipped entity, for
example — does not stop the preset, but the run still ends with a non-zero exit code.

An unknown preset name fails with the list of the available presets.
