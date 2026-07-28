---
id: plain-language
title: Plain language
kind: principle
binding: guidance
description: Describe behaviour rather than implementation, and keep terminology stable.
applies_to: [text, client-communication]
use_when:
  - a document will be read by a mix of client, PM, designer, QA, and developer
---

# Plain language

**A document should make sense to the client, the PM, the designer, QA, and the developer — including readers who have never seen the code and were not in the earlier discussions.**

Simple does not mean shallow. Rules, exceptions, dependencies, and limits all stay; they just get explained without jargon and without assumed context.

Close to [[eli5]]. Plain language adds two things on top of it: **describe behaviour, not implementation**, and **keep terminology stable**.

## Describe behaviour, not implementation

Lead with:

- who performs the action;
- under what conditions it is available;
- what the system checks;
- what result the user gets;
- what the system does next.

Instead of:

> After the endpoint is called, the system creates a record via automation.

Write:

> After the form is submitted, the system creates a separate Contractor Loss Report for each route.

Names of endpoints, classes, tables, and automations belong in the text only where they are needed for maintenance, integration, or to state a limit precisely.

## Keep terminology stable

- One entity, one name, in every document.
- Explain a non-obvious term the first time it appears.
- Do not invent synonyms for stylistic variety — in a specification, a synonym reads as a second thing.
- Put shared domain terms in the project's long-term store rather than redefining them per document — see [[dry]] and [[artifact-routing]].
- Keep established product and domain names in the language the team actually uses for them.

## Practical rules

- Short sentences, concrete verbs.
- One paragraph, one idea.
- Sequences as numbered lists.
- Business rules as separate, checkable statements.
- Examples wherever a rule could be read two ways.
- Every diagram gets text: what it shows, where the process starts, what comes out.

## Check

- Would someone new to the topic follow this?
- Are the important terms explained?
- Can the jargon be removed without losing precision?
- Does the main text describe the product, rather than the code structure or an accident of UI layout?
