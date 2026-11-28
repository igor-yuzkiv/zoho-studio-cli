---
paths:
  - "packages/**"
---

# Rule: Package READMEs

`packages/<name>/README.md` is how an agent in a user's project learns the package API: it reads it as `node_modules/@zoho-studio/<name>/README.md` before writing a script, then follows the imports into the sources. Search tools skip `node_modules`, so the README is the map; a name it gives that no longer exists sends the agent the wrong way.

- **What it holds:** what the package is for, the entry points a script starts from, and a few short examples that run. Not every export — the types and `src/index.ts` are the full list.
- **When to update:** in the same change that adds, renames, or removes a public export a README names, changes what an entry point does, or adds an entry point a script would start from.
- **Examples compile:** the code in a README uses names that exist, with the current signatures.
- **No secrets, no real organization data** in examples.

Before a release, `/release` compares the READMEs with the exports changed since the last tag.
