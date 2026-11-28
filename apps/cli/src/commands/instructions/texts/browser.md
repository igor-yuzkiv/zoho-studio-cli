# browser

Starts a local web app (on `127.0.0.1` only) to browse the artifacts under `data/`, rerun pulls,
read the project log, log in, and open widgets on the emulator. Runs until Ctrl+C.

- **Writes to Zoho:** no (pulls only read). **Needs login:** for pulls.

## When to use

When the person wants to look through the pulled artifacts themselves. An agent rarely needs it:
read `data/` and run the pull commands directly instead. It is a long-running server — start it in
the background, or not at all.

## Side effects

- Pulls started from the page write the same files as the matching `z-crm:*:pull` command.
- `--no-open` starts the server without opening a browser; `--port` fixes the port.
