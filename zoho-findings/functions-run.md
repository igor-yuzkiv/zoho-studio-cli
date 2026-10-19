# Running a function's code without saving it

Zoho's Deluge editor has a Run button that executes the code in the editor, saved or not, and shows
its result and logs. The API behind it is not documented and is missing from the list of supported
APIs, but it answers an OAuth token like any other endpoint. `z-crm:functions:run` is built on it.

## The endpoint

- **Observed:** 2026-10-19, sandbox org (EU): the Run button in the browser (DevTools), then a
  project script with an OAuth token, and `z-crm:functions:run`
- **Spec says:** not documented; `GET /__apis` lists no `actions/test` path, neither for v7 nor v8
- **Actually:** `POST /crm/{version}/settings/functions/{name}/actions/test` works on v7 — what the
  browser calls — and on v8, with `Authorization: Zoho-oauthtoken …`. None of the browser's own
  headers (`x-zcsrf-token`, `x-crm-org`, cookies) is needed.
- **In our code:** `runFunctionRequest` sends it on the configured API version

## The request

```json
{
    "functions": [
        {
            "script": "string button.btn_test(String id)\n{\n\tinfo id;\n\treturn \"\";\n}",
            "arguments": { "id": "1123" }
        }
    ]
}
```

- `script` — the whole code, declaration included, as the editor holds it.
- `arguments` — one entry per argument of the declaration, by name. The browser sends the values as
  text.

## The code that runs is the one sent

- **Observed:** 2026-10-19, sandbox org (EU), `z-crm:functions:run --from src` after editing the
  code in `src/` without deploying it
- **Spec says:** not documented
- **Actually:** the logs and the result came from the edited code: Zoho runs the `script` of the
  request, not the version it has saved or published, and saves nothing
- **In our code:** `z-crm:functions:run` sends the code of `src/` or `data/` as it is, so a change
  can be tried before a deploy

## The answer

- **Observed:** 2026-10-19, sandbox org (EU), the Run button in the browser
- **Spec says:** not documented
- **Actually:** `200` with one entry in `functions`:

```json
{
    "functions": [
        {
            "status": "success",
            "output": {
                "line_number": 11,
                "data_type": "string",
                "time": "2026-10-19T20:23:29.351+03:00",
                "value": "test"
            },
            "metrics": {
                "statements_executed": 7,
                "webhook": 0,
                "time_taken_in_ms": 6,
                "integration_task": 0,
                "send_mail": 0,
                "send_sms": 0
            },
            "logs": [
                {
                    "line_number": 3,
                    "function_name": "btn_test_zoho_studi_btn_2",
                    "data_type": "string",
                    "time": "2026-10-19T20:23:29.351+03:00",
                    "category": "info",
                    "value": "1"
                }
            ]
        }
    ]
}
```

  - `output` — the returned value, with its Deluge type and the line of the `return`.
  - `logs` — one entry per `info` statement, in order; maps and lists come as text (`{"test":"13"}`,
    `1,2`).
  - `metrics` — what the run consumed, including the integration tasks, mails and SMS it sent.
- **In our code:** the command prints the answer as it is and exits with 1 when `status` is not
  `success`

## Still assumed

- **Assumed:** the path takes the API name. It was seen only with functions whose name and API name
  are the same.
- **Assumed:** a compilation error comes as it does for a create or update — `COMPILATION_ERROR` at
  the top level with `details.errors` — so the command reports it the same way. Not seen yet.
- **Assumed:** the scopes the project has by default are enough; which one the endpoint checks is
  not known. The defaults include `ZohoCRM.settings.ALL`.
- **Assumed:** a function that does not exist in Zoho yet, never deployed, cannot be run this way.
  Not tried.
