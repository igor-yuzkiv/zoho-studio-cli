# Rule: Git

How to work with git in this repository.

## Commits

When creating commits:

* Do not add the AI agent as a co-author and do not include `Co-authored-by` or similar AI attribution.
* Create small, focused commits that represent one logical change.
* Do not mix refactoring, formatting, dependency updates, and functional changes unless they are inseparable.
* Follow the repository's existing commit convention. If none exists, use Conventional Commits.
* Write the subject in the imperative mood, without a trailing period.
* Keep the subject concise and explain what the commit does.
* Use the commit body only when additional context, reasoning, limitations, or migration details are useful.
* Reference a task or issue when its identifier is known.
* Do not commit temporary files, generated artifacts, debug code, secrets, or unrelated changes.
* Review the staged diff before committing.

Recommended format:

```text
<type>(<optional-scope>): <description>

<optional body>

<optional task or issue reference>
```

Common types:

* `feat` — introduces new functionality;
* `fix` — fixes incorrect behavior;
* `refactor` — restructures code without changing behavior;
* `test` — adds or updates tests;
* `docs` — updates documentation only;
* `chore` — maintenance, tooling, or dependency changes;
* `build` — changes the build system or external dependencies;
* `ci` — changes CI configuration.
