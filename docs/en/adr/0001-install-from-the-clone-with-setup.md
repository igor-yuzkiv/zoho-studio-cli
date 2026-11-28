# 0001. The CLI is installed from a clone of its repository with `bun run setup`

- **Status:** Accepted
- **Date:** 2026-11-28

## Decision

The CLI is installed and updated from a local clone of its repository by one script, `bun run setup`: it builds the executable, links it as `~/.local/bin/zoho-studio`, and registers the framework packages with `bun link`. It supports macOS and Linux; on Windows it stops with an explanation. It never runs `git pull`: updating is `git pull`, then `bun run setup`.

## Context

- Projects made by `zoho-studio init` import the framework packages (`@zoho-studio/core`, `auth`, `zoho-crm`) through Bun's link registry, which points at the sources of a clone. A clone has to be on the machine anyway.
- The Claude Code plugin is installed from the same clone, so its skills and the CLI come from one place and one version.
- Before this decision installing took four manual steps that people and agents repeated by hand, and updating was easy to get half done.
- The setup skill of the plugin has to install and update the CLI, and a person has to be able to do the same without an agent.

## Alternatives

- **Prebuilt executables per release.** Rejected for now: project scripts would still need the packages from a clone, and publishing binaries needs a build pipeline the project does not have.
- **A global npm package.** Rejected: the packages have no build step and are consumed as TypeScript sources through the link registry; publishing would add a build and a registry to maintain.
- **Steps in the setup skill instead of a script.** Rejected: a script is idempotent, testable, and works without an agent; the skill only calls it.
- **`setup` pulls the repository itself.** Rejected: the script would have to decide what to do with local changes or another branch. One script, one job; the person or the skill pulls.

## Consequences

- Installing is `git clone` and `bun run setup`; updating is `git pull` and `bun run setup`. Running it again is safe.
- A link that points at another clone, or a file in its place, stops the script; `--force` replaces it, `--bin-dir` installs elsewhere.
- The script does not edit shell files: when the folder is not on `PATH`, it prints the line to add for the user's shell.
- Bun and git are prerequisites the script checks by using them, not something it installs.

## Limits

Revisit when the CLI must be installed without Bun or without a clone — for users who do not develop scripts, or for Windows — or when the packages get a build step and a registry.
