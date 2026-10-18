# Functions

## The Deluge declaration is derived from the category and the display name

- **Observed:** **Assumed** — from the API docs, not yet seen on an org (ZS-77)
- **Spec says:** the declaration must be the category and the function's name, each in lower case
  with spaces replaced by underscores (create-function, "Note" under Input JSON); the docs' own
  sample declares `standalone.restoreDealByNameTest`, in camel case
- **Actually:** not observed yet; the camel-case sample contradicts the lower-case rule. Whether
  `-` in a display name becomes `_` is not documented
- **In our code:** `buildFunctionStub` lower-cases both parts and turns spaces and `-` into `_`

## The return type is fixed by the category

- **Observed:** **Assumed** — from the API docs, not yet seen on an org (ZS-77)
- **Spec says:** Button, Related List, Standalone → `string`; Automation → `void` or `string`;
  Schedule, Signals → `void`; Validation Rule → `map` (create-function, "Categories and Return Types")
- **Actually:** not observed yet
- **In our code:** `delugeReturnTypesByCategory` in `zoho-crm.config.ts`; the scaffold refuses any
  other return type

## Whether API names are compared case-insensitively is unknown

- **Observed:** **Assumed** — open question (ZS-77)
- **Spec says:** not documented
- **Actually:** not observed yet
- **In our code:** a new function is refused only when a folder with exactly the same API name exists
