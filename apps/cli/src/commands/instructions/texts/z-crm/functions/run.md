# z-crm:functions:run

Sends a function's code from `src/` or `data/` to Zoho, executes it without saving it, and prints
Zoho's answer as JSON: status, return value, `info` logs with line numbers, metrics. A change in
`src/` can be run before it is deployed.

- **Writes to Zoho:** yes — **the function runs for real** in the logged-in organization: records it
  changes, emails it sends, webhooks it calls. The deployed version is not changed.
- **Needs login:** yes. **Needs a terminal:** unless `--from`, the API name, every `--arg` and
  `--force` are given.

## When to use

To try a change before deploying it. First run with `--dry-run`: it prints the full command and
sends nothing. Run for real only on a sandbox, or with the person's agreement for this run — that is
what `--force` stands for.

## Result

Exit code 1 when Zoho's status is not `success`; compilation errors come with line and position.
Arguments are read from the declaration and sent as text. The endpoint is undocumented by Zoho.
