# Functions

## The metadata goes as a text field, not as a file

- **Observed:** 2026-10-18, sandbox org (EU), probes for ZS-79 — the file-part run answered every
  create with `INVALID_REQUEST`; its report was overwritten by the later run, so only the text-field
  runs are on disk
- **Spec says:** `metadata` is a mandatory "text" form-data parameter, but the sample request sends it
  as a file: `-F "metadata=@function.json;type=application/json"` (create-function, Sample Request)
- **Actually:** `POST /settings/functions` with `metadata` as a file part answers `400 INVALID_REQUEST`
  ("unable to process your request…"); as a plain text field it answers `201`. A plain JSON body
  with `_code` answers `400 REQUIRED_PARAM_MISSING` for `metadata`. The code works both as a `.ds`
  file part and as `_code` inside the metadata
- **In our code:** `buildFunctionForm` sends the metadata as a text field and the code as a `.ds` file

## Creating a function returns only its id; the changelog is not readable back

- **Observed:** 2026-10-18, sandbox org (EU), probe for ZS-79
- **Spec says:** the same for the id (create-function, Sample Response); the changelog is not in the
  get response schema
- **Actually:** `201 { "functions": [{ "code": "SUCCESS", "details": { "id": "…" } }] }`; update
  answers `200` in the same shape. `GET /settings/functions/{id}` returns `return_type`, `category`,
  `runtime`, `description`, `state: "active"`, but no changelog
- **In our code:** `createFunctionRequest` returns the id; the deployment history is kept locally

## Zoho normalizes the code it stores

- **Observed:** 2026-10-18, sandbox org (EU), probe for ZS-79
- **Spec says:** not documented
- **Actually:** code sent as `"…{\n\treturn \"pong\";\n}\n"` is returned by
  `GET /settings/functions/{id}/code` as `"…{\nreturn \"pong\";\n}"` — leading tabs and the trailing
  newline are dropped
- **In our code:** nothing yet; a pull after a deploy will not match the source byte for byte

## Compilation errors come at the top level with line and position

- **Observed:** 2026-10-18, sandbox org (EU), probe for ZS-79
- **Spec says:** the response "contains the line number, character position, and compilation error
  message" (update-function), without the shape
- **Actually:** `400 { "code": "COMPILATION_ERROR", "message": "function have compilation errors",
  "details": { "param_name": "code", "errors": [{ "line": 3, "index": 0, "message": "The syntax is
  incorrect. Please check the format." }] } }` — not inside the `functions` list
- **In our code:** `toFunctionRequestError` reads the error from `functions[0]` or the top level and
  lists every compilation error with its line and position

## The return type is checked against the category at compile time

- **Observed:** 2026-10-18, sandbox org (EU), probe for ZS-79
- **Spec says:** Button, Related List, Standalone → `string`; Automation → `void` or `string`;
  Schedule, Signals → `void`; Validation Rule → `map` (create-function, "Categories and Return Types")
- **Actually:** a Standalone function declared `void` answers `COMPILATION_ERROR` with "Invalid return
  type 'void' for category 'Standalone'. Allowed types: [string]". Only Standalone was probed
- **In our code:** `delugeReturnTypesByCategory` in `zoho-crm.config.ts`; the scaffold refuses any
  other return type

## The declaration name is matched ignoring case

- **Observed:** 2026-10-18, sandbox org (EU), probe for ZS-79
- **Spec says:** the declaration is the category and the name in lower case with spaces replaced by
  underscores (create-function, Note under Input JSON); the docs' own sample uses camel case
- **Actually:** `zsProbeCamel` declared as `standalone.zsProbeCamel()` and `zsProbeLower` declared as
  `standalone.zsprobelower()` were both created; `zs-probe-dash` declared as
  `standalone.zs_probe_dash()` was created too
- **In our code:** `buildFunctionStub` lower-cases both parts and turns spaces and `-` into `_`;
  `hasFunctionDeclaration` compares ignoring case, and Import warns when the code does not match

## API names are unique ignoring case, and cannot be changed

- **Observed:** 2026-10-18, sandbox org (EU), probe for ZS-79
- **Spec says:** duplicate API names answer `DUPLICATE_DATA`; the API name cannot be updated
  (update-function); case is not mentioned
- **Actually:** creating `zs_probe_ping` again, or as `ZS_PROBE_PING`, answers
  `400 { "functions": [{ "code": "DUPLICATE_DATA", "message": "Api name duplicate" }] }`. An update
  carrying `api_name` answers `400 NOT_ALLOWED` "Api name update is not allowed", inside `functions`
- **In our code:** a new function is refused when a source folder with the same API name in any case
  exists; the update request never sends `api_name`, `category` or `runtime`

## Updating a deleted function answers INVALID_DATA

- **Observed:** 2026-10-18, sandbox org (EU), probe for ZS-79
- **Spec says:** `INVALID_DATA` for an invalid function id (publish-function)
- **Actually:** `PUT /settings/functions/{id}` after the function was deleted answers
  `400 { "code": "INVALID_DATA", "message": "invalid data", "details": { "resource_path_index": 2 } }`
- **In our code:** `FunctionRequestError` carries the code, so a deploy can tell this case apart

## Running a function's code without saving it

Undocumented; described in full in [functions-run.md](functions-run.md).
