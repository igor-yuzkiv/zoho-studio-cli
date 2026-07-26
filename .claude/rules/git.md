# Rule: Git

How to work with git in this repository. Commits are covered today; other areas — branches, history
rewriting, releases — are added here as they are needed.

Commit and push only when the user asks for it.

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

Good examples:

```text
refactor(shared): move API client into shared layer
```

```text
feat(functions): add command for fetching CRM functions
```

```text
fix(config): preserve existing settings during initialization
```

```text
test(api): cover expired token handling
```

```text
docs: document project initialization flow
```

Examples to avoid:

```text
updates
```

```text
fix stuff
```

```text
changed files
```

```text
refactor and fix tests and update dependencies
```
