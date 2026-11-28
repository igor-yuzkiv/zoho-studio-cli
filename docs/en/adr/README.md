# Architecture decisions (ADR)

Important decisions about zoho-studio: what was decided, why, and what follows from it. An ADR is
needed when a decision makes no sense without the reason behind it, or when someone will want to
revisit it.

[Українською](../../ua/adr/README.md)

## When to write one

Write an ADR for a decision that is expensive or hard to reverse. The code shows *how* things work,
not *why* they were chosen that way, and the reasons are forgotten faster than the code.

A decision is worth an ADR when:

- it is hard or costly to undo: it changes a contract, a data or file format, where files live that
  user projects depend on, or the way the tool is installed;
- there were real alternatives, and the reason for the choice is worth remembering;
- the current behavior of the CLI is not understandable without it.

A decision that is easy to undo, an implementation detail, or a one-off agreement needs no ADR: a
commit message is enough. An ADR is also a way to think a decision through — if it cannot be
stated clearly, the decision may not be ready.

An ADR is added only with the user's agreement.

## Format

File `NNNN-<topic>.md`: a four-digit number in order and a kebab-case topic
(`0001-single-repository-version.md`). Numbers are never reused. The same file exists in
`docs/ua/adr/`.

```markdown
# NNNN. <The decision in one sentence>

- **Status:** Accepted | Superseded by [NNNN](NNNN-<topic>.md) | Rejected
- **Date:** YYYY-MM-DD

## Decision

<What was decided — briefly, first.>

## Context

<The constraints and circumstances: requirements, compatibility, cost, the acceptable price of a
mistake.>

## Alternatives

<What was considered and why it was rejected. May be left out when there were none.>

## Consequences

<What follows: what becomes simpler, what becomes harder, which rules appear.>

## Limits

<When the decision fits and what would make it obsolete — the signal to revisit it.>
```

An accepted ADR is not rewritten: it records what was decided and why at that moment. When a
decision is revisited, a new ADR is written and only the status of the old one changes.

## Decisions

| ADR | Decision | Status |
|---|---|---|
