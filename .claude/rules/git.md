# Rule: Git

How to work with git in this repository.

## Branches

- `master` holds only released versions: it changes only through a release.
- `develop` holds everything that passed review, released or not.
- Each piece of work goes in its own branch from `develop`: `feature/<topic>` or `fix/<topic>`.
  After the user's review it is merged into `develop`; nothing goes into `develop` or `master`
  directly.
- A release is made from `develop` with the `/release` skill: the release commit lands on
  `develop`, then `develop` is merged into `master` and tagged. There are no release branches.

## Commits

* Create small, focused commits that represent one logical change.
* Do not mix refactoring, formatting, dependency updates, and functional changes unless they are inseparable.
* Use Conventional Commits. Older history contains bare-noun subjects (`login`, `init and settings`) — do not imitate them.
* Write the subject in the imperative mood, without a trailing period.
* Use the commit body when context, reasoning, or a limitation is worth recording.
* Do not commit temporary files, generated artifacts, debug code, secrets, or unrelated changes.
* No AI-agent attribution in commits (it is also turned off in the settings).

Format:

```text
<type>(<optional-scope>): <description>

<optional body>

<optional task reference>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`.

Scope is the area touched, named as in `src/` and in the singular or plural form already used for
it: `functions`, `fields`, `modules`, `logger`, `utils`, `shared`.

## Task references

A task key (`ZS-<number>`, the `ZS` workspace in Workbench) is optional. When it helps, put it
alone on the last line of the body, separated by a blank line — a plain line, not a `Refs:`
trailer:

```text
feat(fields): add the fields:pull command

Fields are pulled per module, so a failure for one module does not
abort the rest of the run.

ZS-5
```
