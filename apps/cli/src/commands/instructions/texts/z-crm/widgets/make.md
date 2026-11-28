# z-crm:widgets:make

Creates `widgets/<name>/` for a widget that already runs: `widget.json`, `scenarios/default.ts`
(PageLoad for one record and a mock of `API.getRecord`), `tests/<name>.spec.ts` (opens the widget,
takes a screenshot), and `playwright.config.ts` at the project root when there is none.

- **Writes to Zoho:** no. **Needs login:** no. **Needs a terminal:** no — it asks nothing.

## When to use

To start testing a widget. `--name` and `--url` are required; give `--source` so the code can be
found later. A name that already has a `widget.json` is refused.

To run the test, Playwright has to be in the project once: `bun add -d @playwright/test` and
`bunx playwright install chromium`.
