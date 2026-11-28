# `zoho-studio instructions`

Prints instructions for an AI agent working in a zoho-studio project, as markdown: what the
project is, where to start, which commands write to Zoho, what the CLI does not do, and what each
command is for.

```bash
zoho-studio instructions                       # the project, where to start, what the CLI does not do, every command
zoho-studio instructions z-crm                 # everything about Zoho CRM and its commands
zoho-studio instructions z-crm:functions       # one group: its commands and the usual order
zoho-studio instructions z-crm:functions:pull  # one command
```

The name follows the command names: any command, or any prefix of them up to a `:` — `z-crm`,
`z-crm:functions`, `z-crm:fields`. A group lists its commands with their one-line description. A
command's text says what it is for, when to use it, whether it writes to Zoho, needs a login or an
interactive terminal, and what it changes on disk; its options stay in `zoho-studio <command> --help`.

It works anywhere, inside a project or not, and sends nothing to Zoho.

An unknown name fails with exit code 1 and suggests the closest names:

```text
There is no command or group named "z-crm:function". Did you mean: z-crm:functions, …?
```

The texts are built into the executable, so they always match the version of the CLI that prints
them.
