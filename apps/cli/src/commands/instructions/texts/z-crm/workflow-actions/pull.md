# z-crm:workflow-actions:pull

Downloads every workflow action with its full configuration, one JSON file per action, in a folder per type: `email-notifications`, `field-updates`, `tasks`, `webhooks`, `functions`.

- **Writes to Zoho:** no. **Writes locally:** `data/zoho-crm/workflow-actions/`. **Needs login:** yes.

## When to use

To read what a rule's actions actually do. A `functions` action names the function and its
arguments; the Deluge code is in `z-crm:functions:pull`. `--type` and `--module` narrow the run.

## Side effects

A few actions come back from Zoho without details; their files hold the list entry and the summary
names them. A type whose list fails keeps its folder.
