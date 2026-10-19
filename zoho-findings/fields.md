# Fields

## A field's own API name is accepted on create

- **Observed:** 2026-10-13, sandbox org, probe for ZS-59
- **Spec says:** `api_name` appears in the per-type blocks but not in the item properties, which
  forbid additional properties (fields.yaml:4041-4800)
- **Actually:** `POST /settings/fields` with `api_name: Probe_Code_Own` created the field under
  that name
- **In our code:** `api_name` is an optional builder option for every type

## A picklist takes more than 10 values, and Zoho adds "-None-"

- **Observed:** 2026-10-13, sandbox org, probe for ZS-59
- **Spec says:** `pick_list_values` takes at most 10 items per request
- **Actually:** a picklist with 12 values was created; the stored field starts with `-None-`
  before the given values
- **In our code:** no limit on the number of picklist values

## Create answers 207 with one result per field

- **Observed:** 2026-10-13, sandbox org, `bun run migrate` (ZS-66)
- **Spec says:** the same (createFields examples); the 201 schema caps the list at 5 items, a typo
  for 25
- **Actually:** a request with one valid and one invalid field created the valid one and answered
  207 with a result per field, in request order
- **In our code:** `createFieldsRequest` returns a result per field; the runner stops after a
  batch with any failure

## Payloads that work for each supported type

- **Observed:** 2026-10-13, sandbox org, probe for ZS-59
- **Actually:** all 17 types were created in one request with these type-specific properties —
  text/phone `length`; textarea `textarea.type` (`small`, `large`, `rich_text`); integer/bigint
  `length`; double `length`, `decimal_place`; percent `decimal_place`; currency `decimal_place`
  plus `currency.{rounding_option, precision}`; picklist/multiselectpicklist `pick_list_values`
  of `{display_value, actual_value}`; lookup `lookup.{display_label, module.api_name}`; email,
  website, date, datetime, boolean, userlookup none
- **In our code:** `toPayload` of each type in `migrations/definition/fields/<type>/<type>.field.ts`;
  `field-schema.builder.spec.ts` asserts exactly these payloads

## A static text tooltip is accepted only on fields typed into

- **Observed:** 2026-10-13, sandbox org, `bun run migrate` with one field of each type (ZS-66)
- **Spec says:** `tooltip.name` is `static_text` or `info_icon` for any field; the value is at most
  35 characters for `static_text` and 255 for `info_icon` (fields.yaml:4105-4130)
- **Actually:** `static_text` was accepted on text, email, phone, website, integer, bigint, double,
  percent, currency, and lookup. date, datetime, boolean, picklist, multiselectpicklist, and
  userlookup were answered `DEPENDENT_MISMATCH` — "Invalid tooltip type static_text for data type
  <type>". textarea is untested: it failed for the reason below first.
- **In our code:** `staticTextTooltip` of each field type allows `static_text` only on the accepted
  types (textarea excluded until tested); the migration validation limits it to 35 characters

## A textarea needs a size

- **Observed:** 2026-10-13, sandbox org, `bun run migrate` (ZS-66)
- **Spec says:** `textarea.type` is optional
- **Actually:** a textarea created without `textarea` was answered `DEPENDENT_FIELD_MISSING` —
  "Dependent field is missing"; with `textarea.type: "large"` it was created
- **In our code:** `fields/textarea/textarea.field.ts` sends `textarea.type: "small"` when the
  migration names no size
