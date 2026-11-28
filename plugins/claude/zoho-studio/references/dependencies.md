# Dependencies of the zoho-studio plugin

What the plugin and the zoho-studio CLI need on the machine: how to check each dependency, how to install or update it, and what to tell the person. `/zoho-studio:setup` starts from the clone, then goes through the dependencies in order. A new dependency is added here, not into a skill.

Every install or update runs only after the person agreed to that specific action.

## The zoho-studio clone: where it is and whether it is current

- **Find:** `claude plugin marketplace list --json` has an entry with `"name": "zoho-studio"` and `"source": "directory"`; its `path` is the clone. Confirm it holds `package.json` with `"name": "zoho-studio-cli"`.
- **Missing:** the plugin was installed from a git URL rather than a folder, so there is no clone to build the CLI from. Ask the person for the path of their clone, or offer to clone the repository where they say and to add that folder as the marketplace instead (`claude plugin marketplace add <path>`).
- **Is it current:** `git -C <clone> fetch --quiet`, then `git -C <clone> status -sb`: "behind N" means newer commits are available. The version in use is `version` in `<clone>/package.json` (the same number is in the plugin's `plugin.json`).
- **Update:** `git -C <clone> pull --ff-only`. Do not pull when the clone has local changes (`git -C <clone> status --porcelain` is not empty) or is on a branch other than `master`: tell the person and skip — those are their changes.
- **After an update:** the skills just changed under the running session. Tell the person to restart the session (or run `/reload-plugins`) and to run `/zoho-studio:setup` again, then stop.

## Dependencies

### Bun

- **Needed by:** the CLI (it is built and run with Bun) and project scripts.
- **Check:** `bun --version` prints 1.3 or newer.
- **Install or update:** `curl -fsSL https://bun.sh/install | bash`. It installs into `~/.bun/bin` and adds it to the shell profile, so the current shell may not see `bun` yet: run the next steps with `~/.bun/bin/bun`, and tell the person to open a new terminal.

### zoho-studio CLI

- **Check:** `zoho-studio --version` equals `version` in `<clone>/package.json`. If the shell does not find `zoho-studio`, check `~/.local/bin/zoho-studio` — the CLI may be installed but not on `PATH`.
- **Install or update:** `bun run setup` in the clone (`cd <clone> && bun run setup`). It builds the CLI, links it as `~/.local/bin/zoho-studio`, and registers the packages for project scripts.
  - It stops when `~/.local/bin/zoho-studio` is something else — a link to another clone or a file — and says what is there. Show that to the person; rerun with `--force` only with their agreement.
  - When `~/.local/bin` is not on `PATH`, it prints the line to add for the person's shell. Pass the line on; do not edit their shell files.

### crm-oas — the OpenAPI spec of Zoho CRM

- **Needed by:** skills that look up the Zoho CRM REST API from a first-hand source instead of memory.
- **Where:** `~/.zoho-studio/references/crm-oas` — a git clone of https://github.com/zoho/crm-oas.
- **Check:** the folder exists and is a git repository (`git -C ~/.zoho-studio/references/crm-oas rev-parse`); then `fetch --quiet` and `status -sb` show whether it is behind.
- **Install:** `git clone https://github.com/zoho/crm-oas ~/.zoho-studio/references/crm-oas` (creates `~/.zoho-studio/references/` if needed).
- **Update:** `git -C ~/.zoho-studio/references/crm-oas pull --ff-only`.
- **Not a git repository:** something else is in the folder — tell the person and leave it.

### context7 — documentation MCP server (optional)

- **Needed by:** the `sources` skill, to look up Zoho's documentation with quotes and links.
- **Check:** `claude mcp get context7` finds the server, or its tools are available in the session.
- **Install:** `claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp` (needs Node.js with `npx`). It works from the next session.
- **Without it:** `sources` falls back to Zoho's documentation on the web; nothing else depends on it.
