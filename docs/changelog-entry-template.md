# Changelog Entry Template

Use this template when drafting entries for `docs/CHANGELOG.md`.
Omit any field or section marked **optional** when it does not apply.

---

```markdown
## [ISSUE_NUMBER] Title — YYYY-MM-DD

Tags: `tag1` `tag2`
PR: [#PR_NUMBER](https://github.com/OWNER/REPO/pull/PR_NUMBER)
<!-- For multiple PRs use PRs: [#111](url), [#222](url) -->
<!-- For a PR in a sibling repo, qualify it: PRs: [api#111](url), [web#88](url) -->
Builds on: #XXXXX, #XXXXX  <!-- optional: issue numbers this one extends or depends on -->

### What was built
<!-- Bullet list of concrete deliverables visible in the diff:
     new classes, endpoints, handlers, migrations, tests, infra changes, etc.
     One bullet per meaningful unit of work. Be specific — include file/class names. -->

### Key decisions reflected in the diff
<!-- Notable trade-offs, patterns chosen, or intentional omissions visible in the code.
     Omit this section if there is nothing worth calling out. -->  <!-- optional -->
```

---

## Tag taxonomy

Apply all tags that fit. Tags align with the memory bank domains so the spec planner can load
relevant changelog entries when planning related work.

> **Tailor this table to your project.** The rows below are a taxonomy from an earlier
> project, kept as a worked example. Delete the rows that do not apply and add your own —
> but keep the tags aligned with the files under `docs/specs/memory/`, because that alignment
> is what lets the spec planner find prior art.

| Tag | Use when the story… |
|---|---|
| `api` | adds or modifies HTTP endpoints |
| `acl` | adds or modifies resource-based ACL provisioning or enforcement |
| `event-handling` | adds Service Bus subscriptions, event/command handlers, or async command flows |
| `http-client` | adds or modifies an HTTP client under `Application/_Shared/HttpClients` |
| `infrastructure` | changes cloud provisioning (bicep, queues, topic subscriptions) |
| `outbox` | adds outbox write or dispatch registrations |
| `sql` | adds EF Core entities, migrations, or schema changes |
| `domain` | adds or modifies domain entities, value objects, or domain logic |
| `feature-toggle` | adds a new feature flag key |

---

## Rules

- **Diff is authoritative.** Do not describe things the spec planned but the diff does not show.
- **Key decisions** — only include decisions that are *visible in the code*; do not copy-paste spec rationale that has no code counterpart.
- **Builds on** — link to prior issues whose infrastructure or contracts this one directly uses or extends.
- **Spec-only PRs** — if the PR only contains a spec plan file, do not draft an entry; flag it as "spec-only, implementation not yet merged".
- Entries in `docs/CHANGELOG.md` are ordered **newest merge date first**.
