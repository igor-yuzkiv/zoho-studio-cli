# z-crm:widgets:make

Creates `widgets/<name>/`: `widget.json`, `testing/scenarios/default.ts` (PageLoad for one record,
`use: ['record']`), `testing/mocks/record.ts` (a mock of `API.getRecord`),
`testing/tests/<name>.spec.ts` (opens the widget, takes a screenshot), and `playwright.config.ts`
at the project root when there is none. It does not create `src/`.

- **Writes to Zoho:** no. **Needs login:** no. **Needs a terminal:** no — it asks nothing.

## When to use

To start testing a widget. `--name` and `--url` are required. `--run` stores the command that
starts the widget, so tests and `serve` start it themselves. `--source` only for code outside
`widgets/<name>/src/` (relative to the widget folder or absolute). A name that already has a
`widget.json` is refused.

To run the test, Playwright has to be in the project once: `bun add -d @playwright/test` and
`bunx playwright install chromium`.
