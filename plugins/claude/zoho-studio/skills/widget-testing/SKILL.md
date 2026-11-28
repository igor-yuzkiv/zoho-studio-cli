---
name: widget-testing
description: Tests Zoho CRM widgets of a zoho-studio project locally — finds the SDK calls a widget makes, mocks them in scenarios, writes and runs Playwright e2e tests against the emulated Zoho CRM, and reports with screenshots and the SDK call log. Use when the person asks to test, run, check or debug a widget without Zoho, and on your own before saying a change to a widget's code is done.
---

# Widget testing

Runs a widget that is already served somewhere inside zoho-studio's emulated Zoho CRM and checks its behavior with Playwright tests. The emulator, the scenario format, the mock keys and the test fixture are described by `zoho-studio instructions z-crm:widgets` and `zoho-studio instructions z-crm:widgets:serve` — read both before the first step; this skill is the order of work and what to agree with the person. How the Zoho widget SDK itself behaves (what a method answers in Zoho, its errors, the `PageLoad` data of a location) is in `/zoho-studio:sources`.

## Goal

The widget's behavior the person cares about is covered by tests that pass, and the person saw the result with screenshots and knows what could not be tested locally.

## Workflow

1. **Clean up an old copy.** A project created by an older `zoho-studio init` has `.claude/skills/zoho-crm-widget-testing/`, a copy of this skill that no longer matches the CLI. If it is there, tell the person and offer to delete it.
2. **Find the widget** — `widgets/<name>/widget.json`. None — create it with `z-crm:widgets:make`; ask the person for the address the widget runs at, how it is started, and where its code is when it is not in `widgets/<name>/src/`. With `run` in `widget.json` the emulator starts the widget itself; without it, check the widget answers at its `url`, and if not, ask the person to start it or to give the command for `run`.
3. **List the SDK calls** the code at `source` makes, as the instructions describe: for each call — the method, the `Entity`, and what the code reads from the answer. Mark the calls the emulator does not run, and tell the person which flows cannot be tested locally because of them.
4. **Agree on what to test** when the person did not say: propose the behaviors — what is shown in a situation, what the widget sends to Zoho after an action, how it shows an error — and take their choice. Before saying a change of yours is done, test the changed behavior without asking.
5. **Write the mocks, the scenarios and the tests.** Answers go into files of `testing/mocks/`, grouped by what they serve (the record, saving, errors), so scenarios and tests share them through `use`. One `default` scenario for the record the widget opens on; a test changes an answer through its own `use` or inline `mocks` — a mock with logic goes into a file, because inline mocks cross from the test process as data. Mock answers in the shape Zoho sends — look it up in `/zoho-studio:sources` when unsure. One test — one behavior, seen from the user's side, with a screenshot of the state it checks.
6. **Run** the tests. The first run in a project needs Playwright and a browser downloaded: ask the person before installing them. A test failing on an SDK call — read its `calls.json`, fix the mock or the test, and run again; a failure that shows a bug in the widget is a finding for the person, not a test to bend.
7. **Report.**

## Rules

- Mock data is invented: realistic values, field API names from the pulled `data/`, never personal data copied from a real organization.
- Assert what the user sees and what the widget sends — the call's `args` — not the widget's internals; such tests survive a refactor of the widget.
- Leave the widget's code alone while testing it; a bug you find goes into the report, and a fix is a separate change the person agrees to.
- Say in every report that the tests ran against an emulator and mocks: they show the widget handles those answers, not that it works in Zoho.

## Output

- Which tests passed and which failed, with the paths of the screenshots that show the behavior (`widgets/<name>/results/<test>/*.png`).
- For a failure — the relevant `calls.json` entries and whether the widget or the mock is wrong.
- The calls and flows that could not be tested locally.
