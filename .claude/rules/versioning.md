# Rule: Versioning and releases

The repository has one version, shared by the CLI and the Claude Code plugin: `version` in the root
`package.json` and in `plugins/claude/zoho-studio/.claude-plugin/plugin.json`.
The skills rely on `zoho-studio instructions` of the same version, so the two never drift apart.

Use Semantic Versioning, `MAJOR.MINOR.PATCH`:

- `PATCH` (`1.0.0 → 1.0.1`) — fixes and small changes without new functionality.
- `MINOR` (`1.0.1 → 1.1.0`) — new commands, options, or skills; a noticeable extension of existing
  behavior that does not break it.
- `MAJOR` (`1.1.0 → 2.0.0`) — a change that makes users adapt: a removed or renamed command or
  option, a changed project layout or settings format.

Each release has an annotated tag `v<version>` and a change log `CHANGELOG/v<version>.md`.

Only the user decides the version number and the moment of a release. Use the rules above to
recommend a number, never to apply one on your own.

Without the user's explicit permission in the current session, do not:

- change `version` in `package.json` or `plugin.json`;
- create a tag;
- add or edit a file in `CHANGELOG/`.

Permission for one release does not extend to the next. A release is made only with the
`/release` skill.
