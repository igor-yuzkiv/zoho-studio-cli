---
id: yagni
title: YAGNI — you aren't gonna need it
kind: principle
binding: guidance
description: Build for the requirement you have, not the one you can imagine.
applies_to: [code, decisions]
use_when:
  - adding a parameter, hook, layer, or configuration option nobody asked for
  - a review comment proposes an abstraction "for the future"
skip_when:
  - the second use case is already specified and scheduled, not merely plausible
---

# YAGNI — you aren't gonna need it

**Build for the requirement in front of you. Not the one you can imagine arriving.**

Generalization written before the second case exists is a guess about what the second case will look like. That guess is usually wrong in a specific way: the abstraction fits the imagined case and fights the real one, and by the time the real one arrives the abstraction has callers.

The pair to [[kiss]]. KISS asks whether the shape is as simple as it can be. YAGNI asks whether it should exist at all yet.

## The usual disguises

- A parameter with one caller passing a constant.
- A configuration option nobody has asked to configure.
- An interface with one implementation.
- A hook or extension point with nothing extending it.
- A "generic" helper serving exactly one shape of input.

Each is cheap to add and expensive to remove, which is the wrong way round.

## The test

**Can you name the second case?** Not imagine it — name it: a real requirement, a scheduled feature, an existing caller. If you cannot, the generalization is speculative.

Two real cases is when the shared shape becomes visible. Before that, you are inferring it, and [[dry]] applies here too: duplication is cheaper than the wrong abstraction.

## In review

"This should be more extensible" is not a finding unless it names the extension. A recommendation to generalize needs a concrete use case attached, or it is a preference — see [[evidence-and-claims]].
