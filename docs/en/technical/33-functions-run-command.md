# `zoho-studio z-crm:functions:run`

Runs a function's code in Zoho and prints Zoho's answer. The code is taken from the local source in
`src/` or from the snapshot of the last pull in `data/`, sent as it is, and not saved: the function in
Zoho keeps its deployed version. It is what the Run button of Zoho's Deluge editor does.

**A change in `src/` runs before it is deployed.** Zoho executes the code the command sends, not the
version it has saved, so you can edit a function locally, run it, read its logs, and deploy only when
it does what you want.

**The function runs for real.** Whatever it does — changing records, sending emails, calling
webhooks — happens in the organization the project is logged in to. Run functions on a sandbox
first.

```bash
zoho-studio z-crm:functions:run                                    # pick the place and the function, answer the arguments
zoho-studio z-crm:functions:run btn_send_quote --from src --arg id=1123 --arg count=2
zoho-studio z-crm:functions:run wf_sync --from data --dry-run      # print the command, send nothing
zoho-studio z-crm:functions:run btn_send_quote --from src -a id=1123 -a count=2 --force
```

## Options

- `--from <src|data>` — where the code comes from: `src` for the local source in
  `src/zoho-crm/functions/`, `data` for what Zoho had at the last pull, in `data/zoho-crm/functions/`.
  Nothing is assumed: without it the command asks, and without a terminal it stops.
- `[api_name]` — the function's folder in that place. Leave it out to pick from a list of the
  functions there; type a few letters to narrow it down.
- `-a, --arg <name=value>` — one argument of the function; repeat it for each. Everything after the
  first `=` is the value. A name the declaration does not have is refused.
- `--dry-run` — prints the command that runs the function with these arguments, and sends nothing.
- `-f, --force` — runs without asking for confirmation.

## The arguments

The arguments are read from the function's declaration — `string button.btn_send_quote(String id,
Int count)` asks for `id` and `count`. Each one not passed with `--arg` is asked for in the order
the declaration lists them:

```text
✔ Take the code from src/ — the local source
✔ Function to run btn_send_quote
✔ id (String) 1123
✔ count (Int) 2
```

Values are sent as text, the way Zoho's editor sends them.

`--dry-run` is the way to go from the questions to a command you can repeat: answer them once, and it
prints the full command instead of running the function.

```text
zoho-studio z-crm:functions:run btn_send_quote --from src --arg id=1123 --arg count=2
```

## Confirmation

Before anything is sent, the command says what will happen and asks; the answer defaults to no.

```text
sa_ping will run in Zoho CRM with the code from src/.
Whatever it does happens for real: records it changes, emails it sends, webhooks it calls.
✔ Run the function? No
Nothing run.
```

`--force` skips the question. Without a terminal the command cannot ask, so it needs `--from`, the
API name, every argument with `--arg`, and `--force`; otherwise it stops with an error that names what is
missing.

## The result

Zoho's answer is printed as formatted JSON: the status, the returned value with its type, one log
entry per `info` statement with its line number, and metrics such as the number of statements and
the time taken. The exit code is 1 when the status is not `success`. A function that does not compile
is reported with the line and position of each error, as a deploy reports it.

Zoho does not document the endpoint the command uses.
