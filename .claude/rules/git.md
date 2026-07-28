# Rule: Git

How to work with git in this repository.

## Commits

* Do not add the AI agent as a co-author and do not include `Co-authored-by` or similar AI attribution.
* Create small, focused commits that represent one logical change.
* Do not mix refactoring, formatting, dependency updates, and functional changes unless they are inseparable.
* Use Conventional Commits. Older history contains bare-noun subjects (`login`, `init and settings`) — do not imitate them.
* Write the subject in the imperative mood, without a trailing period.
* Use the commit body when context, reasoning, or a limitation is worth recording.
* Do not commit temporary files, generated artifacts, debug code, secrets, or unrelated changes.

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

Project Office task keys are `ZS-<number>`. When the identifier is known, put it alone on the last
line of the body, separated by a blank line:

```text
feat(fields): add the fields:pull command

Fields are pulled per module, so a failure for one module does not
abort the rest of the run.

ZS-5
```

Nothing parses this as a git trailer — it is a plain line, and that is the established convention
here. Do not convert it to `Refs: ZS-5` in one commit while the rest of the history uses the bare
form.
