---
id: permissions-and-authorization
title: Permissions and authorization
kind: coverage
binding: guidance
description: Who may see and do this, where the check actually sits, and what changes for roles that already exist.
applies_to: [code, decisions]
use_when:
  - a new endpoint, action, page, or data set appears
  - existing data becomes visible somewhere new
  - a role, scope, or ownership rule changes
skip_when:
  - nothing user-facing or data-reaching changes
questions:
  - Who is allowed to do this, and who is explicitly not?
  - Where is the check — one place, or does every caller repeat it?
  - Does this expose existing data to someone who could not see it before?
  - What happens on denial — error, empty result, or hidden control? Are those consistent?
  - Are records filtered by ownership, or only by role?
  - Can a user reach another user's record by changing an identifier?
red_flags:
  - authorization enforced only in the UI
  - a list endpoint that filters by role but not by ownership
  - a new route added next to protected ones without its own check
  - endpoints called internal and assumed unreachable
escalate_if:
  - the correct rule depends on a business decision about who should have access
  - an existing role would gain or lose access as a side effect
---

# Permissions and authorization

Two distinct failures live here, and only the first is usually checked.

**Can they call it** — role and scope. Normally caught.

**Should they see this particular record** — ownership and tenancy. Routinely missed, because the endpoint looks protected and the list looks filtered. A correct role check with no ownership filter hands every record in the table to any authenticated user.

The second question to ask on any list or detail endpoint: *what stops a user from passing an identifier that is not theirs?*
