---
name: release
description: "Release a new version of zoho-studio from develop into master: version bump, change log, merge, annotated tag. Use when the user asks to release a version, or when a release looks due — then propose it and start only after the user agrees."
argument-hint: "[version]"
---

# Release

Releases what is in `develop` as a new version and brings it into `master`. Runs when the user asks
for a release, or after they agree to one you proposed — never on your own initiative alone. The
version number and the moment of the release are the user's; how to choose a number is in
`.claude/rules/versioning.md`, the branch model in `.claude/rules/git.md`.

## Goal

`master` carries the new release: the release commit with the version and the change log is on
`develop`, `develop` is merged into `master`, and the merge commit has an annotated tag
`v<version>`.

## Workflow

1. **Check the state.** The working tree is clean, `develop` and `master` exist, `bun run check`
   passes on `develop`. Work branches not yet merged into `develop` are not part of the release —
   list them (`git branch --no-merged develop`) so the user knows. Stop on anything else in the way.
2. **Collect the changes** that `develop` brings since the last tag (`git describe --tags
   --abbrev=0 master`; no tag yet — the whole history): `git log <tag>..develop` and the diff
   itself. Read the code and docs that changed: commit subjects alone are incomplete.
3. **Check the agent instructions.** For every change collected in step 2 — a command, an option,
   a file format, a check, an error, a finding — read the texts that describe it in
   `apps/cli/src/commands/instructions/texts/` (`.claude/rules/instructions.md`) and compare them
   with the code. Run `bun run dev -- instructions <name>` for each changed command. A text that is
   wrong or missing is fixed in its own `docs` commit on a work branch, merged into `develop` after the
   user's review, before the release continues; list what was checked and what was fixed for the user.
   Then compare the tools, services, and repositories the plugin skills name with
   `plugins/claude/zoho-studio/references/dependencies.md` (`.claude/rules/dependencies.md`); a
   missing or stale entry is fixed the same way.
4. **Propose the version.** Recommend `PATCH`, `MINOR`, or `MAJOR` with the reason; a version passed
   as an argument is used as is. Done when the user confirms the number.
5. **Bump the version** on `develop` in the root `package.json` and in
   `plugins/claude/zoho-studio/.claude-plugin/plugin.json` — the same number
   in both.
6. **Write the change log** `CHANGELOG/v<version>.md` by
   [changelog-template.md](changelog-template.md): what a user of the CLI and the plugin gets, not
   a list of commits.
7. **Check:** `bun run check` passes.
8. **Review.** Show the version and the change log to the user (through Plannotator when it is a
   long text) and wait for their approval.
9. **Commit** on `develop`: `chore(release): v<version>` with the version bump and the change log
   only.
10. **Merge into `master`:** `git switch master && git merge --no-ff develop -m "Release
   v<version>"`.
11. **Tag** the merge commit: `git tag -a v<version> -m "v<version>"`. Switch back to `develop`.
12. **Push** `develop`, `master`, and the tag when the user asks or agrees to it — offer it once
    the release is done; otherwise name the commands left to run:
    `git push origin develop master` and `git push origin v<version>`.

## Rules

- `master` changes only through this skill; a release always comes from `develop`.
- The release commit contains nothing but the version bump and the change log.
- One version — one tag and one change log file. Change log files are not rewritten after the
  release.
- A release does not go out with agent instructions that contradict its code.
- Write the change log from the actual changes since the last tag, not from memory or task
  descriptions, which can be incomplete or outdated.

## Output

- The version, the release commit, the merge commit, and the tag.
- The path to the change log.
- Whether it was pushed, or the commands left to push it.
